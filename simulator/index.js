import { readFileSync, existsSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import {
  DEFAULT_THRESHOLDS,
  assertContract,
  buildInitialActuators,
  buildStatus,
  buildTelemetryEntry,
  evaluateAuto,
  evaluateCommand,
  expireManuals,
  validateThresholds,
} from "./contract.js";
import { faultForSensors, nextSensors } from "./synthetic.js";

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, value = true] = arg.replace(/^--/, "").split("=");
  return [key, value];
}));

if (args.check) {
  assertContract();
  console.log("simulator contract check passed");
  process.exit(0);
}

loadDotEnv();

const config = {
  apiKey: required("SNOWBERRY_API_KEY"),
  projectId: required("SNOWBERRY_PROJECT_ID"),
  deviceId: process.env.SNOWBERRY_DEVICE_ID || "snowberry-001",
  email: required("SNOWBERRY_DEVICE_EMAIL"),
  password: required("SNOWBERRY_DEVICE_PASSWORD"),
  scenario: String(args.scenario || "normal"),
};

let auth = null;
let tokenExpiresAt = 0;
let thresholds = { ...DEFAULT_THRESHOLDS };
let lastThresholdUpdate = -1;
let lastCommandId = "";
let sensors = null;
let actuators = buildInitialActuators();
let commandAck = { ack_command_id: "", ack_status: "", ack_at: null, ack_message: "" };
let telemetryBuffer = [];
let lastStatusWrite = 0;
let lastTelemetryWrite = 0;
let lastCommandPoll = 0;
let lastThresholdPoll = 0;
let offlineUntil = 0;
let invalidConfigLatched = false;
const fallbackManualUntil = new Map();
const device = {
  wifi_rssi: -62,
  ip_address: "127.0.0.1",
  firmware_version: "simulator-0.1.0",
  started_at: Date.now(),
  nvs_synced: true,
};

console.log(`Snowberry simulator starting: device=${config.deviceId} scenario=${config.scenario}`);

while (true) {
  try {
    const nowMs = Date.now();
    const timeSynced = config.scenario !== "no-ntp";
    const offline = isOfflineScenario(nowMs);

    sensors = nextSensors(sensors, nowMs, config.scenario, actuators.pump.state);
    const fault = faultForSensors(sensors, config.scenario, device.nvs_synced && !invalidConfigLatched);
    expireManuals(actuators, nowMs, timeSynced);
    expireFallbackManuals(nowMs, timeSynced);
    actuators = evaluateAuto(sensorsForControl(sensors), thresholds, actuators, nowMs, timeSynced);
    const status = buildStatus({ sensors, actuators, fault, commandAck, device, nowMs, timeSynced });

    if (!offline) {
      await ensureAuth();
      if (nowMs - lastThresholdPoll >= 60000) {
        await pollThresholds(status);
        lastThresholdPoll = nowMs;
      }
      if (nowMs - lastCommandPoll >= 10000) {
        await pollCommand(status, nowMs, timeSynced);
        lastCommandPoll = nowMs;
      }
      if (nowMs - lastStatusWrite >= 60000 || commandAck.ack_at === nowMs) {
        await writeDoc(`devices/${config.deviceId}/status/realtime`, status);
        lastStatusWrite = nowMs;
      }
      if (timeSynced && nowMs - lastTelemetryWrite >= 60000) {
        telemetryBuffer.push(buildTelemetryEntry(status, nowMs));
        telemetryBuffer = telemetryBuffer.slice(-10);
        await flushTelemetry(nowMs);
        lastTelemetryWrite = nowMs;
      }
    }
  } catch (error) {
    console.error(error.message);
    await delay(5000);
  }

  await delay(1000);
}

async function ensureAuth() {
  if (auth && Date.now() < tokenExpiresAt - 300000) return;
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${config.apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: config.email, password: config.password, returnSecureToken: true }),
  });
  if (!response.ok) throw new Error(`auth failed: ${response.status} ${await response.text()}`);
  auth = await response.json();
  tokenExpiresAt = Date.now() + Number(auth.expiresIn || 3600) * 1000;
}

async function pollThresholds(status) {
  const doc = await getDoc(`devices/${config.deviceId}/config/thresholds`);
  if (!doc) return;
  if (doc.updated_at === lastThresholdUpdate) return;
  const result = validateThresholds(doc);
  if (!result.ok) {
    device.nvs_synced = false;
    invalidConfigLatched = true;
    console.warn(`threshold rejected: ${result.reason}`);
    return;
  }
  thresholds = result.value;
  lastThresholdUpdate = doc.updated_at ?? Date.now();
  device.nvs_synced = true;
  invalidConfigLatched = false;
  status.device.nvs_synced = true;
}

async function pollCommand(status, nowMs, timeSynced) {
  const command = await getDoc(`devices/${config.deviceId}/config/commands`);
  if (!command || command.command_id === lastCommandId) return;
  command.received_at_ms = nowMs;
  const ack = evaluateCommand(command, { actuators, fault: status.fault }, nowMs, timeSynced);
  if (!ack.ack_status) return;
  if (ack.ack_status === "APPLIED" && command.mode === "MANUAL") {
    fallbackManualUntil.set(command.actuator, nowMs + Math.min(command.manual_duration_ms, 1800000));
  }
  if (ack.ack_status === "APPLIED" && command.mode === "AUTO") {
    fallbackManualUntil.delete(command.actuator);
  }
  commandAck = ack;
  lastCommandId = command.command_id;
  await writeDoc(`devices/${config.deviceId}/status/realtime`, buildStatus({ sensors, actuators, fault: status.fault, commandAck, device, nowMs, timeSynced }));
  console.log(`command ${command.command_id}: ${commandAck.ack_status}`);
}

function expireFallbackManuals(nowMs, timeSynced) {
  if (timeSynced) return;
  for (const [actuatorKey, untilMs] of fallbackManualUntil.entries()) {
    if (nowMs >= untilMs && actuators[actuatorKey]?.mode === "MANUAL") {
      actuators[actuatorKey].mode = "AUTO";
      actuators[actuatorKey].manual_until = null;
      fallbackManualUntil.delete(actuatorKey);
    }
  }
}

async function flushTelemetry(nowMs) {
  if (telemetryBuffer.length === 0) return;
  const date = jakartaDate(nowMs);
  const path = `devices/${config.deviceId}/telemetry/${date}`;
  const existing = await getDoc(path);
  const d = [...(existing?.d || []), ...telemetryBuffer].slice(-1440);
  await writeDoc(path, { device_id: config.deviceId, date, d });
  telemetryBuffer = [];
}

async function getDoc(path) {
  const response = await fetch(docUrl(path), { headers: authHeader() });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status} ${await response.text()}`);
  return fromFirestore((await response.json()).fields || {});
}

async function writeDoc(path, data) {
  const response = await fetch(docUrl(path), {
    method: "PATCH",
    headers: { ...authHeader(), "content-type": "application/json" },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (!response.ok) throw new Error(`PATCH ${path} failed: ${response.status} ${await response.text()}`);
}

function docUrl(path) {
  return `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/${path}`;
}

function authHeader() {
  return { authorization: `Bearer ${auth.idToken}` };
}

function isOfflineScenario(nowMs) {
  if (config.scenario !== "offline") return false;
  const elapsed = nowMs - device.started_at;
  if (elapsed > 180000 && elapsed < 480000) {
    offlineUntil = device.started_at + 480000;
    return true;
  }
  if (offlineUntil && nowMs >= offlineUntil) offlineUntil = 0;
  return false;
}

function sensorsForControl(value) {
  return { ...value, soil_pct: value.soil_pct ?? 0 };
}

function jakartaDate(nowMs) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(nowMs);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function loadDotEnv() {
  const path = new URL(".env", import.meta.url);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function required(name) {
  if (!process.env[name]) throw new Error(`Missing env ${name}. Copy simulator/.env.example to simulator/.env`);
  return process.env[name];
}

function toFirestoreFields(object) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, toFirestoreValue(value)]));
}

function toFirestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === "object") return { mapValue: { fields: toFirestoreFields(value) } };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  return { stringValue: String(value) };
}

function fromFirestore(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]));
}

function fromFirestoreValue(value) {
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("stringValue" in value) return value.stringValue;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if ("mapValue" in value) return fromFirestore(value.mapValue.fields || {});
  return undefined;
}

#!/usr/bin/env node
// ============================================================================
// Snowberry Status-to-Telemetry Capture
// ----------------------------------------------------------------------------
// Menyalin snapshot sensor dari devices/{id}/status/realtime ke dokumen
// telemetry/{tanggal-WIB} sampai ESP32 diflash ke v1.1.0 (yang menulis
// telemetry sendiri lewat appendTelemetry).
//
// - Format sampel & mekanisme commit IDENTIK dengan firmware (documents:commit
//   + appendMissingElements pada field "d"), plus penanda src="cap".
// - Tanpa dependency eksternal. Butuh Node.js >= 18 (fetch bawaan).
// - Pemakaian: node capture.mjs [config.local.json]
// ============================================================================

import { readFileSync } from "node:fs";

const CONFIG_PATH = process.argv[2] ?? new URL("./config.local.json", import.meta.url).pathname;
const cfg = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));

if (!cfg.apiKey || !cfg.projectId || !cfg.deviceId || !cfg.email || !cfg.password) {
  console.error("config.local.json belum lengkap (apiKey/projectId/deviceId/email/password).");
  process.exit(1);
}

const MIN_INTERVAL_MS = cfg.minIntervalMs ?? 55_000; // maksimal 1 sampel per menit
const POLL_MS = 10_000;                              // frekuensi cek status
const TOKEN_LIFETIME_MS = 50 * 60_000;               // re-auth preventif (< umur token 1 jam)

const state = { idToken: "", refreshAt: 0, lastWriteAt: 0 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString(), ...a);

async function signIn() {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${cfg.apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: cfg.email, password: cfg.password, returnSecureToken: true }),
  });
  if (!res.ok) throw new Error(`auth gagal ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const d = await res.json();
  state.idToken = d.idToken;
  state.refreshAt = Date.now() + TOKEN_LIFETIME_MS;
  log("login OK sebagai", cfg.email);
}

async function api(path, init = {}, retried = false) {
  if (Date.now() >= state.refreshAt) await signIn();
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents/${path}`,
    { ...init, headers: { authorization: `Bearer ${state.idToken}`, "content-type": "application/json", ...(init.headers ?? {}) } },
  );
  if (res.status === 401 && !retried) {
    await signIn();
    return api(path, init, true);
  }
  return res;
}

// Tanggal WIB sebagai kunci dokumen harian (bukan zona waktu server/VPS).
function wibDate(ms) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(ms);
}

// Nilai Firestore bisa datang sebagai doubleValue (angka) / integerValue (string) / nullValue.
function numOf(field) {
  if (!field) return null;
  if ("doubleValue" in field && Number.isFinite(Number(field.doubleValue))) return Number(field.doubleValue);
  if ("integerValue" in field && Number.isFinite(Number(field.integerValue))) return Number(field.integerValue);
  return null;
}

// Ambil snapshot sensor dari dokumen status. Return null jika ada sensor yang
// tidak valid — prinsip "gap jujur" yang sama dengan firmware.
function extractSample(statusDoc, tsMs) {
  const s = statusDoc.fields?.sensors?.mapValue?.fields ?? {};
  const t = numOf(s.temperature_c);
  const h = numOf(s.humidity_pct);
  const l = numOf(s.lux);
  const soil = numOf(s.soil_pct);
  if (t === null || h === null || l === null || soil === null) return null;

  const a = statusDoc.fields?.actuators?.mapValue?.fields ?? {};
  // Firmware lama (v1.0.0): pengabut + kipas digabung dalam satu grup "humidifier".
  const mistF = a.mist?.mapValue?.fields ?? a.humidifier?.mapValue?.fields;
  const fanF = a.fan?.mapValue?.fields ?? a.humidifier?.mapValue?.fields;
  const boolState = (f) => f?.state?.booleanValue === true;

  return {
    t: { doubleValue: t },
    h: { doubleValue: h },
    l: { integerValue: String(Math.round(l)) },
    s: { doubleValue: soil },
    gl: { booleanValue: boolState(a.growlight?.mapValue?.fields) },
    p: { booleanValue: boolState(a.pump?.mapValue?.fields) },
    m: { booleanValue: boolState(mistF) },
    f: { booleanValue: boolState(fanF) },
    ts: { integerValue: String(tsMs) },
    src: { stringValue: "cap" },
  };
}

// Commit atomik: pastikan dokumen harian ada, lalu tambahkan sampel tanpa
// menimpa isi array (appendMissingElements = padanan arrayUnion).
async function appendSample(sample, dateId) {
  // Nama dokumen di dalam writes wajib full resource path.
  const doc = `projects/${cfg.projectId}/databases/(default)/documents/devices/${cfg.deviceId}/telemetry/${dateId}`;
  const body = {
    writes: [
      {
        update: {
          name: doc,
          fields: { device_id: { stringValue: cfg.deviceId }, date: { stringValue: dateId } },
        },
        // Mask sejajar dengan "update" agar hanya device_id/date yang diset,
        // array sampel "d" tidak ikut tertimpa.
        updateMask: { fieldPaths: ["device_id", "date"] },
      },
      {
        transform: {
          document: doc,
          fieldTransforms: [{ fieldPath: "d", appendMissingElements: { values: [{ mapValue: { fields: sample } }] } }],
        },
      },
    ],
  };
  const res = await api(":commit", { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`commit gagal ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

log(`capture mulai | device=${cfg.deviceId} | interval=${Math.round(MIN_INTERVAL_MS / 1000)}s`);

for (;;) {
  try {
    const now = Date.now();
    // api() otomatis login saat token belum ada/kedaluwarsa.
    if (now - state.lastWriteAt >= MIN_INTERVAL_MS) {
      const res = await api(`devices/${cfg.deviceId}/status/realtime`);
      if (res.ok) {
        const sample = extractSample(await res.json(), now);
        if (sample) {
          await appendSample(sample, wibDate(now));
          state.lastWriteAt = now;
          log(`sampel tersimpan | suhu ${sample.t.doubleValue} °C | media ${sample.s.doubleValue} %`);
        } else {
          log("sensor belum lengkap/valid, sampel dilewati");
        }
      } else {
        log("gagal baca status:", res.status);
      }
    }
  } catch (err) {
    log("ERROR:", err.message);
  }
  await sleep(POLL_MS);
}

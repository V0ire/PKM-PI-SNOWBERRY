export const ACTUATORS = ["growlight", "pump", "mist", "fan"];

export const DEFAULT_THRESHOLDS = {
  temp_low: 16,
  temp_high: 28,
  rh_low: 65,
  rh_high: 85,
  soil_low: 50,
  soil_high: 70,
  lux_low: 2000,
  lux_high: 5000,
  pump_pulse_ms: 3000,
  soak_period_ms: 30000,
  max_pump_cycles_per_hour: 6,
  max_total_pump_on_ms_per_hour: 30000,
  light_window_start: 6,
  light_window_end: 18,
  max_light_hours_per_day: 14,
  planting_date: "2026-06-01",
  updated_at: 0,
  updated_by: "simulator",
};

export function validateThresholds(input) {
  const t = { ...DEFAULT_THRESHOLDS, ...input };
  const checks = [
    [t.temp_low < t.temp_high && between(t.temp_low, 10, 35) && between(t.temp_high, 10, 35), "temp_low/temp_high"],
    [t.rh_low < t.rh_high && between(t.rh_low, 30, 95) && between(t.rh_high, 30, 95), "rh_low/rh_high"],
    [t.soil_low < t.soil_high && between(t.soil_low, 10, 90) && between(t.soil_high, 10, 90), "soil_low/soil_high"],
    [t.lux_low < t.lux_high && between(t.lux_low, 500, 50000) && between(t.lux_high, 500, 50000), "lux_low/lux_high"],
    [between(t.pump_pulse_ms, 1000, 30000) && between(t.soak_period_ms, 10000, 300000) && t.pump_pulse_ms <= t.soak_period_ms, "pump_pulse_ms/soak_period_ms"],
    [between(t.max_pump_cycles_per_hour, 1, 20) && between(t.max_total_pump_on_ms_per_hour, 5000, 300000), "pump safety limits"],
    [Number.isInteger(t.light_window_start) && Number.isInteger(t.light_window_end) && t.light_window_start < t.light_window_end && t.light_window_start >= 0 && t.light_window_end <= 24 && between(t.max_light_hours_per_day, 1, 20), "light window"],
  ];
  const failed = checks.find(([ok]) => !ok);
  return failed ? { ok: false, reason: failed[1], value: t } : { ok: true, reason: "", value: t };
}

export function buildInitialActuators() {
  return {
    growlight: { mode: "AUTO", state: false, manual_until: null, reason: "lux_ok" },
    pump: { mode: "AUTO", state: false, manual_until: null, reason: "soil_ok" },
    mist: { mode: "AUTO", state: false, manual_until: null, reason: "humidity_ok" },
    fan: { mode: "AUTO", state: false, manual_until: null, reason: "temp_rh_ok" },
  };
}

export function evaluateAuto(sensors, thresholds, previousActuators, nowMs, timeSynced = true) {
  const actuators = structuredClone(previousActuators);
  const hour = new Date(nowMs).toLocaleString("en-US", { timeZone: "Asia/Jakarta", hour: "numeric", hour12: false });
  const localHour = Number(hour);

  setActuator(actuators.fan, sensors.temperature_c >= thresholds.temp_high || sensors.humidity_pct >= thresholds.rh_high, sensors.humidity_pct >= thresholds.rh_high ? "humidity_high" : sensors.temperature_c >= thresholds.temp_high ? "temp_high" : "temp_rh_ok");

  const wantsMist = sensors.humidity_pct <= thresholds.rh_low;
  const tooHot = sensors.temperature_c >= thresholds.temp_high;
  setActuator(actuators.mist, wantsMist && !tooHot, wantsMist && tooHot ? "temp_high" : wantsMist ? "humidity_low" : "humidity_ok");

  setActuator(actuators.pump, sensors.soil_pct <= thresholds.soil_low, sensors.soil_pct <= thresholds.soil_low ? "soil_low" : "soil_ok");

  const inWindow = timeSynced ? localHour >= thresholds.light_window_start && localHour < thresholds.light_window_end : true;
  setActuator(actuators.growlight, inWindow && sensors.lux <= thresholds.lux_low, inWindow && sensors.lux <= thresholds.lux_low ? "lux_low" : "lux_ok");
  return actuators;
}

export function evaluateCommand(command, state, nowMs, timeSynced) {
  if (!command || typeof command !== "object") return { status: "", message: "" };
  if (!command.command_id || !ACTUATORS.includes(command.actuator) || !["AUTO", "MANUAL"].includes(command.mode)) {
    return ack(command.command_id || "", "INVALID", "Perintah tidak valid");
  }
  if (command.manual_duration_ms <= 0) return ack(command.command_id, "INVALID", "Durasi manual tidak valid");
  if (command.mode === "MANUAL" && timeSynced && nowMs >= command.manual_until) {
    return ack(command.command_id, "EXPIRED", "Perintah sudah kedaluwarsa");
  }
  if (command.mode === "MANUAL" && command.actuator === "pump" && state.fault.active_code) {
    return ack(command.command_id, "REJECTED_SAFETY", "Perintah ditolak: perangkat sedang bermasalah");
  }
  const target = state.actuators[command.actuator];
  target.mode = command.mode;
  target.state = command.mode === "MANUAL" ? Boolean(command.state) : target.state;
  target.manual_until = command.mode === "MANUAL" ? command.manual_until : null;
  target.reason = command.mode === "MANUAL" ? "manual_override" : target.reason;
  return ack(command.command_id, "APPLIED", `${label(command.actuator)} ${command.mode === "MANUAL" ? "manual diterapkan" : "kembali otomatis"}`);
}

export function expireManuals(actuators, nowMs, timeSynced) {
  for (const key of ACTUATORS) {
    const actuator = actuators[key];
    if (actuator.mode === "MANUAL" && timeSynced && actuator.manual_until && nowMs >= actuator.manual_until) {
      actuator.mode = "AUTO";
      actuator.manual_until = null;
    }
  }
}

export function buildStatus({ sensors, actuators, fault, commandAck, device, nowMs, timeSynced }) {
  return {
    sensors,
    actuators,
    device: {
      online: true,
      wifi_rssi: device.wifi_rssi,
      ip_address: device.ip_address,
      firmware_version: device.firmware_version,
      uptime_seconds: Math.floor((nowMs - device.started_at) / 1000),
      free_heap_bytes: 187392,
      nvs_synced: device.nvs_synced,
      time_synced: timeSynced,
    },
    command_ack: commandAck,
    fault,
    last_seen: timeSynced ? nowMs : 0,
  };
}

export function buildTelemetryEntry(status, nowMs) {
  return {
    t: status.sensors.temperature_c,
    h: status.sensors.humidity_pct,
    l: status.sensors.lux,
    s: status.sensors.soil_pct,
    gl: status.actuators.growlight.state,
    p: status.actuators.pump.state,
    m: status.actuators.mist.state,
    f: status.actuators.fan.state,
    ts: nowMs,
  };
}

export function assertContract() {
  const valid = validateThresholds(DEFAULT_THRESHOLDS);
  if (!valid.ok) throw new Error(`default thresholds invalid: ${valid.reason}`);
  const actuators = buildInitialActuators();
  const status = buildStatus({
    sensors: { temperature_c: 22, humidity_pct: 80, lux: 3000, soil_pct: 60, soil_raw_adc: 1800, psu_voltage: 12.1 },
    actuators,
    fault: { active_code: null, active_message: null, last_fault_code: null, last_fault_at: null },
    commandAck: { ack_command_id: "", ack_status: "", ack_at: null, ack_message: "" },
    device: { wifi_rssi: -60, ip_address: "127.0.0.1", firmware_version: "simulator-0.1.0", started_at: Date.now(), nvs_synced: true },
    nowMs: Date.now(),
    timeSynced: true,
  });
  for (const key of ["sensors", "actuators", "device", "command_ack", "fault", "last_seen"]) {
    if (!(key in status)) throw new Error(`missing status.${key}`);
  }
  const telemetry = buildTelemetryEntry(status, Date.now());
  for (const key of ["t", "h", "l", "s", "gl", "p", "m", "f", "ts"]) {
    if (!(key in telemetry)) throw new Error(`missing telemetry.${key}`);
  }
}

function ack(commandId, status, message) {
  return { ack_command_id: commandId, ack_status: status, ack_at: Date.now(), ack_message: message };
}

function between(value, min, max) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function label(actuator) {
  return { growlight: "Lampu", pump: "Pompa", mist: "Kabut", fan: "Kipas" }[actuator];
}

function setActuator(actuator, state, reason) {
  if (actuator.mode === "AUTO") {
    actuator.state = state;
    actuator.reason = reason;
  }
}

import assert from "node:assert/strict";
import { Timestamp } from "firebase/firestore";
import { normalizeRealtimeStatus, normalizeTelemetry, normalizeThresholdConfig } from "./normalizeFirestore";

const config = normalizeThresholdConfig({
  config_id: "cfg-1", soil_low: 30, soil_high: 60, rh_low: 65, rh_high: 85,
  temperature_influence: false, temp_low: 16, temp_high: 28,
  humidifier_priority: "RH", temperature_failure_fallback: "OFF",
  lux_low: 2000, lux_high: 5000, light_schedule_enabled: false,
  light_schedule_start_hour: 6, light_schedule_end_hour: 18,
  pump_pulse_ms: 45000, soak_period_ms: 900000, pump_start_limit: 2,
  pump_window_ms: 18000000, planting_date: "2026-06-01",
  updated_at: Timestamp.fromMillis(1000), updated_by: "uid",
});
assert.equal(config.updated_at, 1000);
assert.equal(config.pump_start_limit, 2);
assert.throws(() => normalizeThresholdConfig({ ...config, humidifier_priority: "BOTH" }));
assert.throws(() => normalizeThresholdConfig({ ...config, soil_adc_dry: 3500 }));

const status = normalizeRealtimeStatus({
  sensors: { temperature_c: null, humidity_pct: 70, lux: 2000, soil_pct: 50, psu_voltage: 24 },
  actuators: {
    growlight: { mode: "AUTO", state: false, manual_until: null },
    pump: { mode: "AUTO", state: false, manual_until: null },
    humidifier: { mode: "MANUAL", state: true, manual_until: Timestamp.fromMillis(2000) },
  },
  device: { online: true, wifi_rssi: -60, firmware_version: "1", uptime_seconds: 10, nvs_synced: true },
  fault: { active_code: null, active_message: null }, last_seen: Timestamp.fromMillis(1500), applied_config_id: "cfg-1",
  command_ack: { ack_command_id: "cmd-1", ack_status: "APPLIED", ack_at: Timestamp.fromMillis(1600), ack_message: "Diterapkan" },
});
assert.equal(status.actuators.humidifier.manual_until, 2000);
assert.equal(status.applied_config_id, "cfg-1");
assert.equal(status.command_ack?.ack_command_id, "cmd-1");
assert.throws(() => normalizeRealtimeStatus({ ...status, actuators: { ...status.actuators, fan: status.actuators.humidifier } }));

assert.deepEqual(normalizeTelemetry({ samples: [{ t: 20, h: 70, l: 1000, s: 50, gl: false, p: false, m: true, ts: Timestamp.fromMillis(3000) }] })[0]?.ts, 3000);
assert.throws(() => normalizeTelemetry({ samples: [{ t: "20" }] }));
console.log("normalizeFirestore.check: lolos");

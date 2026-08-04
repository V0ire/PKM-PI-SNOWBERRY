// Self-check tanpa framework: node --experimental-strip-types src/utils/thresholdDiff.check.ts
// Atau: npx tsx src/utils/thresholdDiff.check.ts
import assert from "node:assert/strict";
import { diffThresholds } from "./thresholdDiff";
import type { ThresholdConfig } from "../types";

const base: ThresholdConfig = {
  config_id: "cfg-test",
  temperature_influence: false,
  humidifier_priority: "RH",
  temperature_failure_fallback: "OFF",
  light_schedule_enabled: false,
  light_schedule_start_hour: 6,
  light_schedule_end_hour: 18,
  pump_start_limit: 2,
  pump_window_ms: 18000000,
  temp_low: 18,
  temp_high: 28,
  rh_low: 60,
  rh_high: 80,
  soil_low: 35,
  soil_high: 65,
  lux_low: 2000,
  lux_high: 30000,
  pump_pulse_ms: 5000,
  soak_period_ms: 60000,
  planting_date: "2026-01-06",
  updated_at: 0,
  updated_by: "test",
};

// 1. Tanpa perubahan -> kosong.
assert.deepEqual(diffThresholds(base, base), []);

// 2. updated_at/updated_by berubah tapi bukan field petani -> tetap kosong.
assert.deepEqual(diffThresholds(base, { ...base, updated_at: 999, updated_by: "x" }), []);

// 3. Satu perubahan angka -> satu baris, format satuan benar.
const d1 = diffThresholds(base, { ...base, temp_low: 17 });
assert.equal(d1.length, 1);
assert.equal(d1[0].key, "temp_low");
assert.equal(d1[0].before, "18 °C");
assert.equal(d1[0].after, "17 °C");

// 4. Milidetik ditampilkan sebagai detik.
const d2 = diffThresholds(base, { ...base, pump_pulse_ms: 8000 });
assert.equal(d2[0].before, "5 detik");
assert.equal(d2[0].after, "8 detik");

// 5. Nilai pecahan dibulatkan satu desimal, bukan berantai.
const d3 = diffThresholds(base, { ...base, pump_pulse_ms: 5500 });
assert.equal(d3[0].after, "5.5 detik");

// 6. Beberapa perubahan sekaligus, urutan mengikuti definisi label.
const d4 = diffThresholds(base, { ...base, temp_high: 27, lux_low: 2500 });
assert.deepEqual(d4.map((c) => c.key), ["temp_high", "lux_low"]);

// 7. Tanggal tanam berupa string, bukan angka.
const d5 = diffThresholds(base, { ...base, planting_date: "2026-02-01" });
assert.equal(d5[0].before, "2026-01-06");
assert.equal(d5[0].after, "2026-02-01");

console.log("thresholdDiff: 7 checks passed");

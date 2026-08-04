// Cek mandiri validasi batas otomatis. Jalankan: npx tsx src/utils/validateThresholds.check.ts
// Ini pagar keselamatan: angka salah di sini dikirim ke perangkat sungguhan.
import assert from "node:assert/strict";
import type { ThresholdConfig } from "../types";
import { validateThresholds } from "./validateThresholds";

const valid: ThresholdConfig = {
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
  temp_high: 26,
  rh_low: 60,
  rh_high: 80,
  soil_low: 40,
  soil_high: 70,
  lux_low: 2000,
  lux_high: 5000,
  pump_pulse_ms: 5000,
  soak_period_ms: 60000,
  planting_date: "2026-06-01",
  updated_at: 0,
  updated_by: "test",
};

assert.deepEqual(validateThresholds(valid), {}, "pengaturan wajar ditolak");

// NaN = kolom dikosongkan petani. Dulu lolos diam-diam.
const kosong = validateThresholds({ ...valid, rh_low: Number.NaN });
assert.equal(kosong.rh_low, "Isi angka", "kolom kosong lolos validasi");

// Nilai di luar rentang wajar ditolak dengan pesan berisi angka batas.
const terlaluTinggi = validateThresholds({ ...valid, rh_high: 150 });
assert.ok(terlaluTinggi.rh_high?.includes("95"), `pesan batas atas RH salah: ${terlaluTinggi.rh_high}`);
const terlaluRendah = validateThresholds({ ...valid, soil_low: -1 });
assert.ok(terlaluRendah.soil_low?.includes("0"), `pesan batas bawah media salah: ${terlaluRendah.soil_low}`);

// Hubungan antar-kolom tetap dijaga untuk semua pasangan.
assert.ok(validateThresholds({ ...valid, rh_low: 85 }).rh_low, "rh_low >= rh_high lolos");
assert.ok(validateThresholds({ ...valid, temp_low: 30 }).temp_low, "temp_low >= temp_high lolos");
assert.ok(validateThresholds({ ...valid, soil_low: 75 }).soil_low, "soil_low >= soil_high lolos");
assert.ok(validateThresholds({ ...valid, lux_low: 6000 }).lux_low, "lux_low >= lux_high lolos");

// Nilai sama persis juga salah (tidak ada rentang aman tersisa).
assert.ok(validateThresholds({ ...valid, rh_low: 80 }).rh_low, "rh_low == rh_high harus ditolak");

// Kolom kosong tidak boleh memicu pesan hubungan yang membingungkan.
const kosongDua = validateThresholds({ ...valid, rh_low: Number.NaN, rh_high: Number.NaN });
assert.equal(kosongDua.rh_low, "Isi angka");
assert.equal(kosongDua.rh_high, "Isi angka");

// Infinity dan string kosong yang jadi NaN ditangani sama.
assert.equal(validateThresholds({ ...valid, temp_high: Number.POSITIVE_INFINITY }).temp_high, "Isi angka");

// Durasi pompa mustahil ditolak (proteksi perangkat keras).
assert.ok(validateThresholds({ ...valid, pump_pulse_ms: 999999 }).pump_pulse_ms, "durasi pompa ekstrem lolos");
assert.ok(validateThresholds({ ...valid, pump_pulse_ms: 0 }).pump_pulse_ms, "durasi pompa nol lolos");

// Pompa menyala lebih lama dari jeda resap = akar tergenang.
assert.ok(
  validateThresholds({ ...valid, pump_pulse_ms: 90000, soak_period_ms: 60000 }).pump_pulse_ms,
  "pompa lebih lama dari jeda resap lolos",
);

console.log("validateThresholds.check: 15 asserts lolos");

// npx tsx src/utils/historySummary.check.ts
import assert from "node:assert/strict";
import { buildHistorySummary, growlightDurationMinutes, hasHistoryIssue } from "./historySummary";
import type { TelemetryPoint, ThresholdConfig } from "../types";

const thresholds: ThresholdConfig = {
  temp_low: 18, temp_high: 26, rh_low: 60, rh_high: 80,
  soil_low: 40, soil_high: 70, lux_low: 2_000, lux_high: 5_000,
  pump_pulse_ms: 10_000, soak_period_ms: 600_000,
  planting_date: "2026-06-01", updated_at: 0, updated_by: "test",
};
const point = (ts: number, patch: Partial<TelemetryPoint> = {}): TelemetryPoint => ({
  ts, t: 22, h: 70, l: 3_000, s: 50,
  gl: false, p: false, m: false, f: false, ...patch,
});

const data = [
  point(0),
  point(60_000, { h: 90 }),
  point(120_000, { h: 91 }),
  point(180_000),
  point(240_000, { h: 90 }),
  point(300_000),
];
assert.equal(hasHistoryIssue(data, thresholds), true);
const summary = buildHistorySummary(data, false, thresholds);
assert.ok(summary.some((line) => line.includes("2 kali")), summary.join(" | "));
assert.ok(summary.some((line) => line.includes("1 menit")), summary.join(" | "));
assert.equal(hasHistoryIssue([point(0)], thresholds), false);
assert.deepEqual(buildHistorySummary([point(0)], false, thresholds), ["Semua kondisi aman pada rentang ini."]);

// Perubahan batas langsung mengubah verdict; tidak ada literal 80/30/28 tersembunyi.
assert.equal(hasHistoryIssue([point(0, { h: 75 })], { ...thresholds, rh_high: 74 }), true);

// Data hilang tidak boleh dianggap satu kejadian terus-menerus.
const gapped = buildHistorySummary([
  point(0, { h: 90 }),
  point(60_000, { h: 90 }),
  point(6 * 60 * 60_000, { h: 90 }),
], false, thresholds);
assert.ok(gapped.some((line) => line.includes("2 kali")), gapped.join(" | "));
assert.ok(gapped.some((line) => line.includes("1 menit")), gapped.join(" | "));
assert.equal(growlightDurationMinutes([
  point(0, { gl: true }),
  point(60_000, { gl: true }),
  point(6 * 60 * 60_000, { gl: false }),
]), 1);

console.log("historySummary.check: 9 assertions passed");

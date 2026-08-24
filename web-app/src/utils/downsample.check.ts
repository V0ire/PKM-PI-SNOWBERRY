// npx tsx src/utils/downsample.check.ts
import assert from "node:assert/strict";
import { downsample, RANGES } from "./downsample";
import type { TelemetryPoint } from "../types";

const HOUR = 60 * 60_000;
const point = (ts: number, t: number, gl = false): TelemetryPoint => ({
  ts, t, h: 70, l: 1_000, s: 50, gl, p: false, m: false, f: false,
});

const raw = [point(0, 20), point(1_000, 22)];
const rawDown = downsample(raw, 0);
assert.deepEqual(rawDown, [
  { ...raw[0], bands: { t: { min: 20, max: 20, avg: 20 }, h: { min: 70, max: 70, avg: 70 }, l: { min: 1_000, max: 1_000, avg: 1_000 }, s: { min: 50, max: 50, avg: 50 } } },
  { ...raw[1], bands: { t: { min: 22, max: 22, avg: 22 }, h: { min: 70, max: 70, avg: 70 }, l: { min: 1_000, max: 1_000, avg: 1_000 }, s: { min: 50, max: 50, avg: 50 } } },
]);
assert.deepEqual(downsample([], HOUR), []);

const bucket = downsample([
  point(0, 20, true),
  point(600_000, 22, true),
  point(1_200_000, 24, false),
], HOUR);
assert.equal(bucket.length, 1);
assert.equal(bucket[0].t, 22);
assert.equal(bucket[0].gl, true);
// Fluktuasi wajib tersimpan di pita min–max, bukan hilang oleh rata-rata.
assert.deepEqual(bucket[0].bands.t, { min: 20, max: 24, avg: 22 });

const shuffled = [point(2 * HOUR, 10), point(0, 30), point(HOUR, 20)];
assert.deepEqual(downsample(shuffled, HOUR).map((p) => p.t), [30, 20, 10]);

const weekly: TelemetryPoint[] = [];
for (let i = 0; i < 7 * 24 * 60; i += 1) weekly.push(point(i * 60_000, 20));
const range7 = RANGES.find((range) => range.key === "7d")!;
assert.equal(downsample(weekly, range7.bucketMs).length, 1_008);

const monthly: TelemetryPoint[] = [];
for (let i = 0; i < 30 * 24 * 12; i += 1) monthly.push(point(i * 5 * 60_000, 20 + (i % 10)));
const range30 = RANGES.find((range) => range.key === "30d")!;
const month = downsample(monthly, range30.bucketMs);
assert.equal(month.length, 720);

console.log("downsample.check: 10 assertions passed");

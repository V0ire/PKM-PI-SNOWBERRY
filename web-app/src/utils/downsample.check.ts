// npx tsx src/utils/downsample.check.ts
import assert from "node:assert/strict";
import { downsample, RANGES } from "./downsample";
import type { TelemetryPoint } from "../types";

const HOUR = 60 * 60_000;
const pt = (ts: number, t: number, gl = false): TelemetryPoint => ({
  ts, t, h: 70, l: 1000, s: 50, gl, p: false, m: false, f: false,
});

// 1. bucketMs 0 -> data apa adanya.
const raw = [pt(0, 20), pt(1000, 22)];
assert.equal(downsample(raw, 0), raw);

// 2. Array kosong aman.
assert.deepEqual(downsample([], HOUR), []);

// 3. Empat titik dalam satu jam -> satu titik, nilai dirata-rata.
const oneHour = [pt(0, 20), pt(600_000, 22), pt(1_200_000, 24), pt(1_800_000, 26)];
const d1 = downsample(oneHour, HOUR);
assert.equal(d1.length, 1);
assert.equal(d1[0].t, 23); // (20+22+24+26)/4
assert.equal(d1[0].ts, 0); // ts = awal bucket

// 4. Dua jam terpisah -> dua bucket, urut naik.
const twoHours = [pt(0, 20), pt(HOUR + 1000, 30)];
const d2 = downsample(twoHours, HOUR);
assert.equal(d2.length, 2);
assert.deepEqual(d2.map((p) => p.t), [20, 30]);
assert.ok(d2[0].ts < d2[1].ts);

// 5. Input tidak urut -> output tetap urut waktu.
const shuffled = [pt(2 * HOUR, 10), pt(0, 30), pt(HOUR, 20)];
const d3 = downsample(shuffled, HOUR);
assert.deepEqual(d3.map((p) => p.t), [30, 20, 10]);

// 6. Aktuator pakai mayoritas, bukan rata-rata.
const glMostlyOn = [pt(0, 20, true), pt(1000, 20, true), pt(2000, 20, false)];
assert.equal(downsample(glMostlyOn, HOUR)[0].gl, true);
const glMostlyOff = [pt(0, 20, true), pt(1000, 20, false), pt(2000, 20, false)];
assert.equal(downsample(glMostlyOff, HOUR)[0].gl, false);
// Seri (2 nyala, 2 mati) dianggap mati -> butuh mayoritas tegas.
const glTie = [pt(0, 20, true), pt(1000, 20, true), pt(2000, 20, false), pt(3000, 20, false)];
assert.equal(downsample(glTie, HOUR)[0].gl, false);

// 7. 30 hari data 5-menitan turun ke jumlah yang wajar digambar.
const monthly: TelemetryPoint[] = [];
for (let i = 0; i < 30 * 24 * 12; i++) monthly.push(pt(i * 5 * 60_000, 20 + (i % 10)));
const range30 = RANGES.find((r) => r.key === "30d")!;
const d4 = downsample(monthly, range30.bucketMs);
assert.equal(monthly.length, 8_640);
assert.ok(d4.length <= 121, `30d menghasilkan ${d4.length} titik, harus <= 121`);
assert.ok(d4.length >= 118, `30d hanya ${d4.length} titik, terlalu sedikit`);

// 8. Semua field wajib TelemetryPoint tetap ada setelah downsample.
for (const key of ["ts", "t", "h", "l", "s", "gl", "p", "m", "f"]) {
  assert.ok(key in d4[0], `field ${key} hilang`);
}

console.log(`downsample: 8 checks passed (30d: ${monthly.length} -> ${d4.length} titik)`);

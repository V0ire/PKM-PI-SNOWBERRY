// Cek mandiri aturan pelanggaran batas. Jalankan: npx tsx src/utils/status.check.ts
import assert from "node:assert/strict";
import type { TelemetryPoint, ThresholdConfig } from "../types";
import { isPointOutsideLimits, summarizeBreaches } from "./status";

const thresholds = {
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
} as ThresholdConfig;

const MINUTE = 60_000;
function point(overrides: Partial<TelemetryPoint> & { ts: number }): TelemetryPoint {
  return { t: 22, h: 70, l: 3000, s: 55, gl: false, p: false, m: false, f: false, ...overrides };
}

// --- isPointOutsideLimits ---
assert.equal(isPointOutsideLimits(point({ ts: 0 }), thresholds), false, "titik normal dianggap melanggar");
assert.equal(isPointOutsideLimits(point({ ts: 0, h: 81 }), thresholds), true, "lembap tinggi lolos");
assert.equal(isPointOutsideLimits(point({ ts: 0, h: 59 }), thresholds), true, "udara kering lolos");
assert.equal(isPointOutsideLimits(point({ ts: 0, s: 39 }), thresholds), true, "media kering lolos");
assert.equal(isPointOutsideLimits(point({ ts: 0, s: 71 }), thresholds), true, "media becek lolos");
assert.equal(isPointOutsideLimits(point({ ts: 0, t: 27 }), thresholds), true, "suhu tinggi lolos");
assert.equal(isPointOutsideLimits(point({ ts: 0, t: 17 }), thresholds), true, "suhu rendah lolos");
// Batas persis = masih aman (bukan pelanggaran).
assert.equal(isPointOutsideLimits(point({ ts: 0, h: 80 }), thresholds), false, "batas atas persis harus aman");
assert.equal(isPointOutsideLimits(point({ ts: 0, h: 60 }), thresholds), false, "batas bawah persis harus aman");

// --- summarizeBreaches ---
const outside = (p: TelemetryPoint) => isPointOutsideLimits(p, thresholds);

assert.deepEqual(
  summarizeBreaches([], outside),
  { count: 0, longestMinutes: 0, worstAt: null },
  "data kosong harus nol kejadian",
);

// Titik berurutan yang melanggar = SATU kejadian, bukan tiga.
const berurutan = [
  point({ ts: 0 }),
  point({ ts: 10 * MINUTE, h: 85 }),
  point({ ts: 20 * MINUTE, h: 86 }),
  point({ ts: 30 * MINUTE, h: 84 }),
  point({ ts: 40 * MINUTE }),
];
const satu = summarizeBreaches(berurutan, outside);
assert.equal(satu.count, 1, `tiga pembacaan berurutan jadi ${satu.count} kejadian`);
assert.equal(satu.longestMinutes, 20, `durasi salah: ${satu.longestMinutes} menit`);
assert.equal(satu.worstAt, 10 * MINUTE, "waktu mulai kejadian salah");

// Dua kejadian terpisah dihitung dua, durasi terpanjang yang dilaporkan.
const dua = summarizeBreaches(
  [
    point({ ts: 0, h: 85 }),
    point({ ts: 10 * MINUTE, h: 85 }),
    point({ ts: 20 * MINUTE }),
    point({ ts: 30 * MINUTE, t: 30 }),
    point({ ts: 60 * MINUTE, t: 30 }),
    point({ ts: 90 * MINUTE }),
  ],
  outside,
);
assert.equal(dua.count, 2, `harus 2 kejadian, dapat ${dua.count}`);
assert.equal(dua.longestMinutes, 30, `terpanjang salah: ${dua.longestMinutes}`);
assert.equal(dua.worstAt, 30 * MINUTE, "kejadian terpanjang salah ditandai");

// Pelanggaran yang belum selesai di akhir data tetap dihitung.
const berlanjut = summarizeBreaches(
  [point({ ts: 0 }), point({ ts: 10 * MINUTE, h: 85 }), point({ ts: 25 * MINUTE, h: 85 })],
  outside,
);
assert.equal(berlanjut.count, 1, "pelanggaran di ujung data hilang");
assert.equal(berlanjut.longestMinutes, 15, `durasi ujung salah: ${berlanjut.longestMinutes}`);

// Satu titik melanggar = 1 kejadian berdurasi 0 menit, bukan crash.
const satuTitik = summarizeBreaches([point({ ts: 5 * MINUTE, h: 90 })], outside);
assert.equal(satuTitik.count, 1, "satu titik melanggar tidak terhitung");
assert.equal(satuTitik.longestMinutes, 0, "durasi satu titik harus 0");

console.log("status.check: 20 asserts lolos");

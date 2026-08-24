// npx tsx src/utils/historyData.check.ts
import assert from "node:assert/strict";
import { historyAxisLabel, jakartaDateDocIds, mergeTelemetryDocuments } from "./historyData";

// 01:00 WIB sudah masuk hari berikutnya walau UTC masih hari sebelumnya.
const now = Date.parse("2026-07-27T18:00:00Z");
assert.deepEqual(jakartaDateDocIds(now, 3), ["2026-07-26", "2026-07-27", "2026-07-28"]);
assert.deepEqual(jakartaDateDocIds(now, 1), ["2026-07-28"]);
assert.deepEqual(jakartaDateDocIds(now, 0), []);

const point = (ts: number, t = 20) => ({
  ts, t, h: 70, l: 2_000, s: 50, gl: false, p: false, m: false, f: false,
});

// Dokumen lama `samples` masih dibaca, tetapi shape rusak dibuang.
const merged = mergeTelemetryDocuments([
  { d: [point(3000, 23), point(1000, 21)] },
  { samples: [point(2000, 22), point(2000, 99)] },
  { d: [{ ...point(4000), h: Number.NaN }, { nope: true }] },
]);
assert.deepEqual(merged.map((p) => p.ts), [1000, 2000, 3000]);
// Timestamp duplikat tidak menggandakan titik; data pertama dipertahankan.
assert.equal(merged[1].t, 22);
assert.match(historyAxisLabel(Date.parse("2026-07-27T18:00:00Z"), false), /01[.:]00/);
assert.match(historyAxisLabel(Date.parse("2026-07-27T18:00:00Z"), true), /28 Jul/);

console.log("historyData.check: 8 assertions passed");

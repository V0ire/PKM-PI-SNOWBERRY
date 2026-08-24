// npx tsx src/utils/historyDaily.check.ts
import assert from "node:assert/strict";
import { buildDailySummaries, jakartaDayKey } from "./historyDaily";
import type { TelemetryPoint } from "../types";

const point = (ts: number, t: number, h = 70, s = 50, l = 1_000): TelemetryPoint => ({
  ts, t, h, l, s, gl: false, p: false, m: false, f: false,
});

// 23 Agu 2026 23:00 WIB = 16:00 UTC; 24 Agu 00:30 WIB = 17:30 UTC sebelumnya.
const lateNight = Date.UTC(2026, 7, 23, 16, 0);
const afterMidnight = Date.UTC(2026, 7, 23, 17, 30);

assert.equal(jakartaDayKey(lateNight), "2026-08-23");
assert.equal(jakartaDayKey(afterMidnight), "2026-08-24");

const summaries = buildDailySummaries([
  point(lateNight, 21),
  point(lateNight + 60_000, 23),
  point(afterMidnight, 25),
  point(afterMidnight + 60_000, 27),
]);
assert.equal(summaries.length, 2);
assert.equal(summaries[0].dayKey, "2026-08-23");
assert.equal(summaries[1].dayKey, "2026-08-24");
assert.equal(summaries[0].temperature.min, 21);
assert.equal(summaries[0].temperature.max, 23);
assert.equal(summaries[0].temperature.avg, 22);
assert.equal(summaries[1].samples, 2);
assert.match(summaries[0].dateLabel, /23/);
assert.match(summaries[1].dateLabel, /24/);

assert.deepEqual(buildDailySummaries([]), []);

console.log("historyDaily.check: 12 assertions passed");

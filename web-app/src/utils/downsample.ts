import type { TelemetryPoint } from "../types";

export type RangeKey = "1h" | "today" | "7d" | "30d";

export const RANGES: Array<{ key: RangeKey; label: string; days: number; bucketMs: number }> = [
  { key: "today", label: "Hari Ini", days: 1, bucketMs: 0 },
  { key: "7d", label: "7 Hari", days: 7, bucketMs: 60 * 60_000 },
  { key: "30d", label: "30 Hari", days: 30, bucketMs: 6 * 60 * 60_000 },
];

// Rata-rata per bucket waktu supaya grafik 30 hari tidak menggambar ribuan titik.
// bucketMs = 0 berarti data dipakai apa adanya.
export function downsample(points: TelemetryPoint[], bucketMs: number): TelemetryPoint[] {
  if (bucketMs <= 0 || points.length === 0) return points;

  const buckets = new Map<number, TelemetryPoint[]>();
  for (const point of points) {
    const slot = Math.floor(point.ts / bucketMs) * bucketMs;
    const list = buckets.get(slot);
    if (list) list.push(point);
    else buckets.set(slot, [point]);
  }

  const avg = (list: TelemetryPoint[], pick: (p: TelemetryPoint) => number) =>
    list.reduce((sum, p) => sum + pick(p), 0) / list.length;

  const majority = (list: TelemetryPoint[], pick: (p: TelemetryPoint) => boolean) =>
    list.filter(pick).length * 2 > list.length;

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([slot, list]) => ({
      ts: slot,
      t: avg(list, (p) => p.t),
      h: avg(list, (p) => p.h),
      l: avg(list, (p) => p.l),
      s: avg(list, (p) => p.s),
      // Aktuator: dianggap menyala jika mayoritas sampel di bucket menyala.
      gl: majority(list, (p) => p.gl),
      p: majority(list, (x) => x.p),
      m: majority(list, (x) => x.m),
      f: majority(list, (x) => x.f),
    }));
}

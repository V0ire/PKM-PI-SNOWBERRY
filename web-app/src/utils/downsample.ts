import type { TelemetryPoint } from "../types";

export type RangeKey = "1h" | "6h" | "today" | "day" | "7d" | "30d";

export const RANGES: Array<{
  key: RangeKey;
  label: string;
  days: number;
  bucketMs: number;
  // Potong data ke N milidetik terakhir (untuk rentang jam pada hari yang sama).
  windowMs?: number;
  // Dipakai untuk kalimat ringkasan, mis. "Kondisi 6 jam terakhir optimal".
  summaryLabel: string;
}> = [
  { key: "1h", label: "1 Jam", days: 1, bucketMs: 0, windowMs: 3_600_000, summaryLabel: "1 jam terakhir" },
  { key: "6h", label: "6 Jam", days: 1, bucketMs: 0, windowMs: 6 * 3_600_000, summaryLabel: "6 jam terakhir" },
  { key: "today", label: "Hari Ini", days: 1, bucketMs: 0, summaryLabel: "hari ini" },
  { key: "day", label: "Tanggal", days: 1, bucketMs: 0, summaryLabel: "pada tanggal tersebut" },
  { key: "7d", label: "7 Hari", days: 7, bucketMs: 10 * 60_000, summaryLabel: "7 hari terakhir" },
  { key: "30d", label: "30 Hari", days: 30, bucketMs: 60 * 60_000, summaryLabel: "30 hari terakhir" },
];

// Pita fluktuasi per bucket: fluktuasi naik-turun tidak boleh hilang
// oleh perataan (keputusan produk 2026-08-24).
export type MetricBand = { min: number; max: number; avg: number };
export type DownsampledPoint = TelemetryPoint & {
  bands: { t: MetricBand; h: MetricBand; l: MetricBand; s: MetricBand };
};

function band(list: TelemetryPoint[], select: (point: TelemetryPoint) => number): MetricBand {
  const values = list.map(select);
  const sum = values.reduce((total, value) => total + value, 0);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: sum / values.length,
  };
}

const single = (value: number): MetricBand => ({ min: value, max: value, avg: value });

function pointBands(list: TelemetryPoint[]): DownsampledPoint["bands"] {
  return {
    t: band(list, (point) => point.t),
    h: band(list, (point) => point.h),
    l: band(list, (point) => point.l),
    s: band(list, (point) => point.s),
  };
}

export function downsample(points: TelemetryPoint[], bucketMs: number): DownsampledPoint[] {
  if (points.length === 0) return [];
  if (bucketMs <= 0) {
    // Titik mentah: pita menyusut ke nilai titik itu sendiri.
    return points.map((point) => ({
      ...point,
      bands: {
        t: single(point.t), h: single(point.h),
        l: single(point.l), s: single(point.s),
      },
    }));
  }

  const buckets = new Map<number, TelemetryPoint[]>();
  for (const point of points) {
    const slot = Math.floor(point.ts / bucketMs) * bucketMs;
    const values = buckets.get(slot);
    if (values) values.push(point);
    else buckets.set(slot, [point]);
  }

  const majority = (list: TelemetryPoint[], select: (point: TelemetryPoint) => boolean) =>
    list.filter(select).length * 2 > list.length;

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([ts, list]) => ({
      ts,
      t: band(list, (point) => point.t).avg,
      h: band(list, (point) => point.h).avg,
      l: band(list, (point) => point.l).avg,
      s: band(list, (point) => point.s).avg,
      gl: majority(list, (point) => point.gl),
      p: majority(list, (point) => point.p),
      m: majority(list, (point) => point.m),
      f: majority(list, (point) => point.f),
      bands: pointBands(list),
    }));
}

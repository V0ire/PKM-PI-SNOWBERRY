import type { TelemetryPoint } from "../types";

// Ringkasan per hari (tanggal WIB) untuk section "Riwayat Harian".
// Fluktuasi ditampilkan sebagai terendah-tertinggi, bukan hanya rata-rata.
export type DailyMetricSummary = { min: number; max: number; avg: number };

export type DailySummary = {
  dayKey: string;        // "2026-08-24" (WIB)
  dateLabel: string;     // "Senin, 24 Agu"
  firstTs: number;
  samples: number;
  temperature: DailyMetricSummary;
  humidity: DailyMetricSummary;
  soil: DailyMetricSummary;
  light: DailyMetricSummary;
};

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const labelFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  weekday: "long",
  day: "numeric",
  month: "short",
});

export function jakartaDayKey(ts: number): string {
  return dayKeyFormatter.format(ts);
}

function summarize(values: number[]): DailyMetricSummary {
  const sum = values.reduce((total, value) => total + value, 0);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: sum / values.length,
  };
}

export function buildDailySummaries(points: TelemetryPoint[]): DailySummary[] {
  const groups = new Map<string, TelemetryPoint[]>();
  for (const point of points) {
    const key = jakartaDayKey(point.ts);
    const group = groups.get(key);
    if (group) group.push(point);
    else groups.set(key, [point]);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([dayKey, group]) => ({
      dayKey,
      dateLabel: labelFormatter.format(group[0].ts),
      firstTs: group[0].ts,
      samples: group.length,
      temperature: summarize(group.map((point) => point.t)),
      humidity: summarize(group.map((point) => point.h)),
      soil: summarize(group.map((point) => point.s)),
      light: summarize(group.map((point) => point.l)),
    }));
}

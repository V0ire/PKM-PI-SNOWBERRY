import type { TelemetryPoint, ThresholdConfig } from "../types";

type BreachSummary = { count: number; longestMinutes: number; worstAt: number | null };
// Telemetry produksi tiap menit; toleransi 3 jam menjaga data mock jarang tetap berguna,
// tetapi memutus periode offline panjang agar durasi tidak direkayasa.
const MAX_CONTIGUOUS_GAP_MS = 3 * 60 * 60_000;

export function growlightDurationMinutes(points: TelemetryPoint[]): number {
  return points.slice(1).reduce((total, point, index) => {
    const previous = points[index];
    const interval = point.ts - previous.ts;
    return previous.gl && interval > 0 && interval <= MAX_CONTIGUOUS_GAP_MS
      ? total + interval / 60_000
      : total;
  }, 0);
}

function summarize(points: TelemetryPoint[], outside: (point: TelemetryPoint) => boolean): BreachSummary {
  let count = 0;
  let longestMs = 0;
  let worstAt: number | null = null;
  let start: number | null = null;
  let end: number | null = null;

  const finish = () => {
    if (start === null || end === null) return;
    const duration = end - start;
    if (duration >= longestMs) {
      longestMs = duration;
      worstAt = start;
    }
    start = null;
    end = null;
  };

  for (const point of points) {
    if (outside(point)) {
      if (end !== null && point.ts - end > MAX_CONTIGUOUS_GAP_MS) finish();
      if (start === null) {
        start = point.ts;
        count += 1;
      }
      end = point.ts;
    } else {
      finish();
    }
  }
  finish();
  return { count, longestMinutes: Math.round(longestMs / 60_000), worstAt };
}

function timeLabel(ts: number, multiDay: boolean) {
  return new Intl.DateTimeFormat("id-ID", multiDay
    ? { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }
    : { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }
  ).format(ts);
}

export function hasHistoryIssue(points: TelemetryPoint[], thresholds: ThresholdConfig): boolean {
  return points.some((point) =>
    point.t < thresholds.temp_low || point.t > thresholds.temp_high ||
    point.h < thresholds.rh_low || point.h > thresholds.rh_high ||
    point.s < thresholds.soil_low || point.s > thresholds.soil_high ||
    point.l < thresholds.lux_low || point.l > thresholds.lux_high,
  );
}

export function buildHistorySummary(
  points: TelemetryPoint[],
  multiDay: boolean,
  thresholds: ThresholdConfig,
): string[] {
  if (points.length === 0) return [];
  const checks = [
    { label: "Kelembapan udara di luar batas", test: (p: TelemetryPoint) => p.h < thresholds.rh_low || p.h > thresholds.rh_high },
    { label: "Media tanam di luar batas", test: (p: TelemetryPoint) => p.s < thresholds.soil_low || p.s > thresholds.soil_high },
    { label: "Suhu di luar batas", test: (p: TelemetryPoint) => p.t < thresholds.temp_low || p.t > thresholds.temp_high },
    { label: "Cahaya di luar batas", test: (p: TelemetryPoint) => p.l < thresholds.lux_low || p.l > thresholds.lux_high },
  ];
  const lines: string[] = [];
  for (const check of checks) {
    const result = summarize(points, check.test);
    if (result.count === 0) continue;
    lines.push(`${check.label} ${result.count} kali.`);
    if (result.worstAt !== null) {
      const when = multiDay ? "pada" : "sekitar pukul";
      lines.push(`Paling lama ${result.longestMinutes} menit, ${when} ${timeLabel(result.worstAt, multiDay)}.`);
    }
  }
  return lines.length ? lines : ["Semua kondisi aman pada rentang ini."];
}

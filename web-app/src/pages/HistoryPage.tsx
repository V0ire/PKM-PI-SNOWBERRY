import { useEffect, useMemo, useState } from "react";
import type { TelemetryPoint, ThresholdConfig } from "../types";
import { ChartSkeleton } from "../components/LoadingSkeleton";
import { MetricChart } from "../components/MetricChart";
import { SectionHero } from "../components/SectionHero";
import { downsample, RANGES, type RangeKey } from "../utils/downsample";
import { isPointOutsideLimits, summarizeBreaches } from "../utils/status";

function timeLabel(ts: number) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(ts);
}

function dayLabel(ts: number) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(ts);
}

function growlightDurationMinutes(history: TelemetryPoint[]) {
  return history.slice(1).reduce((total, point, index) => {
    const previous = history[index];
    return previous.gl ? total + Math.max(0, point.ts - previous.ts) / 60_000 : total;
  }, 0);
}

// Ringkasan pakai batas dari Pengaturan, bukan angka tetap. Dulu 80/30/28
// ditulis langsung di sini sehingga Riwayat bisa bilang "aman" saat Beranda bilang "bahaya".
// Dihitung dari data MENTAH: rata-rata bucket menyembunyikan lonjakan pendek.
function buildHistorySummary(
  history: TelemetryPoint[],
  multiDay: boolean,
  thresholds: ThresholdConfig,
) {
  if (history.length === 0) return [];

  const label = multiDay ? dayLabel : timeLabel;
  const when = multiDay ? "pada" : "sekitar pukul";
  const lines: string[] = [];

  // Kelembapan udara: kejadian, bukan jumlah pembacaan.
  const rhEvents = summarizeBreaches(history, (p) => p.h < thresholds.rh_low || p.h > thresholds.rh_high);
  if (rhEvents.count > 0) {
    lines.push(`Udara terlalu lembap ${rhEvents.count} kali.`);
    if (rhEvents.worstAt !== null) {
      lines.push(`Paling lama ${rhEvents.longestMinutes} menit, ${when} ${label(rhEvents.worstAt)}.`);
    }
  }

  // Media tanam kering: paling penting bagi petani setelah kelembapan.
  const soilEvents = summarizeBreaches(history, (p) => p.s < thresholds.soil_low || p.s > thresholds.soil_high);
  if (soilEvents.count > 0) {
    lines.push(`Media tanam kering ${soilEvents.count} kali.`);
    if (soilEvents.worstAt !== null) {
      lines.push(`Paling lama ${soilEvents.longestMinutes} menit, ${when} ${label(soilEvents.worstAt)}.`);
    }
  }

  const tempEvents = summarizeBreaches(history, (p) => p.t < thresholds.temp_low || p.t > thresholds.temp_high);
  if (tempEvents.count > 0) {
    lines.push(`Suhu di luar batas ${tempEvents.count} kali.`);
  }

  if (lines.length === 0) lines.push("Semua kondisi aman pada rentang ini.");
  return lines;
}

export function HistoryPage({
  history,
  isLoading,
  thresholds,
  loadRange,
}: {
  history: TelemetryPoint[];
  isLoading: boolean;
  thresholds: ThresholdConfig;
  loadRange: (days: number) => Promise<TelemetryPoint[]>;
}) {
  const [rangeKey, setRangeKey] = useState<RangeKey>("today");
  const [chart, setChart] = useState<"temperature" | "humidity" | "light" | "soil">("temperature");
  const [rangeData, setRangeData] = useState<TelemetryPoint[] | null>(null);
  const [rangeLoading, setRangeLoading] = useState(false);

  const range = RANGES.find((item) => item.key === rangeKey) ?? RANGES[0];
  const multiDay = range.days > 1;

  // Rentang > 1 hari perlu query terpisah; hari ini pakai data realtime yang sudah ada.
  useEffect(() => {
    if (!multiDay) {
      setRangeData(null);
      return;
    }
    let cancelled = false;
    setRangeLoading(true);
    loadRange(range.days)
      .then((points) => {
        if (!cancelled) setRangeData(points);
      })
      .catch(() => {
        if (!cancelled) setRangeData([]);
      })
      .finally(() => {
        if (!cancelled) setRangeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.days, multiDay, loadRange]);

  const sourcePoints = multiDay ? (rangeData ?? []) : history;
  const visibleHistory = useMemo(
    () => downsample(sourcePoints, range.bucketMs),
    [sourcePoints, range.bucketMs],
  );
  const summary = useMemo(
    () => buildHistorySummary(sourcePoints, multiDay, thresholds),
    [sourcePoints, multiDay, thresholds],
  );
  const times = visibleHistory.map((point) => point.ts);
  const growlightMinutes = growlightDurationMinutes(visibleHistory);
  // Deteksi masalah harus dari data mentah: rata-rata bucket menyembunyikan lonjakan pendek.
  const hasIssue = sourcePoints.some((point) => isPointOutsideLimits(point, thresholds));

  const chartConfig = {
    temperature: {
      title: "Suhu Udara",
      unit: "°C",
      values: visibleHistory.map((point) => point.t),
      raw: sourcePoints.map((point) => point.t),
      band: { low: thresholds.temp_low, high: thresholds.temp_high },
    },
    humidity: {
      title: "Kelembapan Udara",
      unit: "%",
      values: visibleHistory.map((point) => point.h),
      raw: sourcePoints.map((point) => point.h),
      band: { low: thresholds.rh_low, high: thresholds.rh_high },
    },
    light: {
      title: "Cahaya Alami",
      unit: "lux",
      values: visibleHistory.map((point) => point.l),
      raw: sourcePoints.map((point) => point.l),
      band: { low: thresholds.lux_low, high: thresholds.lux_high },
      note: `Lampu tanam menyala sekitar ${Math.round(growlightMinutes)} menit.`,
    },
    soil: {
      title: "Kelembapan Media",
      unit: "%",
      values: visibleHistory.map((point) => point.s),
      raw: sourcePoints.map((point) => point.s),
      band: { low: thresholds.soil_low, high: thresholds.soil_high },
    },
  }[chart];

  if (isLoading) {
    return (
      <div className="page-stack">
        <SectionHero eyebrow="Pola Greenhouse" title="Riwayat Greenhouse">
          <p>Menyiapkan grafik kondisi greenhouse.</p>
        </SectionHero>
        <div className="chart-grid">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SectionHero eyebrow="Pola Greenhouse" title="Riwayat Greenhouse">
        <p>Lihat pola kondisi greenhouse dengan bahasa sederhana.</p>
      </SectionHero>

      <section className="segmented" aria-label="Pilih rentang riwayat">
        {RANGES.map((item) => (
          <button
            className={item.key === rangeKey ? "active" : ""}
            type="button"
            aria-pressed={item.key === rangeKey}
            onClick={() => setRangeKey(item.key)}
            key={item.key}
          >
            {item.label}
          </button>
        ))}
      </section>

      {rangeLoading ? (
        <section className="chart-grid chart-grid-single">
          <ChartSkeleton />
        </section>
      ) : visibleHistory.length === 0 ? (
        <section className="empty-state">
          <h2>Belum ada data untuk {range.label.toLowerCase()}.</h2>
          <p>Data akan muncul setelah perangkat mengirim pembacaan sensor.</p>
        </section>
      ) : (
        <>
          <section className={`history-summary ${hasIssue ? "tone-warning" : "tone-safe"}`}>
            <h2>{hasIssue ? `${range.label} perlu perhatian` : `Kondisi ${range.label.toLowerCase()} aman`}</h2>
            {summary.slice(0, 2).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </section>

          <section className="chart-switcher" aria-label="Pilih kondisi riwayat">
            {([["temperature", "Suhu"], ["humidity", "Udara"], ["light", "Cahaya"], ["soil", "Media"]] as const).map(([key, label]) => (
              <button key={key} className={chart === key ? "active" : ""} type="button" onClick={() => setChart(key)}>
                {label}
              </button>
            ))}
          </section>

          <section className="chart-grid chart-grid-single">
            <MetricChart
              title={chartConfig.title}
              unit={chartConfig.unit}
              values={chartConfig.values}
              times={times}
              band={chartConfig.band}
              showDates={multiDay}
              rawValues={chartConfig.raw}
            />
            {"note" in chartConfig && <p className="chart-note">{chartConfig.note}</p>}
          </section>
        </>
      )}
    </div>
  );
}

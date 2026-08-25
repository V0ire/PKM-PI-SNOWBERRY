import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import type { TelemetryPoint, ThresholdConfig } from "../types";
import { ChartSkeleton } from "../components/LoadingSkeleton";
import { MetricChart } from "../components/MetricChart";
import { SectionHero } from "../components/SectionHero";
import { formatDecimal, formatInteger } from "../utils/date";
import { downsample, RANGES, type RangeKey } from "../utils/downsample";
import { buildDailySummaries } from "../utils/historyDaily";
import { jakartaDateDocIds } from "../utils/historyData";
import { buildHistorySummary, growlightDurationMinutes, hasHistoryIssue } from "../utils/historySummary";

function rangeLabel(summary: { min: number; max: number; avg: number }, integer = false) {
  const format = integer ? formatInteger : formatDecimal;
  return `${format(summary.min)}–${format(summary.max)} (rata-rata ${format(summary.avg)})`;
}

// Stempel waktu WIB "YYYY-MM-DD HH:mm:ss" — format yang enak dipakai di
// spreadsheet laporan penelitian.
function wibTimestamp(ts: number): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).format(ts).replace("T", " ");
}

function exportTelemetryCsv(points: TelemetryPoint[], label: string) {
  if (points.length === 0) return;
  const header = "waktu_wib,suhu_c,kelembapan_udara_pct,lux,kelembapan_media_pct,lampu_tanam,pompa,pengabut,kipas";
  const rows = points.map((p) => [
    wibTimestamp(p.ts), p.t, p.h, p.l, p.s,
    p.gl ? 1 : 0, p.p ? 1 : 0, p.m ? 1 : 0, p.f ? 1 : 0,
  ].join(","));
  const blob = new Blob(["\uFEFF" + header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `snowberry-telemetry-${label}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function HistoryPage({
  history,
  isLoading,
  thresholds,
  loadRange,
  loadDay,
}: {
  history: TelemetryPoint[];
  isLoading: boolean;
  thresholds: ThresholdConfig;
  loadRange: (days: number) => Promise<TelemetryPoint[]>;
  loadDay: (dateId: string) => Promise<TelemetryPoint[]>;
}) {
  const [rangeKey, setRangeKey] = useState<RangeKey>("today");
  const [chart, setChart] = useState<"temperature" | "humidity" | "light" | "soil">("temperature");
  const [rangeData, setRangeData] = useState<TelemetryPoint[] | null>(null);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeError, setRangeError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const todayId = jakartaDateDocIds(Date.now(), 1)[0];
  const [selectedDate, setSelectedDate] = useState(todayId);

  const range = RANGES.find((item) => item.key === rangeKey) ?? RANGES[0];
  const multiDay = range.days > 1;
  const pickDay = range.key === "day";

  useEffect(() => {
    if (!multiDay && !pickDay) {
      setRangeData(null);
      setRangeLoading(false);
      setRangeError(false);
      return;
    }
    let cancelled = false;
    setRangeLoading(true);
    setRangeError(false);
    const request = pickDay ? loadDay(selectedDate) : loadRange(range.days);
    request
      .then((points) => {
        if (!cancelled) setRangeData(points);
      })
      .catch(() => {
        if (!cancelled) {
          setRangeData(null);
          setRangeError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setRangeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadDay, loadRange, multiDay, pickDay, range.days, requestVersion, selectedDate]);

  const retryRange = useCallback(() => setRequestVersion((version) => version + 1), []);
  const loadedPoints = multiDay || pickDay ? (rangeData ?? []) : history;
  const visibleHistory = useMemo(
    () => downsample(loadedPoints, range.bucketMs),
    [loadedPoints, range.bucketMs],
  );
  const summary = useMemo(
    () => buildHistorySummary(loadedPoints, multiDay, thresholds),
    [loadedPoints, multiDay, thresholds],
  );
  const times = visibleHistory.map((point) => point.ts);
  const growlightMinutes = growlightDurationMinutes(loadedPoints);
  const hasIssue = hasHistoryIssue(loadedPoints, thresholds);
  const dailySummaries = useMemo(
    () => buildDailySummaries(loadedPoints),
    [loadedPoints],
  );

  const chartConfig = {
    temperature: {
      title: "Suhu Udara",
      unit: "°C",
      values: visibleHistory.map((point) => point.t),
      bands: visibleHistory.map((point) => point.bands.t),
      thresholdLow: thresholds.temp_low,
      thresholdHigh: thresholds.temp_high,
      detail: `Batas otomatis ${thresholds.temp_low}–${thresholds.temp_high} °C.`,
    },
    humidity: {
      title: "Kelembapan Udara",
      unit: "%",
      values: visibleHistory.map((point) => point.h),
      bands: visibleHistory.map((point) => point.bands.h),
      thresholdLow: thresholds.rh_low,
      thresholdHigh: thresholds.rh_high,
      detail: `Batas otomatis ${thresholds.rh_low}–${thresholds.rh_high}%.`,
    },
    light: {
      title: "Cahaya Alami",
      unit: "lux",
      values: visibleHistory.map((point) => point.l),
      bands: visibleHistory.map((point) => point.bands.l),
      thresholdLow: thresholds.lux_low,
      thresholdHigh: thresholds.lux_high,
      detail: `Lampu tanam diperintahkan menyala sekitar ${Math.round(growlightMinutes)} menit.`,
    },
    soil: {
      title: "Kelembapan Media",
      unit: "%",
      values: visibleHistory.map((point) => point.s),
      bands: visibleHistory.map((point) => point.bands.s),
      thresholdLow: thresholds.soil_low,
      thresholdHigh: thresholds.soil_high,
      detail: `Batas otomatis ${thresholds.soil_low}–${thresholds.soil_high}%.`,
    },
  }[chart];

  if (isLoading) {
    return (
      <div className="page-stack">
        <SectionHero eyebrow="Pola Greenhouse" title="Riwayat Greenhouse">
          <p>Menyiapkan grafik kondisi greenhouse.</p>
        </SectionHero>
        <div className="chart-grid"><ChartSkeleton /></div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <SectionHero eyebrow="Pola Greenhouse" title="Riwayat Greenhouse">
        <p>Lihat pola kondisi greenhouse harian, pilih tanggal tertentu, atau unduh datanya untuk laporan.</p>
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

      {pickDay && (
        <section className="card day-picker-card">
          <label className="field">
            Tanggal yang ingin dilihat
            <input
              type="date"
              value={selectedDate}
              max={todayId}
              onChange={(event) => setSelectedDate(event.target.value || todayId)}
            />
          </label>
        </section>
      )}

      {rangeLoading ? (
        <section className="chart-grid chart-grid-single" aria-live="polite">
          <ChartSkeleton />
        </section>
      ) : rangeError ? (
        <section className="empty-state" role="alert">
          <h2>Riwayat belum berhasil dimuat.</h2>
          <p>Periksa koneksi internet, lalu coba lagi.</p>
          <button className="btn outline" type="button" onClick={retryRange}>Coba Lagi</button>
        </section>
      ) : visibleHistory.length === 0 ? (
        <section className="empty-state">
          <h2>Belum ada data untuk {range.summaryLabel}.</h2>
          <p>Data muncul setelah perangkat mengirim pembacaan sensor.</p>
        </section>
      ) : (
        <>
          <section className={`history-summary ${hasIssue ? "tone-warning" : "tone-safe"}`}>
            <h2>{hasIssue ? `Ada kondisi yang perlu dicek ${range.summaryLabel}` : `Kondisi ${range.summaryLabel} optimal`}</h2>
            {summary.slice(0, 2).map((line) => <p key={line}>{line}</p>)}
          </section>

          <section className="chart-switcher" aria-label="Pilih kondisi riwayat">
            {([["temperature", "Suhu"], ["humidity", "Udara"], ["light", "Cahaya"], ["soil", "Media"]] as const).map(([key, label]) => (
              <button key={key} className={chart === key ? "active" : ""} type="button" onClick={() => setChart(key)}>{label}</button>
            ))}
          </section>

          <section className="history-summary">
            <h2>{chartConfig.title}</h2>
            <p>{chartConfig.detail}</p>
          </section>

          <section className="chart-grid chart-grid-single">
            <MetricChart
              title={chartConfig.title}
              unit={chartConfig.unit}
              values={chartConfig.values}
              bands={chartConfig.bands}
              times={times}
              showDates={multiDay || pickDay}
              thresholdLow={chartConfig.thresholdLow}
              thresholdHigh={chartConfig.thresholdHigh}
            />
          </section>

          <section className="export-row">
            <button className="btn outline" type="button" onClick={() => exportTelemetryCsv(loadedPoints, selectedDate)}>
              <Download size={16} strokeWidth={2.2} aria-hidden="true" /> Unduh Data CSV ({loadedPoints.length} baris)
            </button>
            <p>Format spreadsheet siap dipakai untuk laporan penelitian.</p>
          </section>

          <section className="daily-history" aria-label="Riwayat harian">
            <h2>Riwayat Harian</h2>
            <p>Naik-turun kondisi setiap hari, bukan hanya rata-rata.</p>
            <ul className="daily-list">
              {dailySummaries.map((day) => (
                <li key={day.dayKey}>
                  <strong>{day.dateLabel}</strong>
                  <div className="daily-metrics">
                    <span>Suhu {rangeLabel(day.temperature)} °C</span>
                    <span>Udara {rangeLabel(day.humidity)} %</span>
                    <span>Media {rangeLabel(day.soil)} %</span>
                    <span>Cahaya {rangeLabel(day.light, true)} lux</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

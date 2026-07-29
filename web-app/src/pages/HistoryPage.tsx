import { useMemo, useState } from "react";
import type { TelemetryPoint } from "../types";
import { ChartSkeleton } from "../components/LoadingSkeleton";
import { MetricChart } from "../components/MetricChart";
import { SectionHero } from "../components/SectionHero";

function timeLabel(ts: number) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(ts);
}

function growlightDurationMinutes(history: TelemetryPoint[]) {
  return history.slice(1).reduce((total, point, index) => {
    const previous = history[index];
    return previous.gl ? total + Math.max(0, point.ts - previous.ts) / 60_000 : total;
  }, 0);
}

function buildHistorySummary(history: TelemetryPoint[]) {
  if (history.length === 0) return [];

  const highestTemp = history.reduce((highest, point) => (point.t > highest.t ? point : highest), history[0]);
  const lowestSoil = history.reduce((lowest, point) => (point.s < lowest.s ? point : lowest), history[0]);
  const humidPoints = history.filter((point) => point.h >= 80).length;

  return [
    `Suhu paling tinggi terjadi sekitar pukul ${timeLabel(highestTemp.ts)}.`,
    `Kelembapan media paling rendah sekitar pukul ${timeLabel(lowestSoil.ts)}.`,
    humidPoints > 0
      ? "Kelembapan udara sempat tinggi. Area bunga perlu tetap mendapat sirkulasi udara."
      : "Kelembapan udara tidak sering melewati batas tinggi hari ini.",
  ];
}

export function HistoryPage({ history, isLoading }: { history: TelemetryPoint[]; isLoading: boolean }) {
  const [range, setRange] = useState("Hari Ini");
  const [chart, setChart] = useState<"temperature" | "humidity" | "light" | "soil">("temperature");
  const visibleHistory = range === "Hari Ini" ? history : history.slice(-Math.min(history.length, 7 * 24));
  const summary = useMemo(() => buildHistorySummary(visibleHistory), [visibleHistory]);
  const times = visibleHistory.map((point) => point.ts);
  const growlightMinutes = growlightDurationMinutes(visibleHistory);
  const hasIssue = visibleHistory.some((point) => point.h >= 80 || point.s <= 30 || point.t >= 28);
  const chartConfig = {
    temperature: { title: "Suhu Udara", unit: "°C", values: visibleHistory.map((point) => point.t), detail: "Suhu berubah mengikuti panas matahari dan sirkulasi udara greenhouse." },
    humidity: { title: "Kelembapan Udara", unit: "%", values: visibleHistory.map((point) => point.h), detail: "Kelembapan terlalu tinggi terlalu lama dapat meningkatkan risiko jamur." },
    light: { title: "Cahaya Alami", unit: "lux", values: visibleHistory.map((point) => point.l), detail: `Lampu tanam menyala sekitar ${Math.round(growlightMinutes)} menit. Cahaya alami dan durasi lampu ditampilkan terpisah sampai lampu dikalibrasi di level tanaman.` },
    soil: { title: "Kelembapan Media", unit: "%", values: visibleHistory.map((point) => point.s), detail: "Media perlu lembap stabil agar akar mendapat cukup air dan udara." },
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
        {["Hari Ini", "7 Hari"].map((item) => (
          <button className={item === range ? "active" : ""} type="button" onClick={() => setRange(item)} key={item}>
            {item}
          </button>
        ))}
      </section>

      {visibleHistory.length === 0 ? (
        <section className="empty-state">
          <h2>Belum ada data riwayat hari ini.</h2>
          <p>Data akan muncul setelah perangkat mengirim pembacaan sensor.</p>
        </section>
      ) : (
        <>
            <section className={`history-summary ${hasIssue ? "tone-warning" : "tone-safe"}`}>
              <h2>{hasIssue ? "Hari ini perlu perhatian" : "Kondisi hari ini aman"}</h2>
              <p>{summary.length} kondisi tercatat pada data yang tersedia.</p>
            </section>

            <section className="chart-switcher" aria-label="Pilih kondisi riwayat">
              {([ ["temperature", "Suhu"], ["humidity", "Udara"], ["light", "Cahaya"], ["soil", "Media"] ] as const).map(([key, label]) => (
                <button key={key} className={chart === key ? "active" : ""} type="button" onClick={() => setChart(key)}>{label}</button>
              ))}
            </section>

            <section className="history-summary">
              <h2>{chartConfig.title}</h2>
              <p>{chartConfig.detail}</p>
            </section>

            <section className="chart-grid chart-grid-single">
              <MetricChart title={chartConfig.title} unit={chartConfig.unit} values={chartConfig.values} times={times} />
            </section>
        </>
      )}
    </div>
  );
}

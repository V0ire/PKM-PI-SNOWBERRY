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
  const summary = useMemo(() => buildHistorySummary(history), [history]);
  const times = history.map((point) => point.ts);

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
        <p>Lihat cerita kondisi hari ini tanpa membaca tabel data mentah.</p>
      </SectionHero>

      <section className="segmented" aria-label="Pilih rentang riwayat">
        {["Hari Ini", "7 Hari", "30 Hari"].map((item) => (
          <button className={item === range ? "active" : ""} type="button" onClick={() => setRange(item)} key={item}>
            {item}
          </button>
        ))}
      </section>

      {history.length === 0 ? (
        <section className="empty-state">
          <h2>Belum ada data riwayat hari ini.</h2>
          <p>Data akan muncul setelah perangkat mengirim pembacaan sensor.</p>
        </section>
      ) : (
        <>
          <section className="history-summary">
            <h2>{range === "Hari Ini" ? "Cerita Hari Ini" : `Cerita ${range}`}</h2>
            {summary.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </section>

          <section className="chart-grid">
            <MetricChart title="Suhu Udara" unit="°C" values={history.map((point) => point.t)} times={times} />
            <MetricChart title="Kelembapan Udara" unit="%" values={history.map((point) => point.h)} times={times} />
            <MetricChart title="Cahaya" unit="lux" values={history.map((point) => point.l)} times={times} />
            <MetricChart title="Kelembapan Media" unit="%" values={history.map((point) => point.s)} times={times} />
          </section>
        </>
      )}
    </div>
  );
}

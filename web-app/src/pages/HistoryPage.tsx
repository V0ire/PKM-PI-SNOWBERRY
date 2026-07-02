import { useMemo, useState } from "react";
import type { TelemetryPoint } from "../types";
import { ChartSkeleton } from "../components/LoadingSkeleton";
import { MetricChart } from "../components/MetricChart";
import { SectionHero } from "../components/SectionHero";

export function HistoryPage({ history, isLoading }: { history: TelemetryPoint[]; isLoading: boolean }) {
  const [range, setRange] = useState("Hari Ini");
  const summary = useMemo(
    () => [
      "Suhu paling tinggi terjadi sekitar pukul 13.00.",
      "Kelembapan media sempat rendah pada sore hari.",
      "Kelembapan udara sering naik pada malam hari.",
    ],
    [],
  );

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
        <p>Lihat pola suhu, kelembapan, cahaya, dan media tanam tanpa membaca data mentah.</p>
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
            <h2>{range === "Hari Ini" ? "Ringkasan Hari Ini" : `Ringkasan ${range}`}</h2>
            {summary.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </section>

          <section className="chart-grid">
            <MetricChart title="Suhu Udara" unit="°C" values={history.map((point) => point.t)} />
            <MetricChart title="Kelembapan Udara" unit="%" values={history.map((point) => point.h)} />
            <MetricChart title="Cahaya" unit="lux" values={history.map((point) => point.l)} />
            <MetricChart title="Kelembapan Media" unit="%" values={history.map((point) => point.s)} />
          </section>
        </>
      )}
    </div>
  );
}

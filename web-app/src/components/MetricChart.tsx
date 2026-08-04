import { formatDecimal, formatInteger } from "../utils/date";
import { Card } from "./Card";

function timeLabel(ts?: number, withDate = false) {
  if (!ts) return "";
  return new Intl.DateTimeFormat(
    "id-ID",
    withDate
      ? { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }
      : { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" },
  ).format(ts);
}

function valueLabel(value: number, unit: string) {
  return `${unit === "lux" ? formatInteger(value) : formatDecimal(value)} ${unit}`;
}

export function MetricChart({
  title,
  unit,
  values,
  times = [],
  band,
  showDates = false,
  rawValues,
}: {
  title: string;
  unit: string;
  values: number[];
  times?: number[];
  band?: { low: number; high: number };
  showDates?: boolean;
  rawValues?: number[];
}) {
  // Skala menyertakan batas aman supaya pita batas selalu terlihat di grafik.
  // Padding 8% mencegah pita mengisi seluruh tinggi dan menempel di tepi.
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const rawMin = band ? Math.min(dataMin, band.low) : dataMin;
  const rawMax = band ? Math.max(dataMax, band.high) : dataMax;
  const pad = Math.max(0.5, (rawMax - rawMin) * 0.08);
  const min = rawMin - pad;
  const max = rawMax + pad;
  const span = Math.max(1, max - min);
  const toY = (value: number) => 88 - ((value - min) / span) * 72;

  const chartPoints = values.map((value, index) => ({
    value,
    x: values.length === 1 ? 0 : (index / (values.length - 1)) * 100,
    y: toY(value),
  }));
  const points = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const first = values[0];
  const latest = values[values.length - 1];
  const delta = latest - first;
  const trend = Math.abs(delta) < 0.1 ? "Stabil" : delta > 0 ? "Naik" : "Turun";
  const midIndex = Math.floor((times.length - 1) / 2);

  // Titik lingkaran hanya untuk data pendek; 100+ titik jadi noise.
  const showDots = chartPoints.length <= 40;
  const bandTop = band ? toY(band.high) : 0;
  const bandHeight = band ? Math.max(0, toY(band.low) - toY(band.high)) : 0;
  // Hitung pelanggaran batas dari data mentah, bukan hasil rata-rata bucket.
  const breachSource = rawValues ?? values;
  const outside = band ? breachSource.filter((v) => v < band.low || v > band.high).length : 0;

  // Segmen di luar batas digambar amber di atas garis utama, supaya petani melihat
  // KAPAN masalah terjadi, bukan hanya membaca jumlahnya.
  const breachSegments: Array<{ key: string; points: string }> = [];
  if (band) {
    let current: typeof chartPoints = [];
    chartPoints.forEach((point, index) => {
      const outsideBand = point.value < band.low || point.value > band.high;
      if (outsideBand) {
        // Sambungkan dari titik sebelumnya agar segmen tidak menggantung.
        if (current.length === 0 && index > 0) current.push(chartPoints[index - 1]);
        current.push(point);
        return;
      }
      if (current.length > 0) {
        current.push(point);
        breachSegments.push({ key: `b${index}`, points: current.map((p) => `${p.x},${p.y}`).join(" ") });
        current = [];
      }
    });
    if (current.length > 1) {
      breachSegments.push({ key: "bend", points: current.map((p) => `${p.x},${p.y}`).join(" ") });
    }
  }

  return (
    <Card className="chart-card">
      <div className="card-topline">
        <h3>{title}</h3>
        <span className="chart-current">{valueLabel(latest, unit)}</span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`Grafik ${title}`}>
        {band ? <rect className="chart-band" x="0" y={bandTop} width="100" height={bandHeight} /> : null}
        {band ? <line className="chart-band-edge" x1="0" y1={bandTop} x2="100" y2={bandTop} /> : null}
        {band ? (
          <line className="chart-band-edge" x1="0" y1={toY(band.low)} x2="100" y2={toY(band.low)} />
        ) : null}
        <line x1="0" y1="88" x2="100" y2="88" />
        <line x1="0" y1="52" x2="100" y2="52" />
        <line x1="0" y1="16" x2="100" y2="16" />
        <polyline points={points} />
        {breachSegments.map((segment) => (
          <polyline key={segment.key} className="chart-breach" points={segment.points} />
        ))}
        {showDots
          ? chartPoints.map((point, index) => <circle key={`${title}-${index}`} cx={point.x} cy={point.y} r="1.8" />)
          : null}
      </svg>
      <div className="chart-axis" aria-hidden="true">
        <span>{timeLabel(times[0], showDates)}</span>
        <span>{timeLabel(times[midIndex], showDates)}</span>
        <span>{timeLabel(times[times.length - 1], showDates)}</span>
      </div>
      {band ? (
        <p className="chart-band-note">
          Hijau = nyaman {valueLabel(band.low, unit)}–{valueLabel(band.high, unit)}.
          {outside > 0 ? " Kuning = saat di luar batas." : " Semua di dalam batas."}
        </p>
      ) : null}
    </Card>
  );
}

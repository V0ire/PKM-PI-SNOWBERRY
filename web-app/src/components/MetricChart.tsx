import { formatDecimal, formatInteger } from "../utils/date";
import { Card } from "./Card";

function timeLabel(ts?: number) {
  if (!ts) return "";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(ts);
}

function valueLabel(value: number, unit: string) {
  return `${unit === "lux" ? formatInteger(value) : formatDecimal(value)} ${unit}`;
}

export function MetricChart({ title, unit, values, times = [] }: { title: string; unit: string; values: number[]; times?: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const chartPoints = values.map((value, index) => {
    const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100;
    const y = 88 - ((value - min) / span) * 72;
    return { value, x, y };
  });
  const points = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const first = values[0];
  const latest = values[values.length - 1];
  const delta = latest - first;
  const trend = Math.abs(delta) < 0.1 ? "Stabil" : delta > 0 ? "Naik" : "Turun";
  const midIndex = Math.floor((times.length - 1) / 2);

  return (
    <Card className="chart-card">
      <div className="card-topline">
        <h3>{title}</h3>
        <span className="chart-current">
          {valueLabel(latest, unit)}
        </span>
      </div>
      <div className="chart-stats" aria-label={`Ringkasan ${title}`}>
        <span>Rendah {valueLabel(min, unit)}</span>
        <span>Tinggi {valueLabel(max, unit)}</span>
        <span>{trend} {valueLabel(Math.abs(delta), unit)}</span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`Grafik ${title}`}>
        <line x1="0" y1="88" x2="100" y2="88" />
        <line x1="0" y1="52" x2="100" y2="52" />
        <line x1="0" y1="16" x2="100" y2="16" />
        <polyline points={points} />
        {chartPoints.map((point, index) => (
          <circle key={`${title}-${index}`} cx={point.x} cy={point.y} r="1.8" />
        ))}
      </svg>
      <div className="chart-axis" aria-hidden="true">
        <span>{timeLabel(times[0])}</span>
        <span>{timeLabel(times[midIndex])}</span>
        <span>{timeLabel(times[times.length - 1])}</span>
      </div>
    </Card>
  );
}

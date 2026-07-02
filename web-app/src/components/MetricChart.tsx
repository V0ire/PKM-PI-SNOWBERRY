import { formatDecimal } from "../utils/date";
import { Card } from "./Card";

export function MetricChart({ title, unit, values }: { title: string; unit: string; values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100;
      const y = 88 - ((value - min) / span) * 72;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Card className="chart-card">
      <div className="card-topline">
        <h3>{title}</h3>
        <span className="chart-current">
          {formatDecimal(values[values.length - 1])} {unit}
        </span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`Grafik ${title}`}>
        <line x1="0" y1="88" x2="100" y2="88" />
        <line x1="0" y1="52" x2="100" y2="52" />
        <polyline points={points} />
      </svg>
    </Card>
  );
}

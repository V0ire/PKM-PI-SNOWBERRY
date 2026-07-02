import type { ConnectionState, SensorMetric } from "../types";
import { sensorVisual } from "../utils/status";
import { Card } from "./Card";
import { StatusPill } from "./StatusPill";

export function SensorCard({ metric, connection }: { metric: SensorMetric; connection: ConnectionState }) {
  const visual = sensorVisual[connection === "offline" ? "unknown" : metric.status];
  const stale = connection !== "online";

  return (
    <Card className={`sensor-card ${visual.className}`}>
      <div className="card-topline">
        <h3>{metric.label}</h3>
        <StatusPill label={visual.label} className={visual.className} />
      </div>
      {stale && <span className="data-label">Data terakhir</span>}
      <p className="sensor-value">{metric.value}</p>
      <p className="meaning">{stale ? "Data ini adalah pembacaan terakhir yang diterima aplikasi." : metric.meaning}</p>
      <p className="action-text">{metric.action}</p>
    </Card>
  );
}

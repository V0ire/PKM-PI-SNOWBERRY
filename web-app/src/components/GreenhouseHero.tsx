import { CircleCheck, CloudOff, CloudSun, TriangleAlert } from "lucide-react";
import type { SensorStatusKey } from "../types";
import { sensorVisual } from "../utils/status";

const STATUS_ICON: Record<SensorStatusKey, typeof CircleCheck> = {
  safe: CircleCheck,
  warning: CloudSun,
  danger: TriangleAlert,
  unknown: CloudOff,
};

export function GreenhouseHero({
  tone,
  title,
  detail,
  action,
  phase,
  issueCount,
  onOpenChecks,
  updatedText,
}: {
  tone: SensorStatusKey;
  title: string;
  detail: string;
  action: string;
  phase: string;
  issueCount: number;
  onOpenChecks: () => void;
  updatedText?: string;
}) {
  const visual = sensorVisual[tone];
  const Icon = STATUS_ICON[tone];

  return (
    <section className={`greenhouse-hero ${visual.className}`}>
      <div className="hero-copy">
        <div className="hero-meta">
          <span>{phase}</span>
          <span><Icon size={14} aria-hidden="true" /> {visual.label}</span>
        </div>
        <h1>{title}</h1>
        <p>{detail}</p>
        <p className="hero-action">{action}</p>
        {issueCount > 0 && <button type="button" className="hero-check-link" onClick={onOpenChecks}>Ada {issueCount} masalah lain</button>}
      </div>
    </section>
  );
}

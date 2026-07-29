import type { ReactNode } from "react";
import type { SensorStatusKey } from "../types";

const GAUGE_COLORS: Record<SensorStatusKey, string> = {
  safe: "var(--status-safe-border)",
  warning: "var(--status-warning-border)",
  danger: "var(--status-danger-border)",
  unknown: "var(--status-unknown-border)",
};

const TRACK_COLOR = "var(--color-border)";

export function SensorGauge({
  value,
  label,
  status,
  percent,
  icon,
  onClick,
}: {
  value: string;
  label: string;
  status: SensorStatusKey;
  percent: number;
  icon?: ReactNode;
  onClick?: () => void;
}) {
  const r = 38;
  const stroke = 7;
  const cx = 50;
  const cy = 50;
  const circumference = 2 * Math.PI * r;
  const clampedPct = Math.max(0, Math.min(100, percent));
  const offset = circumference * (1 - clampedPct / 100);

  return (
    <button
      type="button"
      className={`sensor-gauge tone-${status}`}
      onClick={onClick}
      aria-label={`${label}: ${value}`}
    >
      <div className="gauge-wrap">
        {icon && <span className="gauge-icon">{icon}</span>}
        <svg viewBox="0 0 100 100" className="gauge-ring">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={TRACK_COLOR} strokeWidth={stroke} opacity={0.25} />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={GAUGE_COLORS[status]}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            className="gauge-fill"
          />
        </svg>
        <div className="gauge-content">
          <strong>{value}</strong>
        </div>
      </div>
      <span className="gauge-label">{label}</span>
    </button>
  );
}

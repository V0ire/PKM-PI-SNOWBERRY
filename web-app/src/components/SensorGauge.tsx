import type { ReactNode } from "react";
import type { SensorStatusKey } from "../types";

// Kata status + posisi nilai pada rentang nyaman.
// Cincin lama menipu: 82% RH tergambar hampir penuh seolah bagus, padahal di luar batas.
const STATUS_LABEL: Record<SensorStatusKey, string> = {
  safe: "Aman",
  warning: "Perlu Cek",
  danger: "Bahaya",
  unknown: "Tidak Ada Data",
};

export function SensorGauge({
  value,
  label,
  status,
  band,
  markerPercent,
  bandStartPercent,
  bandWidthPercent,
  icon,
  onClick,
}: {
  value: string;
  label: string;
  status: SensorStatusKey;
  /** Teks rentang nyaman, mis. "60–80%". Disembunyikan jika tidak ada. */
  band?: string;
  /** Posisi nilai sekarang pada batang, 0–100. */
  markerPercent: number;
  /** Awal area hijau pada batang, 0–100. */
  bandStartPercent: number;
  /** Lebar area hijau pada batang, 0–100. */
  bandWidthPercent: number;
  icon?: ReactNode;
  onClick?: () => void;
}) {
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const marker = clamp(markerPercent);
  const bandStart = clamp(bandStartPercent);
  const bandWidth = clamp(bandWidthPercent);
  const statusLabel = STATUS_LABEL[status];

  return (
    <button
      type="button"
      className={`sensor-gauge tone-${status}`}
      onClick={onClick}
      aria-label={`${label}: ${value}, ${statusLabel}${band ? `, nyaman ${band}` : ""}`}
    >
      <span className="gauge-head">
        {icon && <span className="gauge-icon">{icon}</span>}
        <span className="gauge-label">{label}</span>
      </span>
      <span className="gauge-row">
        <strong className="gauge-value">{value}</strong>
        <span className={`pill tone-${status}`}>{statusLabel}</span>
      </span>
      {status !== "unknown" && (
        <>
          <span className="band-track" aria-hidden="true">
            <span className="band-safe" style={{ left: `${bandStart}%`, width: `${bandWidth}%` }} />
            <span className={`band-marker tone-${status}`} style={{ left: `${marker}%` }} />
          </span>
          {band && <span className="gauge-hint">Nyaman {band}</span>}
        </>
      )}
    </button>
  );
}

import { Droplets, Fan } from "lucide-react";
import type { ActuatorAvailability, RealtimeStatus } from "../types";
import { ACTUATOR_COPY } from "../data/mockSnowberry";
import { formatCountdown } from "../utils/date";
import { actuatorAvailabilityVisual } from "../utils/status";
import { Card } from "./Card";
import { StatusPill } from "./StatusPill";

// Pelembap Udara = SATU alat bagi petani, dijalankan oleh kabut + kipas.
// Kartu lama bilang "Menyala" walau hanya kipas yang jalan — itu menyesatkan.
// Sekarang keadaan sebagian dilaporkan apa adanya.
export function HumidifierCard({
  actuators,
  now,
  availability,
  onManualRequest,
  onToggle,
  onAuto,
  rhLow,
  rhHigh,
}: {
  actuators: RealtimeStatus["actuators"];
  now: number;
  availability: ActuatorAvailability;
  onManualRequest: () => void;
  onToggle: () => void;
  onAuto: () => void;
  rhLow: number;
  rhHigh: number;
}) {
  const copy = ACTUATOR_COPY.humidifier;
  const humidifier = actuators.humidifier;
  const anyOn = humidifier.state;
  const isManual = humidifier.mode === "MANUAL";
  const disabled = actuatorAvailabilityVisual[availability].disabled;

  // Verdict jujur: sebagian ≠ menyala penuh.
  const stateLabel = anyOn ? "Menyala" : "Mati";
  const stateTone = anyOn ? "tone-safe" : "tone-unknown";
  const manualUntil = humidifier.manual_until;

  return (
    <Card className={`actuator-card humidifier-card ${isManual ? "is-manual" : ""}`}>
      <div className="card-topline">
        <div className="icon-heading">
          <span className="tool-icon humidifier-icon">
            <Droplets size={18} aria-hidden="true" />
            <Fan size={16} aria-hidden="true" />
          </span>
          <div>
            <span className="card-kicker">Alat</span>
            <h3>{copy.label}</h3>
          </div>
        </div>
        <StatusPill label={stateLabel} className={stateTone} />
      </div>

      <p className="mode-line">
        {isManual ? "Manual Sementara" : "Otomatis"}
      </p>
      <p className="action-text">Bekerja saat kelembapan di luar {rhLow}–{rhHigh}%.</p>

      {isManual && <p className="countdown">Sisa {formatCountdown(manualUntil, now)}</p>}
      {disabled && <p className="disabled-note">{actuatorAvailabilityVisual[availability].message}</p>}

      <div className="button-row">
        {!isManual ? (
          <button className="btn outline" type="button" disabled={disabled} onClick={onManualRequest}>
            Buka Kontrol Manual
          </button>
        ) : (
          <>
            <button className="btn primary" type="button" disabled={disabled} onClick={onToggle}>
              {anyOn ? "Matikan" : "Nyalakan"}
            </button>
            <button className="btn plain" type="button" disabled={disabled} onClick={onAuto}>
              Kembali Otomatis
            </button>
          </>
        )}
      </div>
    </Card>
  );
}

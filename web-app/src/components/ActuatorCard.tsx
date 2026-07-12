import { Droplets, Fan, Lightbulb, Sprout } from "lucide-react";
import type { ActuatorAvailability, ActuatorKey, RealtimeStatus } from "../types";
import { ACTUATOR_COPY } from "../data/mockSnowberry";
import { formatCountdown } from "../utils/date";
import { actuatorAvailabilityVisual } from "../utils/status";
import { Card } from "./Card";
import { StatusPill } from "./StatusPill";

const ACTUATOR_ICON = {
  growlight: Lightbulb,
  pump: Sprout,
  mist: Droplets,
  fan: Fan,
};

export function ActuatorCard({
  actuatorKey,
  actuator,
  now,
  availability,
  onManualRequest,
  onToggle,
  onExtend,
  onAuto,
}: {
  actuatorKey: ActuatorKey;
  actuator: RealtimeStatus["actuators"][ActuatorKey];
  now: number;
  availability: ActuatorAvailability;
  onManualRequest: (key: ActuatorKey) => void;
  onToggle: (key: ActuatorKey) => void;
  onExtend: (key: ActuatorKey) => void;
  onAuto: (key: ActuatorKey) => void;
}) {
  const copy = ACTUATOR_COPY[actuatorKey];
  const isManual = actuator.mode === "MANUAL";
  const availabilityVisual = actuatorAvailabilityVisual[availability];
  const disabled = availabilityVisual.disabled;
  const Icon = ACTUATOR_ICON[actuatorKey];

  return (
    <Card className="actuator-card">
      <div className="card-topline">
        <div className="icon-heading">
          <span className="tool-icon">
            <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <div>
            <span className="card-kicker">Alat</span>
            <h3>{copy.label}</h3>
          </div>
        </div>
        <StatusPill label={actuator.state ? "Menyala" : "Mati"} className={actuator.state ? "tone-safe" : "tone-unknown"} />
      </div>
      <p className="mode-line">Mode: {isManual ? "Manual Sementara" : "Otomatis"}</p>
      <div className="sensor-guidance">
        <span>Peran alat</span>
        <p className="meaning">{copy.helpingText}</p>
      </div>
      <p className="action-text">
        {isManual
          ? "Kontrol otomatis berhenti sementara untuk alat ini."
          : actuator.state
            ? copy.activeText
            : copy.automaticText}
      </p>
      {isManual && <p className="countdown">Sisa waktu manual: {formatCountdown(actuator.manual_until, now)}</p>}
      {availability === "sending" && <p className="disabled-note">{actuator.state ? `Mematikan ${copy.label.toLowerCase()}...` : `Menyalakan ${copy.label.toLowerCase()}...`}</p>}
      {disabled && availability !== "sending" && <p className="disabled-note">{availabilityVisual.message}</p>}
      <div className="button-row">
        {!isManual ? (
          <button className="btn outline" type="button" onClick={() => onManualRequest(actuatorKey)} disabled={disabled}>
            {availability === "sending" ? "Menyiapkan kontrol..." : "Buka Kontrol Manual"}
          </button>
        ) : (
          <>
            <button className="btn primary" type="button" onClick={() => onToggle(actuatorKey)} disabled={disabled}>
              {actuator.state ? "Matikan" : "Nyalakan"}
            </button>
            <button className="btn outline" type="button" onClick={() => onExtend(actuatorKey)} disabled={disabled}>
              Perpanjang 30 Menit
            </button>
            <button className="btn plain" type="button" onClick={() => onAuto(actuatorKey)} disabled={disabled}>
              Kembalikan ke Otomatis
            </button>
          </>
        )}
      </div>
    </Card>
  );
}

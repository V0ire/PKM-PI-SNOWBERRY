import type { ActuatorAvailability, ActuatorKey, RealtimeStatus } from "../types";
import { ACTUATOR_COPY } from "../data/mockSnowberry";
import { formatCountdown } from "../utils/date";
import { actuatorAvailabilityVisual } from "../utils/status";
import { Card } from "./Card";
import { StatusPill } from "./StatusPill";

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

  return (
    <Card className="actuator-card">
      <div className="card-topline">
        <h3>{copy.label}</h3>
        <StatusPill label={actuator.state ? "Menyala" : "Mati"} className={actuator.state ? "tone-safe" : "tone-unknown"} />
      </div>
      <p className="mode-line">Mode: {isManual ? "Manual Sementara" : "Otomatis"}</p>
      <p className="meaning">{isManual ? "Kontrol otomatis berhenti sementara untuk alat ini." : copy.automaticText}</p>
      {isManual && <p className="countdown">Sisa waktu manual: {formatCountdown(actuator.manual_until, now)}</p>}
      {disabled && <p className="disabled-note">{availabilityVisual.message}</p>}
      <div className="button-row">
        {!isManual ? (
          <button className="btn outline" type="button" onClick={() => onManualRequest(actuatorKey)} disabled={disabled}>
            {availability === "sending" ? "Mengirim..." : "Ubah ke Manual"}
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

import { Droplets, Fan } from "lucide-react";
import type { ActuatorAvailability, ActuatorKey, RealtimeStatus } from "../types";
import { formatCountdown } from "../utils/date";
import { actuatorAvailabilityVisual } from "../utils/status";
import { Card } from "./Card";
import { StatusPill } from "./StatusPill";

export function HumidifierCard({
  mistActuator,
  fanActuator,
  now,
  availability,
  onManualRequest,
  onToggle,
  onExtend,
  onAuto,
}: {
  mistActuator: RealtimeStatus["actuators"][ActuatorKey];
  fanActuator: RealtimeStatus["actuators"][ActuatorKey];
  now: number;
  availability: ActuatorAvailability;
  onManualRequest: () => void;
  onToggle: () => void;
  onExtend: () => void;
  onAuto: () => void;
}) {
  const bothOn = mistActuator.state && fanActuator.state;
  const someOn = mistActuator.state || fanActuator.state;
  const isManual = mistActuator.mode === "MANUAL" || fanActuator.mode === "MANUAL";

  const stateLabel = bothOn ? "Aktif" : someOn ? "Sebagian Aktif" : "Mati";
  const stateClass = bothOn ? "tone-safe" : someOn ? "tone-warning" : "tone-unknown";

  const availabilityVisual = actuatorAvailabilityVisual[availability];
  const disabled = availabilityVisual.disabled;

  const manualUntil = mistActuator.manual_until ?? fanActuator.manual_until;

  return (
    <Card className="actuator-card humidifier-card">
      <div className="card-topline">
        <div className="icon-heading">
          <span className="tool-icon humidifier-icon">
            <Droplets size={18} strokeWidth={2.2} aria-hidden="true" />
            <Fan size={16} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <div>
            <span className="card-kicker">Alat</span>
            <h3>Pengatur Kelembapan</h3>
          </div>
        </div>
        <StatusPill label={stateLabel} className={stateClass} />
      </div>
      <p className="mode-line">Mode: {isManual ? "Manual Sementara" : "Otomatis"}</p>
      <div className="sensor-guidance">
        <span>Peran alat</span>
        <p className="meaning">
          Menyemprotkan kabut halus dan meniupkannya ke seluruh greenhouse untuk menaikkan kelembapan udara secara merata.
        </p>
      </div>
      <p className="action-text">
        {isManual
          ? "Kontrol otomatis berhenti sementara. Pengatur kelembapan mengikuti perintah manual Anda."
          : bothOn
            ? "Pengatur kelembapan sedang membantu meratakan kelembapan udara."
            : "Siap menyala saat kelembapan udara terlalu rendah."}
      </p>
      {isManual && manualUntil && (
        <p className="countdown">Sisa waktu manual: {formatCountdown(manualUntil, now)}</p>
      )}
      {disabled && <p className="disabled-note">{availabilityVisual.message}</p>}
      <div className="button-row">
        {!isManual ? (
          <button className="btn outline" type="button" onClick={onManualRequest} disabled={disabled}>
            {availability === "sending" ? "Mengirim..." : "Ubah ke Manual"}
          </button>
        ) : (
          <>
            <button className="btn primary" type="button" onClick={onToggle} disabled={disabled}>
              {bothOn ? "Matikan" : "Nyalakan"}
            </button>
            <button className="btn outline" type="button" onClick={onExtend} disabled={disabled}>
              Perpanjang 30 Menit
            </button>
            <button className="btn plain" type="button" onClick={onAuto} disabled={disabled}>
              Kembalikan ke Otomatis
            </button>
          </>
        )}
      </div>
    </Card>
  );
}

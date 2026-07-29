import { Droplets, Fan } from "lucide-react";
import type { ActuatorAvailability, RealtimeStatus } from "../types";
import { Card } from "./Card";
import { StatusPill } from "./StatusPill";

export function HumidifierCard({
  actuators,
  availability,
  onManualRequest,
}: {
  actuators: RealtimeStatus["actuators"];
  availability: ActuatorAvailability;
  onManualRequest: () => void;
}) {
  const active = actuators.mist.state || actuators.fan.state;
  return (
    <Card className="actuator-card humidifier-card">
      <div className="card-topline">
        <div className="icon-heading">
          <span className="tool-icon humidifier-icon"><Droplets size={18} aria-hidden="true" /><Fan size={16} aria-hidden="true" /></span>
          <div><span className="card-kicker">Alat</span><h3>Pelembap Udara</h3></div>
        </div>
        <StatusPill label={active ? "Menyala" : "Mati"} className={active ? "tone-safe" : "tone-unknown"} />
      </div>
      <p className="mode-line">Mode: {actuators.mist.mode === "MANUAL" || actuators.fan.mode === "MANUAL" ? "Manual Sementara" : "Otomatis"}</p>
      <p className="action-text">Membantu menjaga udara agar tidak terlalu kering.</p>
      <button className="btn outline" type="button" disabled={availability !== "ready"} onClick={onManualRequest}>Buka Kontrol Manual</button>
    </Card>
  );
}

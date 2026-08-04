import { ChevronLeft, ChevronRight, Droplets, Leaf, Sun, Thermometer } from "lucide-react";
import { useState } from "react";
import type { ActuatorAvailability, ActuatorKey, CommandActuator, ConnectionState, RealtimeStatus, TelemetryPoint, ThresholdConfig } from "../types";
import { ACTUATOR_COPY } from "../data/mockSnowberry";
import { formatTimeAgo } from "../utils/date";
import { connectionVisual, getDashboardSummary, getGrowthPhaseInfo, getSensorMetrics, sensorVisual } from "../utils/status";
import { sensorScale } from "../utils/gaugeScale";
import { ActuatorCard } from "../components/ActuatorCard";
import { HumidifierCard } from "../components/HumidifierCard";
import { CardSkeleton, SummarySkeleton } from "../components/LoadingSkeleton";
import { GreenhouseHero } from "../components/GreenhouseHero";
import { NoticeBanner } from "../components/NoticeBanner";
import { SensorGauge } from "../components/SensorGauge";
import { StatusPill } from "../components/StatusPill";

export type DashboardTab = "today" | "plants" | "tools";

const SENSOR_ICONS = {
  temperature: Thermometer,
  humidity: Droplets,
  light: Sun,
  soil: Leaf,
};

function naturalDliEstimate(history: TelemetryPoint[]) {
  return history.slice(1).reduce((total, point, index) => {
    const previous = history[index];
    const hours = Math.max(0, point.ts - previous.ts) / 3_600_000;
    return total + (previous.l / 50) * 3600 * hours / 1_000_000;
  }, 0);
}

export function DashboardPage({
  status,
  thresholds,
  history,
  now,
  connection,
  isLoading,
  sendingActuator,
  onManualRequest,
  onToggle,
  onExtend,
  onAuto,
  onRewaterRequest,
  onOpenChecks,
  onOpenSensor,
  onHumidifierToggle,
  onHumidifierAuto,
  initialTab = "today",
  focusSensor,
}: {
  status: RealtimeStatus;
  thresholds: ThresholdConfig;
  history: TelemetryPoint[];
  now: number;
  connection: ConnectionState;
  isLoading: boolean;
  sendingActuator: ActuatorKey | null;
  onManualRequest: (key: CommandActuator) => void;
  onToggle: (key: ActuatorKey) => void;
  onExtend: (key: ActuatorKey) => void;
  onAuto: (key: ActuatorKey) => void;
  onRewaterRequest: () => void;
  onOpenChecks: (checks: import("../types").DailyCheckItem[]) => void;
  onOpenSensor: (id: "temperature" | "humidity" | "light" | "soil") => void;
  onHumidifierToggle: () => void;
  onHumidifierAuto: () => void;
  initialTab?: DashboardTab;
  focusSensor?: "temperature" | "humidity" | "light" | "soil" | null;
}) {
  const subTab = initialTab;
  // Ketuk gauge di Beranda membuka penjelasan sensor itu, bukan selalu sensor pertama.
  const SENSOR_ORDER = ["temperature", "humidity", "light", "soil"] as const;
  const focusIndex = focusSensor ? SENSOR_ORDER.indexOf(focusSensor) : -1;
  const [plantIndex, setPlantIndex] = useState(focusIndex >= 0 ? focusIndex : 0);
  const [plantDirection, setPlantDirection] = useState<"next" | "previous">("next");

  if (isLoading) {
    return (
      <div className="page-stack dashboard-page">
        <SummarySkeleton />
        <section className="card-grid sensor-grid">
          <CardSkeleton />
          <CardSkeleton />
        </section>
      </div>
    );
  }

  const phase = getGrowthPhaseInfo(thresholds.planting_date, now);
  const metrics = getSensorMetrics(status, thresholds, phase);
  const summary = getDashboardSummary(metrics, status, connection, now, phase);
  const importantMetrics = [...metrics].sort((a, b) => {
    if (a.issue && !b.issue) return -1;
    if (!a.issue && b.issue) return 1;
    return b.severity - a.severity;
  }).filter((metric) => metric.issue).slice(0, 2);
  const connectionCopy = connectionVisual[connection];
  // Satu kosakata alat: nama di footer sama dengan nama di kartu Alat.
  const activeTools: string[] = [];
  if (status.actuators?.growlight?.state) activeTools.push(ACTUATOR_COPY.growlight.label);
  if (status.actuators?.pump?.state) activeTools.push(ACTUATOR_COPY.pump.label);
  if (status.actuators?.humidifier?.state) {
    activeTools.push(ACTUATOR_COPY.humidifier.label);
  }
  const actionableChecks = summary.checks.filter((check) => check.tone !== "safe");
  const dliTarget = phase.key === "vegetative" ? 15 : phase.key === "flowering" ? 20 : 25;
  const estimatedDli = naturalDliEstimate(history);

  return (
    <div className="page-stack dashboard-page">
      {status.fault.active_message && (
        <NoticeBanner tone="danger" title="Masalah Aktif">
          <p>{status.fault.active_message}</p>
        </NoticeBanner>
      )}

      {connection !== "online" && (
        <NoticeBanner tone={connection === "offline" ? "danger" : "warning"} title={connectionCopy.label}>
          <p>{connectionCopy.message}</p>
        </NoticeBanner>
      )}

      {/* === BERANDA === */}
      {subTab === "today" && (
        <>
          <GreenhouseHero
            tone={summary.tone}
            title={summary.title}
             detail={summary.detail}
             action={summary.action}
             phase={phase.shortTitle}
             checkCount={actionableChecks.length}
             onOpenChecks={() => onOpenChecks(actionableChecks)}
             updatedText={`Diperbarui ${formatTimeAgo(status.last_seen, now)}`}
           />

           {status.fault.active_code === "PUMP_NO_EFFECT" && connection === "online" && (
             <button className="btn primary" type="button" onClick={onRewaterRequest} disabled={sendingActuator === "pump"}>
               {sendingActuator === "pump" ? "Mengirim..." : "Siram Kembali"}
             </button>
           )}

           <section className="sensor-gauge-grid" aria-label="Kondisi utama">
            {metrics.map((metric) => {
              const Icon = SENSOR_ICONS[metric.id];
              const scale = sensorScale(metric.id, status, thresholds);
              return (
                <SensorGauge
                  key={metric.id}
                  value={metric.value}
                  label={metric.shortLabel}
                  status={connection === "offline" ? "unknown" : metric.status}
                  band={scale.bandLabel}
                  markerPercent={scale.markerPercent}
                  bandStartPercent={scale.bandStartPercent}
                  bandWidthPercent={scale.bandWidthPercent}
                  icon={<Icon size={18} strokeWidth={2.2} aria-hidden="true" />}
                  onClick={() => onOpenSensor(metric.id)}
                />
              );
            })}
          </section>

          <section className="today-footer">
            <div className="today-meta">
              <span>
                {activeTools.length > 0
                  ? `Alat aktif: ${activeTools.join(", ")}`
                  : "Semua alat standby"}
              </span>
            </div>

          </section>
        </>
      )}

      {/* === TANAMAN === */}
      {subTab === "plants" && (
        <>
          <header className="page-heading"><p className="eyebrow">Kondisi Tanaman</p><h1>Tanaman</h1><p>Lihat arti setiap kondisi satu per satu.</p></header>
          {(() => {
            const metric = metrics[plantIndex];
            const change = (direction: "next" | "previous") => {
              setPlantDirection(direction);
              setPlantIndex((index) => index + (direction === "next" ? 1 : -1));
            };
            return <section key={metric.id} className={`plant-walkthrough plant-slide-${plantDirection} tone-${metric.status}`} aria-label="Kondisi tanaman terperinci">
              <span className="plant-progress">{plantIndex + 1} dari {metrics.length}</span>
              <h2>{metric.label}</h2><strong className="plant-value">{metric.value}</strong>
              <StatusPill label={`${sensorVisual[metric.status].label} · ${metric.issue ?? "Nyaman"}`} className={`tone-${metric.status}`} />
              <p>{metric.meaning}</p><strong>{metric.action}</strong>
              {metric.id === "light" && <div className="light-guidance"><strong>Estimasi DLI Alami: {estimatedDli.toFixed(1)} / {dliTarget} DLI</strong><span>Patokan cahaya saat ini: {thresholds.lux_low.toLocaleString("id-ID")}–{thresholds.lux_high.toLocaleString("id-ID")} lux</span><small>Estimasi dari cahaya alami. Durasi lampu tanam dicatat terpisah.</small></div>}
              <div className="walkthrough-actions">
                <button className="btn outline" type="button" disabled={plantIndex === 0} onClick={() => change("previous")}><ChevronLeft size={18} aria-hidden="true" /> Sebelumnya</button>
                <button className="btn primary" type="button" disabled={plantIndex === metrics.length - 1} onClick={() => change("next")}>Berikutnya <ChevronRight size={18} aria-hidden="true" /></button>
              </div>
            </section>;
          })()}
        </>
      )}

      {/* === TAB: ALAT === */}
      {subTab === "tools" && (
        <section className="tools-section">
          <div className="section-heading">
            <h2>Alat yang Membantu</h2>
            <p>Kontrol manual berlaku 30 menit, lalu kembali otomatis.</p>
          </div>

          {(["growlight", "pump"] as ActuatorKey[]).map((key) => {
            const actuator = status.actuators?.[key];
            if (!actuator) return null;
            const availability: ActuatorAvailability =
              connection === "offline" ? "offline_disabled" : sendingActuator === key ? "sending" : "ready";
            return (
              <ActuatorCard
                key={key}
                actuatorKey={key}
                actuator={actuator}
                now={now}
                availability={availability}
                onManualRequest={onManualRequest}
                onToggle={onToggle}
                onExtend={onExtend}
                onAuto={onAuto}
              />
            );
          })}
          {status.actuators && (
            <HumidifierCard
              actuators={status.actuators}
              now={now}
              availability={connection === "offline" || sendingActuator === "humidifier" ? "offline_disabled" : "ready"}
              onManualRequest={() => onManualRequest("humidifier")}
              onToggle={onHumidifierToggle}
              onAuto={onHumidifierAuto}
              rhLow={thresholds.rh_low}
              rhHigh={thresholds.rh_high}
            />
          )}
        </section>
      )}

    </div>
  );
}

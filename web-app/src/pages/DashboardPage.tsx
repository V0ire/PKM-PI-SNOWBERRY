import { ChevronLeft, ChevronRight, Droplets, Leaf, Power, Sprout, Sun, Thermometer } from "lucide-react";
import { useState } from "react";
import type { ActuatorAvailability, ActuatorKey, ConnectionState, RealtimeStatus, TelemetryPoint, ThresholdConfig } from "../types";
import { formatTimeAgo } from "../utils/date";
import { connectionVisual, getDashboardSummary, getGrowthPhaseInfo, getSensorMetrics, sensorVisual } from "../utils/status";
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

function sensorPercent(id: string, status: RealtimeStatus, thresholds: ThresholdConfig): number {
  switch (id) {
    case "temperature": {
      const v = status.sensors.temperature_c;
      if (v === null) return 0;
      return Math.min(100, Math.max(0, ((v - 10) / 30) * 100));
    }
    case "humidity": {
      const v = status.sensors.humidity_pct;
      return v === null ? 0 : v;
    }
    case "light": {
      const v = status.sensors.lux;
      if (v === null) return 0;
      return Math.min(100, (v / (thresholds.lux_high * 1.2)) * 100);
    }
    case "soil": {
      const v = status.sensors.soil_pct;
      return v === null ? 0 : v;
    }
    default:
      return 0;
  }
}

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
  initialTab = "today",
}: {
  status: RealtimeStatus;
  thresholds: ThresholdConfig;
  history: TelemetryPoint[];
  now: number;
  connection: ConnectionState;
  isLoading: boolean;
  sendingActuator: ActuatorKey | null;
  onManualRequest: (key: ActuatorKey) => void;
  onToggle: (key: ActuatorKey) => void;
  onExtend: (key: ActuatorKey) => void;
  onAuto: (key: ActuatorKey) => void;
  onRewaterRequest: () => void;
  onOpenChecks: (checks: import("../types").DailyCheckItem[]) => void;
  initialTab?: DashboardTab;
}) {
  const subTab = initialTab;
  const [plantIndex, setPlantIndex] = useState(0);
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
  const activeTools = [
    status.actuators?.growlight?.state && "Lampu",
    status.actuators?.pump?.state && "Pompa",
    ((status.actuators?.mist?.state || status.actuators?.fan?.state)) && "Pengatur Kelembapan",
  ].filter(Boolean);
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
             phase={`Fase ${phase.name}`}
             issueCount={Math.max(0, actionableChecks.length - 1)}
             onOpenChecks={() => onOpenChecks(actionableChecks.slice(1))}
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
              return (
                <SensorGauge
                  key={metric.id}
                  value={metric.value}
                  label={metric.shortLabel}
                  status={connection === "offline" ? "unknown" : metric.status}
                  percent={sensorPercent(metric.id, status, thresholds)}
                  icon={<Icon size={18} strokeWidth={2.2} aria-hidden="true" />}
                  onClick={undefined}
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
              <span>Diperbarui {formatTimeAgo(status.last_seen, now)}</span>
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

          <article className="card target-card">
            <h2>Patokan Fase {phase.name}</h2>
            <dl>
              {Object.entries(phase.targets).map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
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
              availability={connection === "offline" || sendingActuator === "mist" || sendingActuator === "fan" ? "offline_disabled" : "ready"}
              onManualRequest={() => onManualRequest("mist")}
            />
          )}
        </section>
      )}

    </div>
  );
}

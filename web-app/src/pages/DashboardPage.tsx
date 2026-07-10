import { useEffect, useState } from "react";
import { CircleCheck, Clock, Droplets, Leaf, Power, Sprout, Sun, Thermometer } from "lucide-react";
import type { ActuatorAvailability, ActuatorKey, ConnectionState, RealtimeStatus, TelemetryPoint, ThresholdConfig } from "../types";
import { formatTimeAgo } from "../utils/date";
import { connectionVisual, getDashboardSummary, getGrowthPhaseInfo, getSensorMetrics, sensorVisual } from "../utils/status";
import { ActuatorCard } from "../components/ActuatorCard";
import { CardSkeleton, SummarySkeleton } from "../components/LoadingSkeleton";
import { GreenhouseHero } from "../components/GreenhouseHero";
import { NoticeBanner } from "../components/NoticeBanner";
import { SensorGauge } from "../components/SensorGauge";
import { StatusPill } from "../components/StatusPill";

type SubTab = "today" | "plants" | "tools" | "check";
export type DashboardTab = SubTab;

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
  initialTab?: DashboardTab;
}) {
  const [subTab, setSubTab] = useState<SubTab>(initialTab);

  useEffect(() => setSubTab(initialTab), [initialTab]);

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
    status.actuators.growlight.state && "Lampu",
    status.actuators.pump.state && "Pompa",
    (status.actuators.mist.state || status.actuators.fan.state) && "Pengatur Kelembapan",
  ].filter(Boolean);
  const maxChecks = Math.min(summary.checks.length, 3);

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

      <nav className="segmented sub-nav" aria-label="Navigasi Kondisi">
        <button type="button" className={subTab === "today" ? "active" : ""} onClick={() => setSubTab("today")}>
          <Clock size={16} aria-hidden="true" />
          Hari Ini
        </button>
        <button type="button" className={subTab === "plants" ? "active" : ""} onClick={() => setSubTab("plants")}>
          <Sprout size={16} aria-hidden="true" />
          Tanaman
        </button>
        <button type="button" className={subTab === "tools" ? "active" : ""} onClick={() => setSubTab("tools")}>
          <Power size={16} aria-hidden="true" />
          Alat
        </button>
        <button type="button" className={subTab === "check" ? "active" : ""} onClick={() => setSubTab("check")}>
          <CircleCheck size={16} aria-hidden="true" />
          Cek {maxChecks > 0 && summary.checks[0]?.tone !== "safe" ? `(${maxChecks})` : ""}
        </button>
      </nav>

      {/* === TAB: HARI INI === */}
      {subTab === "today" && (
        <>
          <GreenhouseHero
            tone={summary.tone}
            title={summary.title}
             detail={summary.detail}
             action={summary.action}
             now={now}
             updatedText={`Diperbarui ${formatTimeAgo(status.last_seen, now)}`}
           />

           {status.fault.active_code === "PUMP_NO_EFFECT" && connection === "online" && (
             <button className="btn primary" type="button" onClick={onRewaterRequest} disabled={sendingActuator === "pump"}>
               {sendingActuator === "pump" ? "Mengirim..." : "Siram Kembali"}
             </button>
           )}
 
           {importantMetrics.length > 0 && (
             <section className="issue-list" aria-label="Kondisi yang perlu diperhatikan">
               {importantMetrics.map((metric) => (
                 <NoticeBanner key={metric.id} tone={metric.status === "danger" ? "danger" : "warning"} title={metric.label}>
                   <p>{metric.meaning}</p>
                   <p><strong>{metric.action}</strong></p>
                 </NoticeBanner>
               ))}
             </section>
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
                  onClick={() => setSubTab("plants")}
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
            {maxChecks > 0 && summary.checks[0]?.tone !== "safe" && (
              <button className="btn outline" type="button" onClick={() => setSubTab("check")}>
                {maxChecks} hal perlu dicek
              </button>
            )}
          </section>
        </>
      )}

      {/* === TAB: TANAMAN === */}
      {subTab === "plants" && (
        <>
          <section className="phase-banner">
            <span className="crop-badge">Fase {phase.name} - HST {phase.hst}</span>
            <p>{phase.focus}</p>
          </section>

          <section className="plant-companion-grid">
            <article className="card target-card">
              <h2>Target Normal Fase Ini</h2>
              <p>Angka ini menjadi patokan cepat saat melihat kondisi greenhouse.</p>
              <dl>
                {Object.entries(phase.targets).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </article>

            <article className="card plant-focus-card">
              <h2>Yang Perlu Diperhatikan</h2>
              <p>{phase.risk}</p>
              {importantMetrics.length > 0 ? (
                <div className="plant-focus-list">
                  {importantMetrics.map((metric) => (
                    <div key={metric.id}>
                      <strong>{metric.shortLabel}</strong>
                      <p>{connection === "offline" ? "Data terakhir yang diterima." : metric.meaning}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="summary-action">Kondisi utama masih sesuai untuk fase {phase.name.toLowerCase()}.</p>
              )}
            </article>
          </section>
        </>
      )}

      {/* === TAB: ALAT === */}
      {subTab === "tools" && (
        <section className="tools-section">
          <div className="section-heading">
            <h2>Alat yang Membantu</h2>
            <p>Kontrol manual berlaku 30 menit, lalu kembali otomatis.</p>
          </div>

          {(["growlight", "pump", "mist", "fan"] as ActuatorKey[]).map((key) => {
            const availability: ActuatorAvailability =
              connection === "offline" ? "offline_disabled" : sendingActuator === key ? "sending" : "ready";
            return (
              <ActuatorCard
                key={key}
                actuatorKey={key}
                actuator={status.actuators[key]}
                now={now}
                availability={availability}
                onManualRequest={onManualRequest}
                onToggle={onToggle}
                onExtend={onExtend}
                onAuto={onAuto}
              />
            );
          })}
        </section>
      )}

      {/* === TAB: CEK === */}
      {subTab === "check" && (
        <section className="daily-check-card">
          {summary.checks[0]?.tone === "safe" && summary.checks.length <= 2 ? (
            <div className="check-empty">
              <span className="check-empty-icon">
                <Leaf size={42} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h2>Semua aman hari ini!</h2>
              <p>Tidak ada yang perlu dicek mendesak. Santai saja, greenhouse Anda baik-baik saja.</p>
            </div>
          ) : (
            <>
              <div className="section-heading">
                <h2>Yang Perlu Dicek</h2>
                <p>Prioritas tindakan untuk stroberi putih hari ini.</p>
              </div>
              <div className="daily-check-list">
                {summary.checks.slice(0, 3).map((check) => (
                  <article className={`check-item ${sensorVisual[check.tone].className}`} key={check.id}>
                    <div>
                      <strong>{check.title}</strong>
                      <p>{check.body}</p>
                      <p className="action-text">{check.action}</p>
                    </div>
                    <StatusPill label={sensorVisual[check.tone].label} className={sensorVisual[check.tone].className} />
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

import type { ActuatorAvailability, ActuatorKey, ConnectionState, RealtimeStatus, TelemetryPoint, ThresholdConfig } from "../types";
import { ACTUATOR_ORDER } from "../data/mockSnowberry";
import { formatTimeAgo } from "../utils/date";
import { connectionVisual, getDashboardSummary, getSensorMetrics, sensorVisual } from "../utils/status";
import { ActuatorCard } from "../components/ActuatorCard";
import { CardSkeleton, SummarySkeleton } from "../components/LoadingSkeleton";
import { NoticeBanner } from "../components/NoticeBanner";
import { SensorCard } from "../components/SensorCard";
import { StatusPill } from "../components/StatusPill";

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
}) {
  if (isLoading) {
    return (
      <div className="page-stack dashboard-page">
        <SummarySkeleton />
        <section className="card-grid sensor-grid">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </section>
        <section className="card-grid actuator-grid">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </section>
      </div>
    );
  }

  const metrics = getSensorMetrics(status, thresholds);
  const summary = getDashboardSummary(metrics, status, connection, now);
  const connectionCopy = connectionVisual[connection];
  const autoCount = ACTUATOR_ORDER.filter((key) => status.actuators[key].mode === "AUTO").length;
  const topPattern = history.length > 0 ? "Suhu paling tinggi sekitar pukul 13.00." : "Belum ada data riwayat hari ini.";

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

      <section className={`summary-card ${sensorVisual[summary.tone].className}`}>
        <div>
          <p className="eyebrow">Kondisi Sekarang</p>
          <h1>{summary.title}</h1>
          <p>{summary.detail}</p>
          <p className="summary-action">{summary.action}</p>
        </div>
        <div className="summary-meta-grid">
          <div>
            <span>Status Perangkat</span>
            <strong>{connectionCopy.label}</strong>
          </div>
          <div>
            <span>Diperbarui</span>
            <strong>{formatTimeAgo(status.last_seen, now)}</strong>
          </div>
          <div>
            <span>Alat Otomatis</span>
            <strong>{autoCount} dari 4</strong>
          </div>
        </div>
      </section>

      <section className="insight-grid">
        <article className="insight-card">
          <span>Pola Hari Ini</span>
          <strong>{topPattern}</strong>
        </article>
        <article className="insight-card">
          <span>Kontrol Alat</span>
          <strong>{autoCount === 4 ? "Semua alat mengikuti sensor." : "Ada alat dalam manual sementara."}</strong>
        </article>
      </section>

      <section>
        <div className="section-heading">
          <h2>Sensor Greenhouse</h2>
          <p>Angka utama beserta makna dan tindakan yang perlu dilakukan.</p>
        </div>
        <div className="card-grid sensor-grid">
          {metrics.map((metric) => (
            <SensorCard key={metric.id} metric={metric} connection={connection} />
          ))}
        </div>
      </section>

      <section>
        <div className="section-heading">
          <h2>Alat Otomatis</h2>
          <p>Mode manual selalu sementara dan kembali otomatis setelah 30 menit.</p>
        </div>
        <div className="card-grid actuator-grid">
          {ACTUATOR_ORDER.map((key) => {
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
        </div>
      </section>

      <section className="fault-panel">
        <div>
          <h2>Masalah Terbaru</h2>
          <p>
            {status.fault.active_message
              ? status.fault.active_message
              : "Tidak ada masalah aktif. Perangkat dan sensor terlihat normal."}
          </p>
        </div>
        <StatusPill label={status.fault.active_message ? "Perlu Dicek" : "Aman"} className={status.fault.active_message ? "tone-danger" : "tone-safe"} />
      </section>
    </div>
  );
}

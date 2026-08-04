import type { GreenhouseProfile, RealtimeStatus, TelemetryPoint, ThresholdConfig } from "../types";
import { DEFAULT_THRESHOLDS, HISTORY_POINTS, INITIAL_STATUS } from "../data/mockSnowberry";
import type { ManualCommand, SnowberryDataSource } from "./dataSource";

// Mock: dipakai saat Firebase belum dikonfigurasi. Meniru perilaku realtime.
export function createMockDataSource(): SnowberryDataSource {
  let status: RealtimeStatus = structuredClone(INITIAL_STATUS);
  let thresholds: ThresholdConfig = structuredClone(DEFAULT_THRESHOLDS);
  let profile: GreenhouseProfile | null = { greenhouse_name: "Greenhouse Ciwidey", plant_phase: "vegetatif" };
  const statusSubs = new Set<(s: RealtimeStatus) => void>();
  const thresholdSubs = new Set<(t: ThresholdConfig) => void>();
  const profileSubs = new Set<(p: GreenhouseProfile | null) => void>();

  const emitStatus = () => statusSubs.forEach((cb) => cb(status));

  return {
    kind: "mock",
    subscribeStatus(cb) {
      statusSubs.add(cb);
      cb(status);
      return () => statusSubs.delete(cb);
    },
    subscribeThresholds(cb) {
      thresholdSubs.add(cb);
      cb(thresholds);
      return () => thresholdSubs.delete(cb);
    },
    async loadTelemetry(days = 1): Promise<TelemetryPoint[]> {
      if (days <= 1) return HISTORY_POINTS;
      // Mock multi-hari: salin pola hari ini mundur ke belakang dengan variasi kecil.
      const dayMs = 86_400_000;
      const points: TelemetryPoint[] = [];
      for (let i = days - 1; i >= 1; i--) {
        const wobble = ((i * 7) % 5) - 2;
        points.push(
          ...HISTORY_POINTS.map((p) => ({
            ...p,
            ts: p.ts - i * dayMs,
            t: +(p.t + wobble * 0.4).toFixed(1),
            h: Math.min(95, Math.max(35, p.h + wobble)),
            s: Math.min(90, Math.max(20, p.s - wobble)),
          })),
        );
      }
      points.push(...HISTORY_POINTS);
      return points;
    },
    subscribeProfile(cb) {
      profileSubs.add(cb);
      cb(profile);
      return () => profileSubs.delete(cb);
    },
    async saveProfile(next) {
      profile = next;
      profileSubs.forEach((cb) => cb(profile));
    },
    async saveThresholds(next) {
      thresholds = next;
      thresholdSubs.forEach((cb) => cb(thresholds));
    },
    async sendCommand(cmd: ManualCommand) {
      // Simulasi: terapkan langsung ke status mock + ack, mengikuti kontrak A3/A4.
      const current = status.actuators[cmd.actuator];
      const applied =
        cmd.mode === "MANUAL"
          ? { mode: "MANUAL" as const, state: cmd.state, manual_until: cmd.manual_until, reason: "manual_override" }
          : { ...current, mode: "AUTO" as const, manual_until: null };
      status = {
        ...status,
        actuators: { ...status.actuators, [cmd.actuator]: applied },
        command_ack: {
          ack_command_id: cmd.command_id,
          ack_status: "APPLIED",
          ack_at: Date.now(),
          ack_message: cmd.mode === "MANUAL" ? "Perintah manual diterapkan." : "Alat kembali otomatis.",
        },
      };
      emitStatus();
    },
  };
}

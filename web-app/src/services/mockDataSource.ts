import type { RealtimeStatus, TelemetryPoint, ThresholdConfig } from "../types";
import { DEFAULT_THRESHOLDS, HISTORY_POINTS, INITIAL_STATUS } from "../data/mockSnowberry";
import type { ManualCommand, SnowberryDataSource } from "./dataSource";

// Mock: dipakai saat Firebase belum dikonfigurasi. Meniru perilaku realtime.
export function createMockDataSource(): SnowberryDataSource {
  let status: RealtimeStatus = structuredClone(INITIAL_STATUS);
  let thresholds: ThresholdConfig = structuredClone(DEFAULT_THRESHOLDS);
  const statusSubs = new Set<(s: RealtimeStatus) => void>();
  const thresholdSubs = new Set<(t: ThresholdConfig) => void>();

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
    async loadTelemetry(): Promise<TelemetryPoint[]> {
      return HISTORY_POINTS;
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

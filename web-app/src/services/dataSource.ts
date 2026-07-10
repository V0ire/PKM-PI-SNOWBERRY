import type { ActuatorKey, GreenhouseProfile, RealtimeStatus, TelemetryPoint, ThresholdConfig } from "../types";

// Payload command manual sesuai api-contract (config/commands).
export type ManualCommand = {
  command_id: string;
  actuator: ActuatorKey;
  mode: "AUTO" | "MANUAL";
  state: boolean;
  manual_duration_ms: number;
  manual_until: number;
  issued_at: number;
  issued_by: string;
};

// Abstraksi sumber data. Implementasi: mock (default) atau Firestore.
export interface SnowberryDataSource {
  readonly kind: "mock" | "firebase";
  // Realtime status: callback dipanggil setiap ada update.
  subscribeStatus(cb: (status: RealtimeStatus) => void): () => void;
  // Thresholds: nilai awal + update.
  subscribeThresholds(cb: (thresholds: ThresholdConfig) => void): () => void;
  // Riwayat telemetry untuk grafik (hari ini).
  loadTelemetry(): Promise<TelemetryPoint[]>;
  subscribeProfile(cb: (profile: GreenhouseProfile | null) => void): () => void;
  saveProfile(profile: GreenhouseProfile): Promise<void>;
  // Tulis pengaturan batas otomatis (sudah divalidasi di UI).
  saveThresholds(thresholds: ThresholdConfig): Promise<void>;
  // Kirim Kontrol Manual Sementara.
  sendCommand(cmd: ManualCommand): Promise<void>;
}

export function newCommandId(): string {
  return `cmd_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;
}

import type { ActuatorKey, GreenhouseProfile, RealtimeStatus, TelemetryPoint, ThresholdConfig } from "../types";

// Payload command manual sesuai api-contract (config/commands).
export type ManualCommand = {
  command_id: string;
  actuator: ActuatorKey;
  mode: "AUTO" | "MANUAL";
  state: boolean;
  manual_until: number;
  issued_at: number;
  issued_by: string;
};

// Abstraksi sumber data. Implementasi: mock (default) atau Firestore.
export interface SnowberryDataSource {
  readonly kind: "mock" | "firebase";
  // Realtime status: callback dipanggil setiap ada update.
  subscribeStatus(cb: (status: RealtimeStatus) => void, onError: (message: string) => void): () => void;
  // Thresholds: nilai awal + update.
  subscribeThresholds(cb: (thresholds: ThresholdConfig) => void, onError: (message: string) => void): () => void;
  // Riwayat telemetry untuk grafik. days=1 berarti hari ini saja.
  loadTelemetry(days?: number): Promise<TelemetryPoint[]>;
  subscribeProfile(cb: (profile: GreenhouseProfile | null) => void): () => void;
  saveProfile(profile: GreenhouseProfile): Promise<void>;
  // Tulis pengaturan batas otomatis (sudah divalidasi di UI).
  saveThresholds(thresholds: ThresholdConfig): Promise<void>;
  // Kirim Kontrol Manual Sementara.
  sendCommand(cmd: ManualCommand): Promise<void>;
}

export function newCommandId(): string {
  return crypto.randomUUID();
}

export function createManualCommand(
  actuator: ActuatorKey,
  mode: "AUTO" | "MANUAL",
  state: boolean,
  issuedBy: string,
  now = Date.now(),
): ManualCommand {
  return {
    command_id: newCommandId(), actuator, mode, state,
    // Untuk pompa ini hanya batas validitas command. Firmware tetap menjalankan satu pulse.
    manual_until: mode === "MANUAL" ? now + 30 * 60_000 : now,
    issued_at: now, issued_by: issuedBy,
  };
}

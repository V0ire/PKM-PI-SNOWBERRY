import type { ActuatorKey, GreenhouseProfile, RealtimeStatus, TelemetryPoint, ThresholdConfig } from "../types";

// Payload command manual sesuai api-contract (config/commands).
export type ManualCommand = {
  command_id: string;
  actuator: ActuatorKey;
  mode: "AUTO" | "MANUAL";
  state: boolean;
  command_type?: "REWATER";
  manual_duration_ms: number;
  manual_until: number | null;
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
  // Riwayat telemetry. days=1 membaca dokumen hari ini; 7/30 membaca
  // dokumen harian WIB lalu menggabungkannya berurutan.
  loadTelemetry(days?: number): Promise<TelemetryPoint[]>;
  subscribeProfile(cb: (profile: GreenhouseProfile | null) => void): () => void;
  saveProfile(profile: GreenhouseProfile): Promise<void>;
  // Tulis pengaturan batas otomatis (sudah divalidasi di UI).
  saveThresholds(thresholds: ThresholdConfig): Promise<void>;
  // Kirim Kontrol Manual Sementara.
  sendCommand(cmd: ManualCommand): Promise<void>;
  // Muat telemetry satu tanggal WIB tertentu (format "YYYY-MM-DD").
  loadTelemetryDay?(dateId: string): Promise<TelemetryPoint[]>;
  // Auth lokal (hanya Firebase). Mock tidak punya login.
  signIn?(email: string, password: string): Promise<void>;
  signOut?(): Promise<void>;
  observeAuth?(cb: (email: string | null) => void): () => void;
}

export function newCommandId(): string {
  return `cmd_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;
}

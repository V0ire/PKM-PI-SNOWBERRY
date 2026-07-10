export type Page = "dashboard" | "thresholds" | "history" | "growth" | "measurement";

export type ConnectionState = "online" | "stale" | "offline";
export type SensorStatusKey = "safe" | "warning" | "danger" | "unknown";
export type ActuatorAvailability = "ready" | "offline_disabled" | "sending" | "error";
export type FormState = "clean" | "dirty" | "invalid" | "saving" | "saved" | "error";
export type GrowthPhaseKey = "vegetative" | "flowering" | "fruiting";

export type ActuatorKey = "growlight" | "pump" | "mist" | "fan";
export type ActuatorMode = "AUTO" | "MANUAL";
export type PlantPhase = "vegetatif" | "berbunga" | "buah";

export type GreenhouseProfile = {
  greenhouse_name: string;
  plant_phase: PlantPhase;
};

export type ThresholdConfig = {
  temp_low: number;
  temp_high: number;
  rh_low: number;
  rh_high: number;
  soil_low: number;
  soil_high: number;
  lux_low: number;
  lux_high: number;
  pump_pulse_ms: number;
  soak_period_ms: number;
  max_pump_cycles_per_hour?: number;
  max_total_pump_on_ms_per_hour?: number;
  light_window_start?: number;
  light_window_end?: number;
  max_light_hours_per_day?: number;
  planting_date: string;
  updated_at: number;
  updated_by: string;
};

export type RealtimeStatus = {
  sensors: {
    temperature_c: number | null;
    humidity_pct: number | null;
    lux: number | null;
    soil_pct: number | null;
    soil_raw_adc?: number | null;
    psu_voltage: number | null;
  };
  actuators: Record<
    ActuatorKey,
    {
      mode: ActuatorMode;
      state: boolean;
      manual_until: number | null;
      reason?: string;
    }
  >;
  device: {
    online: boolean;
    wifi_rssi: number;
    firmware_version: string;
    ip_address?: string;
    uptime_seconds: number;
    free_heap_bytes?: number;
    nvs_synced: boolean;
    time_synced?: boolean;
  };
  command_ack?: {
    ack_command_id: string;
    ack_status: "" | "APPLIED" | "REJECTED_SAFETY" | "EXPIRED" | "INVALID";
    ack_at: number | null;
    ack_message: string;
  };
  fault: {
    active_code: string | null;
    active_message: string | null;
    last_fault_code?: string | null;
    last_fault_at?: number | null;
  };
  last_seen: number;
};

export type TelemetryPoint = {
  t: number;
  h: number;
  l: number;
  s: number;
  gl: boolean;
  p: boolean;
  m: boolean;
  f: boolean;
  ts: number;
};

export type FarmJournalEntry = {
  id: string;
  type: "planting" | "harvest";
  date: string;
  quantity?: number;
  unit?: "bibit" | "kg";
  note?: string;
};

export type SensorMetric = {
  id: "temperature" | "humidity" | "light" | "soil";
  label: string;
  shortLabel: string;
  value: string;
  unit: string;
  status: SensorStatusKey;
  meaning: string;
  action: string;
  issue: string | null;
  severity: number;
};

export type DashboardSummary = {
  title: string;
  detail: string;
  action: string;
  cropContext: string;
  badge: string;
  tone: SensorStatusKey;
  checks: DailyCheckItem[];
};

export type ActuatorCopy = {
  label: string;
  helpingText: string;
  activeText: string;
  automaticText: string;
  manualModalTitle: string;
  manualModalBody: string;
};

export type CropPhaseInfo = {
  key: GrowthPhaseKey;
  hst: number;
  name: string;
  title: string;
  shortTitle: string;
  description: string;
  focus: string;
  risk: string;
  action: string;
  targets: Record<"Suhu ideal" | "Kelembapan ideal" | "Cahaya ideal" | "Kelembapan media ideal", string>;
};

export type DailyCheckItem = {
  id: string;
  title: string;
  body: string;
  action: string;
  tone: SensorStatusKey;
};

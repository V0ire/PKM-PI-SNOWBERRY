import type { ActuatorCopy, CommandActuator, RealtimeStatus, TelemetryPoint, ThresholdConfig } from "../types";

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  config_id: "demo-config",
  temp_low: 18,
  temp_high: 26,
  rh_low: 60,
  rh_high: 80,
  soil_low: 40,
  soil_high: 70,
  lux_low: 2000,
  lux_high: 5000,
  pump_pulse_ms: 5000,
  soak_period_ms: 60000,
  pump_start_limit: 2,
  pump_window_ms: 18000000,
  temperature_influence: false,
  humidifier_priority: "RH",
  temperature_failure_fallback: "OFF",
  light_schedule_enabled: false,
  light_schedule_start_hour: 6,
  light_schedule_end_hour: 18,
  planting_date: "2026-06-01",
  updated_at: 1751457600000,
  updated_by: "uid_mock_petani",
};

export const INITIAL_STATUS: RealtimeStatus = {
  sensors: {
    temperature_c: 24.8,
    humidity_pct: 82.4,
    lux: 1850,
    soil_pct: 43.6,
    soil_raw_adc: 1875,
    psu_voltage: 12.1,
  },
  actuators: {
    growlight: { mode: "AUTO", state: true, manual_until: null, reason: "lux_low" },
    pump: { mode: "AUTO", state: false, manual_until: null, reason: "soil_ok" },
    humidifier: { mode: "AUTO", state: false, manual_until: null, reason: "humidity_ok" },
  },
  device: {
    online: true,
    wifi_rssi: -52,
    ip_address: "192.168.1.47",
    firmware_version: "1.0.0",
    uptime_seconds: 86423,
    free_heap_bytes: 187392,
    nvs_synced: true,
    time_synced: true,
  },
  command_ack: {
    ack_command_id: "",
    ack_status: "",
    ack_at: null,
    ack_message: "",
  },
  fault: {
    active_code: null,
    active_message: null,
    last_fault_code: "F-06",
    last_fault_at: 1751371200000,
  },
  last_seen: Date.now() - 74_000,
};

export const ACTUATOR_COPY: Record<CommandActuator, ActuatorCopy> = {
  growlight: {
    label: "Lampu Tanam",
    helpingText: "Menambah cahaya saat pagi mendung atau sore gelap.",
    activeText: "Lampu sedang membantu menambah cahaya agar pertumbuhan tidak melemah.",
    automaticText: "Lampu menyala saat cahaya kurang, lalu mati saat cahaya sudah cukup.",
    manualModalTitle: "Ubah Lampu Tanam ke Manual?",
    manualModalBody:
      "Lampu tanam tidak akan mengikuti cahaya sementara. Sistem akan kembali otomatis setelah 30 menit. Pilih Batal jika ingin tetap otomatis.",
  },
  pump: {
    label: "Pompa Air",
    helpingText: "Menjaga media tanam tetap lembap tanpa membuat akar tergenang.",
    activeText: "Pompa sedang menyiram bertahap. Beri waktu agar air meresap ke media.",
    automaticText: "Pompa menyiram bertahap saat media mulai kering agar akar tidak tergenang.",
    manualModalTitle: "Ubah Pompa Air ke Manual?",
    manualModalBody:
      "Pompa tidak akan mengikuti kelembapan media sementara. Sistem akan kembali otomatis setelah 30 menit. Pilih Batal jika ingin tetap otomatis.",
  },

  // Satu alat di mata petani: kabut menaikkan lembap, kipas menurunkan.
  humidifier: {
    label: "Pelembap Udara",
    helpingText: "Menjaga udara tidak terlalu kering dan tidak terlalu lembap.",
    activeText: "Pelembap sedang menyesuaikan kelembapan udara.",
    automaticText: "Bekerja sendiri saat kelembapan keluar batas.",
    manualModalTitle: "Ubah Pelembap Udara ke Manual?",
    manualModalBody:
      "Pelembap tidak mengikuti Batas Otomatis sementara. Kembali otomatis setelah maksimal 30 menit.",
  },
};


export const HISTORY_POINTS: TelemetryPoint[] = [
  { t: 20.8, h: 72, l: 920, s: 58, gl: true, p: false, m: false, f: false, ts: 1751414400000 },
  { t: 21.2, h: 73, l: 1400, s: 56, gl: true, p: false, m: false, f: false, ts: 1751418000000 },
  { t: 22.6, h: 76, l: 2250, s: 53, gl: false, p: false, m: false, f: false, ts: 1751421600000 },
  { t: 24.1, h: 79, l: 3450, s: 49, gl: false, p: false, m: false, f: true, ts: 1751425200000 },
  { t: 26.8, h: 82, l: 5200, s: 42, gl: false, p: true, m: false, f: true, ts: 1751428800000 },
  { t: 28.4, h: 81, l: 6100, s: 46, gl: false, p: false, m: false, f: true, ts: 1751432400000 },
  { t: 27.2, h: 78, l: 4300, s: 51, gl: false, p: false, m: false, f: true, ts: 1751436000000 },
  { t: 25.6, h: 74, l: 2600, s: 54, gl: false, p: false, m: false, f: false, ts: 1751439600000 },
  { t: 23.9, h: 71, l: 1600, s: 53, gl: true, p: false, m: false, f: false, ts: 1751443200000 },
];

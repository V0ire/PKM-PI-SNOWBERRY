import type { ThresholdConfig } from "../types";

// Batas wajar tiap kolom pengaturan. Mencegah angka mustahil tersimpan ke perangkat:
// kolom kosong (NaN) dulu lolos karena hanya perbandingan antar-kolom yang dicek.
export const FIELD_BOUNDS: Partial<Record<keyof ThresholdConfig, { min: number; max: number; unit: string }>> = {
  temp_low: { min: 5, max: 45, unit: "°C" },
  temp_high: { min: 5, max: 45, unit: "°C" },
  rh_low: { min: 20, max: 95, unit: "%" },
  rh_high: { min: 20, max: 95, unit: "%" },
  soil_low: { min: 0, max: 100, unit: "%" },
  soil_high: { min: 0, max: 100, unit: "%" },
  lux_low: { min: 0, max: 100000, unit: " lux" },
  lux_high: { min: 0, max: 100000, unit: " lux" },
  pump_pulse_ms: { min: 1000, max: 120000, unit: " ms" },
  soak_period_ms: { min: 60000, max: 7200000, unit: " ms" },
  pump_start_limit: { min: 1, max: 12, unit: " kali" },
  pump_window_ms: { min: 3600000, max: 86400000, unit: " ms" },
  light_schedule_start_hour: { min: 0, max: 23, unit: "" },
  light_schedule_end_hour: { min: 0, max: 23, unit: "" },
};

export type FieldErrors = Partial<Record<keyof ThresholdConfig, string>>;

// Urutan cek: isi dulu, lalu rentang wajar, baru hubungan antar-kolom.
// Pesan singkat karena tampil di bawah kolom pada layar 360px.
export function validateThresholds(draft: ThresholdConfig): FieldErrors {
  const errors: FieldErrors = {};

  for (const [key, bounds] of Object.entries(FIELD_BOUNDS)) {
    const field = key as keyof ThresholdConfig;
    const value = draft[field];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      errors[field] = "Isi angka";
      continue;
    }
    if (value < bounds.min || value > bounds.max) {
      errors[field] = `Antara ${bounds.min}–${bounds.max}`;
    }
  }

  if (!errors.rh_low && !errors.rh_high && draft.rh_low >= draft.rh_high) {
    errors.rh_low = "Harus lebih kecil dari batas atas";
  }
  if (!errors.temp_low && !errors.temp_high && draft.temp_low >= draft.temp_high) {
    errors.temp_low = "Harus lebih kecil dari batas atas";
  }
  if (!errors.soil_low && !errors.soil_high && draft.soil_low >= draft.soil_high) {
    errors.soil_low = "Harus lebih kecil dari batas atas";
  }
  if (!errors.lux_low && !errors.lux_high && draft.lux_low >= draft.lux_high) {
    errors.lux_low = "Harus lebih kecil dari batas atas";
  }
  // Pompa tidak boleh menyala lebih lama dari jeda resap: akar bisa tergenang.
  if (
    !errors.pump_pulse_ms &&
    !errors.soak_period_ms &&
    draft.pump_pulse_ms >= draft.soak_period_ms
  ) {
    errors.pump_pulse_ms = "Harus lebih pendek daripada Jeda Resap";
  }
  if (draft.light_schedule_enabled && draft.light_schedule_start_hour === draft.light_schedule_end_hour) {
    errors.light_schedule_start_hour = "Jam mulai dan selesai tidak boleh sama";
  }

  return errors;
}

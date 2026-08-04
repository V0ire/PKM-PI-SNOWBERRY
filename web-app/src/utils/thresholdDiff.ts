import type { ThresholdConfig } from "../types";

type FieldKey = keyof ThresholdConfig;

// Hanya field yang dilihat petani. updated_at/updated_by sengaja tidak masuk.
const FIELD_LABELS: Partial<Record<FieldKey, { label: string; unit: string; scale?: number }>> = {
  temp_low: { label: "Suhu minimum", unit: "°C" },
  temp_high: { label: "Suhu maksimum", unit: "°C" },
  rh_low: { label: "Kelembapan minimum", unit: "%" },
  rh_high: { label: "Kelembapan maksimum", unit: "%" },
  soil_low: { label: "Media kering di bawah", unit: "%" },
  soil_high: { label: "Pompa berhenti di", unit: "%" },
  lux_low: { label: "Lampu menyala di bawah", unit: "lux" },
  lux_high: { label: "Lampu mati di atas", unit: "lux" },
  pump_pulse_ms: { label: "Lama pompa menyala", unit: "detik", scale: 1000 },
  soak_period_ms: { label: "Jeda resap", unit: "detik", scale: 1000 },
  planting_date: { label: "Tanggal tanam", unit: "" },
};

export type ChangedField = { key: FieldKey; label: string; before: string; after: string };

export function sameThresholds(a: ThresholdConfig, b: ThresholdConfig) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function diffThresholds(before: ThresholdConfig, after: ThresholdConfig): ChangedField[] {
  return (Object.keys(FIELD_LABELS) as FieldKey[])
    .filter((key) => before[key] !== after[key])
    .map((key) => {
      const meta = FIELD_LABELS[key]!;
      const fmt = (value: unknown) => {
        if (typeof value !== "number") return String(value ?? "-");
        const scaled = meta.scale ? value / meta.scale : value;
        const shown = Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
        return meta.unit ? `${shown} ${meta.unit}` : shown;
      };
      return { key, label: meta.label, before: fmt(before[key]), after: fmt(after[key]) };
    });
}

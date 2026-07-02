import { useMemo, useState } from "react";
import type { ConnectionState, FormState, ThresholdConfig } from "../types";
import { DEFAULT_THRESHOLDS } from "../data/mockSnowberry";
import { FormSkeleton } from "../components/LoadingSkeleton";
import { NoticeBanner } from "../components/NoticeBanner";
import { SectionHero } from "../components/SectionHero";
import { StatusPill } from "../components/StatusPill";
import { connectionVisual, formVisual } from "../utils/status";

type FieldKey = keyof ThresholdConfig;
type FieldErrors = Partial<Record<FieldKey, string>>;

function validate(form: ThresholdConfig): FieldErrors {
  const errors: FieldErrors = {};
  if (form.temp_low >= form.temp_high) {
    errors.temp_low = "Suhu minimum harus lebih kecil dari suhu maksimum.";
    errors.temp_high = "Suhu maksimum harus lebih besar dari suhu minimum.";
  }
  if (form.rh_low >= form.rh_high) {
    errors.rh_low = "Kelembapan minimum harus lebih kecil dari kelembapan maksimum.";
    errors.rh_high = "Kelembapan maksimum harus lebih besar dari kelembapan minimum.";
  }
  if (form.soil_low >= form.soil_high) {
    errors.soil_low = "Media kering harus lebih kecil dari media basah.";
    errors.soil_high = "Batas pompa berhenti harus lebih besar dari batas kering.";
  }
  if (form.lux_low >= form.lux_high) {
    errors.lux_low = "Cahaya untuk menyalakan lampu harus lebih kecil.";
    errors.lux_high = "Cahaya untuk mematikan lampu harus lebih besar.";
  }
  if (form.pump_pulse_ms > form.soak_period_ms) {
    errors.pump_pulse_ms = "Lama pompa menyala tidak boleh lebih lama dari jeda resap.";
    errors.soak_period_ms = "Jeda resap harus lebih lama atau sama dengan lama pompa menyala.";
  }
  return errors;
}

function sameThresholds(a: ThresholdConfig, b: ThresholdConfig) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function ThresholdsPage({
  thresholds,
  connection,
  isLoading,
  onSave,
  onToast,
}: {
  thresholds: ThresholdConfig;
  connection: ConnectionState;
  isLoading: boolean;
  onSave: (thresholds: ThresholdConfig) => void;
  onToast: (message: string) => void;
}) {
  const [form, setForm] = useState(thresholds);
  const [saveState, setSaveState] = useState<FormState>("clean");
  const errors = useMemo(() => validate(form), [form]);
  const hasErrors = Object.keys(errors).length > 0;
  const dirty = !sameThresholds(form, thresholds);
  const formState: FormState = saveState === "saving" || saveState === "saved" ? saveState : hasErrors ? "invalid" : dirty ? "dirty" : "clean";
  const formCopy = formVisual[formState];

  const update = (key: FieldKey, value: number | string) => {
    setSaveState("clean");
    setForm((current) => ({ ...current, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="page-stack thresholds-page">
        <SectionHero eyebrow="Pengaturan" title="Batas Otomatis">
          <p>Menyiapkan formulir batas otomatis.</p>
        </SectionHero>
        <FormSkeleton />
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div className="page-stack thresholds-page">
      <SectionHero eyebrow="Pengaturan" title="Batas Otomatis">
        <p>Atur kapan alat menyala dan mati secara otomatis. Gunakan nilai aman yang disarankan jika belum yakin.</p>
      </SectionHero>

      {connection !== "online" && (
        <NoticeBanner tone="warning" title={connectionVisual[connection].label}>
          <p>Batas dapat disimpan, tetapi perangkat akan menerapkan saat terhubung kembali.</p>
        </NoticeBanner>
      )}

      <div className="form-status-row">
        <StatusPill label={formCopy.label} className={formCopy.className} />
        <p>{formCopy.message}</p>
      </div>

      <section className="form-stack">
        <FieldGroup title="Udara Greenhouse" text="Jika suhu atau kelembapan keluar dari batas ini, kipas atau kabut membantu menstabilkan kondisi.">
          <NumberField label="Suhu minimum" unit="°C" value={form.temp_low} error={errors.temp_low} onChange={(value) => update("temp_low", value)} />
          <NumberField label="Suhu maksimum" unit="°C" value={form.temp_high} error={errors.temp_high} onChange={(value) => update("temp_high", value)} />
          <NumberField label="Kelembapan minimum" unit="%" value={form.rh_low} error={errors.rh_low} onChange={(value) => update("rh_low", value)} />
          <NumberField label="Kelembapan maksimum" unit="%" value={form.rh_high} error={errors.rh_high} onChange={(value) => update("rh_high", value)} />
        </FieldGroup>

        <FieldGroup title="Media Tanam" text="Penyiraman dibuat bertahap agar akar stroberi tidak tergenang.">
          <NumberField label="Media dianggap kering di bawah" unit="%" value={form.soil_low} error={errors.soil_low} onChange={(value) => update("soil_low", value)} />
          <NumberField label="Pompa berhenti jika media mencapai" unit="%" value={form.soil_high} error={errors.soil_high} onChange={(value) => update("soil_high", value)} />
          <NumberField
            label="Lama pompa menyala sekali siram"
            unit="detik"
            value={form.pump_pulse_ms / 1000}
            error={errors.pump_pulse_ms}
            onChange={(value) => update("pump_pulse_ms", Math.round(value * 1000))}
          />
          <NumberField
            label="Jeda agar air meresap"
            unit="detik"
            value={form.soak_period_ms / 1000}
            error={errors.soak_period_ms}
            onChange={(value) => update("soak_period_ms", Math.round(value * 1000))}
          />
        </FieldGroup>

        <FieldGroup title="Cahaya" text="Lampu tanam membantu saat cahaya alami tidak cukup.">
          <NumberField label="Lampu menyala jika cahaya di bawah" unit="lux" value={form.lux_low} error={errors.lux_low} onChange={(value) => update("lux_low", value)} />
          <NumberField label="Lampu mati jika cahaya di atas" unit="lux" value={form.lux_high} error={errors.lux_high} onChange={(value) => update("lux_high", value)} />
        </FieldGroup>

        <FieldGroup title="Tanaman" text="Tanggal ini dipakai untuk menghitung HST dan fase pertumbuhan tanaman.">
          <label className={`field ${errors.planting_date ? "field-error" : ""}`}>
            <span>Tanggal tanam</span>
            <input type="date" value={form.planting_date} onChange={(event) => update("planting_date", event.target.value)} />
            {errors.planting_date && <small>{errors.planting_date}</small>}
          </label>
        </FieldGroup>
      </section>

      <section className="sticky-actions">
        <button className="btn plain" type="button" onClick={() => setForm(thresholds)}>
          Batal
        </button>
        <button className="btn outline" type="button" onClick={() => setForm(DEFAULT_THRESHOLDS)}>
          Kembalikan ke Nilai Awal
        </button>
        <button
          className="btn primary"
          type="button"
          disabled={hasErrors || formState === "saving"}
          onClick={() => {
            setSaveState("saving");
            window.setTimeout(() => {
              const saved = { ...form, updated_at: Date.now(), updated_by: "uid_mock_petani" };
              onSave(saved);
              setForm(saved);
              setSaveState("saved");
              onToast("Batas otomatis disimpan. Perangkat akan memakai pengaturan baru setelah tersinkron.");
            }, 450);
          }}
        >
          {formState === "saving" ? "Menyimpan..." : "Simpan Batas Otomatis"}
        </button>
      </section>
    </div>
  );
}

function FieldGroup({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <section className="field-group">
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      <div className="field-grid">{children}</div>
    </section>
  );
}

function NumberField({
  label,
  unit,
  value,
  error,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  error?: string;
  onChange: (value: number) => void;
}) {
  const errorId = `${label.toLowerCase().replace(/\s+/g, "-")}-error`;

  return (
    <label className={`field ${error ? "field-error" : ""}`}>
      <span>{label}</span>
      <div className="input-with-unit">
        <input
          inputMode="decimal"
          type="number"
          value={Number.isInteger(value) ? value : value.toFixed(1)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <em>{unit}</em>
      </div>
      {error && <small id={errorId}>{error}</small>}
    </label>
  );
}

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import type { ConnectionState, FormState, ThresholdConfig } from "../types";
import { DEFAULT_THRESHOLDS } from "../data/mockSnowberry";
import { FormSkeleton } from "../components/LoadingSkeleton";
import { NoticeBanner } from "../components/NoticeBanner";
import { SectionHero } from "../components/SectionHero";
import { StatusPill } from "../components/StatusPill";
import { connectionVisual, formVisual } from "../utils/status";

type FieldKey = keyof ThresholdConfig;
type FieldErrors = Partial<Record<FieldKey, string>>;
type HelpTopic = "air" | "media" | "light" | "plant";

const THRESHOLD_HELP: Record<
  HelpTopic,
  { title: string; body: string; rows: { phase: string; value: string }[] }
> = {
  air: {
    title: "Normal Udara per Fase",
    body: "Gunakan kisaran ini sebagai pegangan. Nilai bisa disesuaikan dengan kondisi greenhouse Ciwidey.",
    rows: [
      { phase: "Vegetatif", value: "Suhu 18-24 °C, kelembapan 60-75%" },
      { phase: "Berbunga", value: "Suhu 15-22 °C, kelembapan 50-70%" },
      { phase: "Berbuah", value: "Suhu 18-25 °C, kelembapan 55-70%" },
    ],
  },
  media: {
    title: "Normal Media Tanam",
    body: "Media dibuat lembap stabil, bukan becek. Siram bertahap membantu akar tetap aman.",
    rows: [
      { phase: "Vegetatif", value: "Sekitar 60-70%" },
      { phase: "Berbunga", value: "Sekitar 55-65%" },
      { phase: "Berbuah", value: "Sekitar 50-60%" },
    ],
  },
  light: {
    title: "Normal Cahaya",
    body: "Lampu tanam membantu saat cahaya alami kurang, terutama pada cuaca mendung.",
    rows: [
      { phase: "Vegetatif", value: "Cahaya cukup 12-16 jam per hari" },
      { phase: "Berbunga", value: "20.000-40.000 lux saat siang" },
      { phase: "Berbuah", value: "Cukup untuk pembentukan rasa manis" },
    ],
  },
  plant: {
    title: "Tanggal Tanam",
    body: "Tanggal tanam dipakai untuk menghitung HST dan menentukan fase tanaman.",
    rows: [
      { phase: "Hari 0-30", value: "Vegetatif" },
      { phase: "Hari 31-60", value: "Berbunga" },
      { phase: "Hari 61 ke atas", value: "Berbuah" },
    ],
  },
};

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
  const [helpTopic, setHelpTopic] = useState<HelpTopic | null>(null);
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
        <p>Atur kebiasaan kerja alat otomatis. Gunakan nilai awal jika belum yakin.</p>
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
        <FieldGroup
          title="Udara Greenhouse"
          text="Jika suhu atau kelembapan keluar dari batas ini, kipas atau kabut membantu menenangkan udara."
          onInfo={() => setHelpTopic("air")}
        >
          <NumberField label="Suhu minimum" unit="°C" value={form.temp_low} error={errors.temp_low} onChange={(value) => update("temp_low", value)} />
          <NumberField label="Suhu maksimum" unit="°C" value={form.temp_high} error={errors.temp_high} onChange={(value) => update("temp_high", value)} />
          <NumberField label="Kelembapan minimum" unit="%" value={form.rh_low} error={errors.rh_low} onChange={(value) => update("rh_low", value)} />
          <NumberField label="Kelembapan maksimum" unit="%" value={form.rh_high} error={errors.rh_high} onChange={(value) => update("rh_high", value)} />
        </FieldGroup>

        <FieldGroup
          title="Media Tanam"
          text="Penyiraman dibuat bertahap agar akar stroberi tidak tergenang."
          onInfo={() => setHelpTopic("media")}
        >
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

        <FieldGroup
          title="Cahaya"
          text="Lampu tanam membantu saat cahaya alami belum cukup untuk stroberi putih."
          onInfo={() => setHelpTopic("light")}
        >
          <NumberField label="Lampu menyala jika cahaya di bawah" unit="lux" value={form.lux_low} error={errors.lux_low} onChange={(value) => update("lux_low", value)} />
          <NumberField label="Lampu mati jika cahaya di atas" unit="lux" value={form.lux_high} error={errors.lux_high} onChange={(value) => update("lux_high", value)} />
        </FieldGroup>

        <FieldGroup
          title="Tanaman"
          text="Tanggal ini dipakai untuk menghitung HST dan fase pertumbuhan tanaman."
          onInfo={() => setHelpTopic("plant")}
        >
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
          Reset
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
          {formState === "saving" ? "Menyimpan..." : "Simpan"}
        </button>
      </section>

      {helpTopic && (
        <div className="modal-backdrop" role="presentation" onClick={() => setHelpTopic(null)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="threshold-help-title" onClick={(event) => event.stopPropagation()}>
            <span className="modal-icon">
              <Info size={22} aria-hidden="true" />
            </span>
            <div>
              <h2 id="threshold-help-title">{THRESHOLD_HELP[helpTopic].title}</h2>
              <p>{THRESHOLD_HELP[helpTopic].body}</p>
            </div>
            <div className="target-help-grid">
              {THRESHOLD_HELP[helpTopic].rows.map((row) => (
                <div key={row.phase}>
                  <strong>{row.phase}</strong>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn primary" type="button" onClick={() => setHelpTopic(null)}>
                Mengerti
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function FieldGroup({ title, text, children, onInfo }: { title: string; text: string; children: React.ReactNode; onInfo?: () => void }) {
  return (
    <section className="field-group">
      <div className="field-group-header">
        <div>
          <h2>{title}</h2>
          <p>{text}</p>
        </div>
        {onInfo && (
          <button className="icon-btn info-btn" type="button" onClick={onInfo} aria-label={`Info ${title}`}>
            <Info size={18} aria-hidden="true" />
          </button>
        )}
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

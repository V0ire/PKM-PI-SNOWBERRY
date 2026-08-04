import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import type { ConnectionState, FormState, ThresholdConfig } from "../types";
import { DEFAULT_THRESHOLDS } from "../data/mockSnowberry";
import { FormSkeleton } from "../components/LoadingSkeleton";
import { NoticeBanner } from "../components/NoticeBanner";
import { SectionHero } from "../components/SectionHero";
import { connectionVisual } from "../utils/status";
import { diffThresholds, sameThresholds, type ChangedField } from "../utils/thresholdDiff";
import { validateThresholds } from "../utils/validateThresholds";

type FieldKey = keyof ThresholdConfig;
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
    body: "Tanggal tanam dipakai untuk menghitung HST (Hari Setelah Tanam) dan menentukan fase tanaman.",
    rows: [
      { phase: "Hari 0-30", value: "Vegetatif" },
      { phase: "Hari 31-60", value: "Berbunga" },
      { phase: "Hari 61 ke atas", value: "Berbuah" },
    ],
  },
};

export function ThresholdsPage({
  thresholds,
  connection,
  isLoading,
  onSave,
  onToast,
  cloudOnline,
  appliedConfigId,
}: {
  thresholds: ThresholdConfig;
  connection: ConnectionState;
  isLoading: boolean;
  onSave: (thresholds: ThresholdConfig) => void | Promise<void>;
  onToast: (message: string) => void;
  cloudOnline: boolean;
  appliedConfigId?: string;
}) {
  const [form, setForm] = useState(thresholds);
  const [saveState, setSaveState] = useState<FormState>("clean");
  const [helpTopic, setHelpTopic] = useState<HelpTopic | null>(null);
  const [confirmDiff, setConfirmDiff] = useState<ChangedField[] | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const errors = useMemo(() => validateThresholds(form), [form]);
  const hasErrors = Object.keys(errors).length > 0;
  const dirty = !sameThresholds(form, thresholds);
  const pendingChanges = useMemo(() => diffThresholds(thresholds, form).length, [thresholds, form]);

  // Sinkron form saat thresholds baru datang dari Firestore, kecuali sedang diedit.
  useEffect(() => {
    setForm((current) => (sameThresholds(current, thresholds) || !dirty ? thresholds : current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thresholds]);
  const formState: FormState = saveState === "saving" || saveState === "saved" ? saveState : hasErrors ? "invalid" : dirty ? "dirty" : "clean";

  const update = (key: FieldKey, value: number | string | boolean) => {
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

      {!cloudOnline && <NoticeBanner tone="danger" title="Aplikasi Tidak Terhubung"><p>Kontrol manual dan penyimpanan pengaturan dinonaktifkan sampai koneksi kembali.</p></NoticeBanner>}
      {thresholds.config_id !== appliedConfigId && <NoticeBanner tone="warning" title="Belum Diterapkan"><p>{connection === "offline" ? "Tersimpan di aplikasi, menunggu perangkat tersambung." : "Pengaturan tersimpan dan menunggu perangkat."}</p></NoticeBanner>}

      <section className="form-stack">
        <FieldGroup
          title="Pelembap - Kelembapan Udara"
          text="Atur kapan Pelembap Udara meminta menyala dan mati berdasarkan kelembapan. Nilai yang dapat digunakan: 20-95%."
          onInfo={() => setHelpTopic("air")}
        >
          <NumberField label="Kelembapan minimum" unit="%" value={form.rh_low} error={errors.rh_low} onChange={(value) => update("rh_low", value)} />
          <NumberField label="Kelembapan maksimum" unit="%" value={form.rh_high} error={errors.rh_high} onChange={(value) => update("rh_high", value)} />
        </FieldGroup>

        <FieldGroup title="Pelembap - Pengaruh Suhu" text="Suhu dan kelembapan dipakai bersama untuk menentukan kerja pelembap." onInfo={() => setHelpTopic("air")}>
          <ToggleField label="Gunakan suhu untuk mengendalikan pelembap" checked={form.temperature_influence} onChange={(value) => update("temperature_influence", value)} />
          {form.temperature_influence && <><NumberField label="Pelembap mati jika suhu turun sampai" unit="°C" value={form.temp_low} error={errors.temp_low} onChange={(value) => update("temp_low", value)} /><NumberField label="Pelembap menyala jika suhu mencapai" unit="°C" value={form.temp_high} error={errors.temp_high} onChange={(value) => update("temp_high", value)} /><SelectField label="Jika suhu dan kelembapan memberi perintah berbeda" value={form.humidifier_priority} onChange={(value) => update("humidifier_priority", value)} options={[["RH","Utamakan kelembapan udara"],["TEMPERATURE","Utamakan suhu"]]} /><SelectField label="Jika data suhu tidak tersedia" value={form.temperature_failure_fallback} onChange={(value) => update("temperature_failure_fallback", value)} options={[["OFF","Matikan pelembap"],["RH_ONLY","Lanjutkan berdasarkan kelembapan udara"]]} /></>}
        </FieldGroup>

        <FieldGroup
          title="Media dan Pompa"
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
          <NumberField label="Batas Jumlah Penyiraman" unit="kali" value={form.pump_start_limit} error={errors.pump_start_limit} onChange={(value) => update("pump_start_limit", value)} />
          <NumberField label="Lama periode pembatas" unit="jam" value={form.pump_window_ms / 3600000} error={errors.pump_window_ms} onChange={(value) => update("pump_window_ms", Math.round(value * 3600000))} />
        </FieldGroup>

        <FieldGroup
          title="Lampu Tanam"
          text="Lampu menyala otomatis saat cahaya kurang."
          onInfo={() => setHelpTopic("light")}
        >
          <NumberField label="Lampu menyala jika cahaya di bawah" unit="lux" value={form.lux_low} error={errors.lux_low} onChange={(value) => update("lux_low", value)} />
          <NumberField label="Lampu mati jika cahaya di atas" unit="lux" value={form.lux_high} error={errors.lux_high} onChange={(value) => update("lux_high", value)} />
          <ToggleField label="Gunakan jadwal lampu" checked={form.light_schedule_enabled} onChange={(value) => update("light_schedule_enabled", value)} />
          {form.light_schedule_enabled && <><NumberField label="Mulai jadwal" unit="jam" value={form.light_schedule_start_hour} error={errors.light_schedule_start_hour} onChange={(value) => update("light_schedule_start_hour", value)} /><NumberField label="Selesai jadwal" unit="jam" value={form.light_schedule_end_hour} error={errors.light_schedule_end_hour} onChange={(value) => update("light_schedule_end_hour", value)} /></>}
        </FieldGroup>
        <FieldGroup title="Tanaman" text="Tanggal ini dipakai untuk menghitung HST dan fase pertumbuhan tanaman." onInfo={() => setHelpTopic("plant")}><label className="field"><span>Tanggal tanam</span><input type="date" value={form.planting_date} onChange={(event) => update("planting_date", event.target.value)} /></label></FieldGroup>
      </section>

      <section className="sticky-actions">
        <button className="btn plain" type="button" disabled={!dirty} onClick={() => setForm(thresholds)}>
          Batalkan
        </button>
        <button
          className="btn primary"
          type="button"
          disabled={!cloudOnline || hasErrors || !dirty || formState === "saving"}
          onClick={() => {
            const changes = diffThresholds(thresholds, form);
            if (changes.length === 0) return;
            setConfirmDiff(changes);
          }}
        >
          {formState === "saving" ? "Menyimpan..." : `Simpan ${pendingChanges} Perubahan`}
        </button>
      </section>

      {/* Aksi merusak dipisah dari bar utama supaya tidak tertekan tidak sengaja. */}
      <button className="reset-link" type="button" onClick={() => setConfirmReset(true)}>
        Pakai Nilai Awal
      </button>

      {confirmDiff && (
        <div className="modal-backdrop" role="presentation" onClick={() => setConfirmDiff(null)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="threshold-confirm-title" onClick={(event) => event.stopPropagation()}>
            <div>
              <h2 id="threshold-confirm-title">Simpan Perubahan Batas?</h2>
              <p>Pengaturan berikut akan diperbarui. Perangkat menerapkan dalam sekitar 60 detik.</p>
            </div>
            <div className="target-help-grid">
              {confirmDiff.map((change) => (
                <div key={change.key}>
                  <strong>{change.label}</strong>
                  <span>
                    {change.before} → {change.after}
                  </span>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn plain" type="button" onClick={() => setConfirmDiff(null)}>
                Batal
              </button>
              <button
                className="btn primary"
                type="button"
                onClick={() => {
                  setConfirmDiff(null);
                  setSaveState("saving");
                  const saved = { ...form, config_id: crypto.randomUUID(), updated_at: Date.now() };
                  Promise.resolve(onSave(saved))
                    .then(() => {
                      setForm(saved);
                      setSaveState("saved");
                      onToast("Batas otomatis disimpan. Perangkat akan memakai pengaturan baru setelah tersinkron.");
                    })
                    .catch(() => {
                      setSaveState("error");
                      onToast("Gagal menyimpan batas. Periksa koneksi lalu coba lagi.");
                    });
                }}
              >
                Simpan
              </button>
            </div>
          </section>
        </div>
      )}

      {confirmReset && (
        <div className="modal-backdrop" role="presentation" onClick={() => setConfirmReset(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="threshold-reset-title" onClick={(event) => event.stopPropagation()}>
            <div>
              <h2 id="threshold-reset-title">Pakai Nilai Awal?</h2>
              <p>Semua batas kembali ke setelan pabrik. Perubahan Anda hilang.</p>
            </div>
            <div className="modal-actions">
              <button className="btn plain" type="button" onClick={() => setConfirmReset(false)}>
                Batal
              </button>
              <button
                className="btn primary"
                type="button"
                onClick={() => {
                  // Tanggal tanam milik jurnal, bukan setelan pabrik: dipertahankan.
                  setForm({ ...DEFAULT_THRESHOLDS, planting_date: form.planting_date });
                  setConfirmReset(false);
                }}
              >
                Pakai Nilai Awal
              </button>
            </div>
          </section>
        </div>
      )}

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

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="field toggle-field"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>; }
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (value: string) => void }) { return <label className="field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([key,text]) => <option key={key} value={key}>{text}</option>)}</select></label>; }

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

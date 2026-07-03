import { useState } from "react";
import { CalendarDays, Sprout, Wheat } from "lucide-react";
import type { FarmJournalEntry, ThresholdConfig } from "../types";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { SectionHero } from "../components/SectionHero";
import { getGrowthPhaseInfo } from "../utils/status";

function todayInputValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function formatJournalDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(Date.parse(`${date}T00:00:00+07:00`));
}

export function GrowthPhasePage({
  thresholds,
  isLoading,
  journalEntries,
  onEditDate,
  onJournalAdd,
  onResetPlantingDate,
}: {
  thresholds: ThresholdConfig;
  isLoading: boolean;
  journalEntries: FarmJournalEntry[];
  onEditDate: () => void;
  onJournalAdd: (entry: FarmJournalEntry) => void;
  onResetPlantingDate: () => void;
}) {
  const [journalMode, setJournalMode] = useState<"planting" | "harvest" | null>(null);
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  if (isLoading) {
    return (
      <div className="page-stack">
        <SectionHero eyebrow="Tanaman" title="Fase Tanam">
          <p>Menyiapkan umur tanam dan target kondisi.</p>
        </SectionHero>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const phase = getGrowthPhaseInfo(thresholds.planting_date);
  const progress = Math.min(100, Math.round((phase.hst / 90) * 100));
  const journalCopy =
    journalMode === "planting"
      ? {
          title: "Tanam Hari Ini?",
          body: "Tanggal tanam akan direset ke hari ini. Anda boleh menambahkan jumlah bibit atau catatan singkat.",
          label: "Jumlah bibit",
          unit: "bibit",
          confirm: "Simpan Tanam",
        }
      : {
          title: "Catat Panen Hari Ini?",
          body: "Catatan panen disimpan di jurnal mock. Tanggal tanam juga direset ke hari ini untuk memulai siklus baru.",
          label: "Hasil panen",
          unit: "kg",
          confirm: "Simpan Panen",
        };

  const closeJournal = () => {
    setJournalMode(null);
    setQuantity("");
    setNote("");
  };

  const submitJournal = () => {
    if (!journalMode) return;
    const numericQuantity = Number(quantity);
    onJournalAdd({
      id: `${journalMode}-${Date.now()}`,
      type: journalMode,
      date: todayInputValue(),
      quantity: Number.isFinite(numericQuantity) && numericQuantity > 0 ? numericQuantity : undefined,
      unit: journalMode === "planting" ? "bibit" : "kg",
      note: note.trim() || undefined,
    });
    onResetPlantingDate();
    closeJournal();
  };

  return (
    <div className="page-stack">
      <SectionHero eyebrow="Tanaman" title="Fase Tanam">
        <p>Panduan harian berdasarkan umur tanaman stroberi putih.</p>
      </SectionHero>

      <section className="growth-card">
        <span className="crop-badge">{phase.shortTitle}</span>
        <p className="eyebrow">Hari ke-{phase.hst} setelah tanam</p>
        <h2>{phase.title}</h2>
        <p>{phase.description}</p>
        <p className="summary-action">{phase.focus}</p>
        <div className="progress-track" aria-label={`Perkembangan tanam ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="two-column">
        <article className="card target-card">
          <h3>Target Kondisi</h3>
          <dl>
            {Object.entries(phase.targets).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </article>
        <article className="card phase-advice-card">
          <h3>Panduan Hari Ini</h3>
          <p>{phase.action}</p>
          <div className="phase-risk">
            <span>Yang perlu dihindari</span>
            <p>{phase.risk}</p>
          </div>
          <div className="button-row">
            <button className="btn outline" type="button" onClick={onEditDate}>
              Ubah Tanggal Tanam
            </button>
          </div>
        </article>
      </section>

      <section className="card journal-card">
        <div className="card-topline">
          <div>
            <h3>Jurnal Kebun</h3>
            <p>Catat momen penting tanpa formulir panjang.</p>
          </div>
          <CalendarDays size={22} aria-hidden="true" />
        </div>
        <div className="journal-actions">
          <button className="btn primary" type="button" onClick={() => setJournalMode("planting")}>
            <Sprout size={18} aria-hidden="true" />
            Tanam
          </button>
          <button className="btn outline" type="button" onClick={() => setJournalMode("harvest")}>
            <Wheat size={18} aria-hidden="true" />
            Panen
          </button>
        </div>
        {journalEntries.length > 0 ? (
          <div className="journal-list">
            {journalEntries.slice(0, 3).map((entry) => (
              <article key={entry.id}>
                <strong>{entry.type === "planting" ? "Tanam" : "Panen"} - {formatJournalDate(entry.date)}</strong>
                <p>
                  {entry.quantity ? `${entry.quantity} ${entry.unit}` : "Tanpa jumlah"}
                  {entry.note ? ` - ${entry.note}` : ""}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-copy">Belum ada catatan tanam atau panen.</p>
        )}
      </section>

      {journalMode && (
        <div className="modal-backdrop" role="presentation" onClick={closeJournal}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="journal-title" onClick={(event) => event.stopPropagation()}>
            <span className="modal-icon">
              {journalMode === "planting" ? <Sprout size={22} aria-hidden="true" /> : <Wheat size={22} aria-hidden="true" />}
            </span>
            <div>
              <h2 id="journal-title">{journalCopy.title}</h2>
              <p>{journalCopy.body}</p>
            </div>
            <label className="field">
              <span>{journalCopy.label} (opsional)</span>
              <div className="input-with-unit">
                <input inputMode="decimal" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
                <em>{journalCopy.unit}</em>
              </div>
            </label>
            <label className="field">
              <span>Catatan singkat (opsional)</span>
              <input type="text" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Contoh: buah matang bagus" />
            </label>
            <div className="modal-actions">
              <button className="btn plain" type="button" onClick={closeJournal}>
                Batal
              </button>
              <button className="btn primary" type="button" onClick={submitJournal}>
                {journalCopy.confirm}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

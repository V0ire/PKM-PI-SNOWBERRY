import type { SensorStatusKey } from "../types";

// Satu pesan per layar: judul (masalah), detail (angka vs batas), aksi, satu tombol.
// Pil status dihapus dari sini — TopBar sudah menampilkan koneksi, warna kartu sudah
// menyampaikan tingkat bahaya. Mengulanginya membuat petani membaca hal sama tiga kali.
export function GreenhouseHero({
  tone,
  title,
  detail,
  action,
  phase,
  checkCount,
  onOpenChecks,
  updatedText,
}: {
  tone: SensorStatusKey;
  title: string;
  detail: string;
  action: string;
  phase: string;
  checkCount: number;
  onOpenChecks: () => void;
  updatedText?: string;
}) {
  return (
    <section className={`greenhouse-hero tone-${tone}`}>
      <div className="hero-copy">
        <p className="eyebrow">{phase}</p>
        <h1>{title}</h1>
        <p>{detail}</p>
        <p className="hero-action">{action}</p>
        {checkCount > 0 && (
          <button type="button" className="hero-check-link" onClick={onOpenChecks}>
            Lihat semua yang perlu dicek ({checkCount})
          </button>
        )}
        {updatedText && <span className="hero-updated">{updatedText}</span>}
      </div>
    </section>
  );
}

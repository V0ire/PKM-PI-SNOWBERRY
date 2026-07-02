import type { ThresholdConfig } from "../types";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { SectionHero } from "../components/SectionHero";
import { daysAfterPlanting } from "../utils/date";

function getGrowthPhase(hst: number) {
  if (hst <= 30) {
    return {
      name: "Vegetatif",
      title: `Fase Vegetatif - Hari ke-${hst} setelah tanam`,
      copy: "Tanaman sedang membangun akar, daun, dan crown. Media perlu lembap, tetapi tidak tergenang.",
      targets: {
        "Suhu ideal": "18-24 °C",
        "Kelembapan ideal": "60-75%",
        "Cahaya ideal": "12-16 jam per hari",
        "Kelembapan media ideal": "60-70%",
      },
      action: "Buang daun rusak dan pastikan media tidak terlalu basah.",
    };
  }

  if (hst <= 60) {
    return {
      name: "Berbunga",
      title: `Fase Berbunga - Hari ke-${hst} setelah tanam`,
      copy: "Jaga kelembapan agar tidak terlalu tinggi supaya penyerbukan tidak terganggu.",
      targets: {
        "Suhu ideal": "15-22 °C",
        "Kelembapan ideal": "50-70%",
        "Cahaya ideal": "20.000-40.000 lux saat siang",
        "Kelembapan media ideal": "55-65%",
      },
      action: "Pantau kelembapan malam dan bantu sirkulasi udara saat bunga mulai banyak.",
    };
  }

  return {
    name: "Berbuah",
    title: `Fase Berbuah - Hari ke-${hst} setelah tanam`,
    copy: "Buah mulai membesar. Jaga media tidak terlalu basah agar buah tidak mudah pecah.",
    targets: {
      "Suhu ideal": "18-25 °C",
      "Kelembapan ideal": "55-70%",
      "Cahaya ideal": "Cukup untuk pembentukan gula",
      "Kelembapan media ideal": "50-60%",
    },
    action: "Panen buah yang matang dan buang buah rusak agar tidak menular.",
  };
}

export function GrowthPhasePage({
  thresholds,
  isLoading,
  onEditDate,
}: {
  thresholds: ThresholdConfig;
  isLoading: boolean;
  onEditDate: () => void;
}) {
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

  const hst = daysAfterPlanting(thresholds.planting_date);
  const phase = getGrowthPhase(hst);
  const progress = Math.min(100, Math.round((hst / 90) * 100));

  return (
    <div className="page-stack">
      <SectionHero eyebrow="Tanaman" title="Fase Tanam">
        <p>Target kondisi berubah sesuai umur tanaman.</p>
      </SectionHero>

      <section className="growth-card">
        <p className="eyebrow">Hari ke-{hst} setelah tanam</p>
        <h2>{phase.title}</h2>
        <p>{phase.copy}</p>
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
        <article className="card">
          <h3>Saran Tindakan</h3>
          <p>{phase.action}</p>
          <button className="btn outline" type="button" onClick={onEditDate}>
            Ubah Tanggal Tanam
          </button>
        </article>
      </section>
    </div>
  );
}

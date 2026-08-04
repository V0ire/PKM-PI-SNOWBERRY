import { Leaf } from "lucide-react";
import { useEffect, useState } from "react";
import type { PlantPhase } from "../types";
import { FUN_FACTS } from "../data/education";

export function StartupScreen({
  showSetup,
  onSave,
  unavailable = false,
}: {
  showSetup: boolean;
  onSave: (profile: { greenhouse_name: string; plant_phase: PlantPhase }) => void;
  unavailable?: boolean;
}) {
  // Mulai dari fakta acak supaya pembukaan aplikasi tidak selalu sama.
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * FUN_FACTS.length));
  useEffect(() => {
    const timer = window.setInterval(() => setFactIndex((index) => (index + 1) % FUN_FACTS.length), 5000);
    return () => window.clearInterval(timer);
  }, []);

  if (showSetup) return <SetupForm onSave={onSave} />;

  if (unavailable) return <main className="startup-screen" role="alert">
    <span className="startup-mark"><Leaf size={54} strokeWidth={1.5} aria-hidden="true" /></span>
    <p className="eyebrow">Perangkat Tidak Terhubung</p>
    <h1>Data greenhouse belum masuk</h1>
    <p>Periksa listrik box Snowberry dan koneksi Wi-Fi greenhouse. Keadaan perangkat belum dapat dipastikan sampai tersambung kembali.</p>
    <button className="btn primary" type="button" onClick={() => window.location.reload()}>Coba Lagi</button>
  </main>;

  return (
    <main className="startup-screen" aria-live="polite">
      <span className="startup-mark"><Leaf size={54} strokeWidth={1.5} aria-hidden="true" /></span>
      <p className="eyebrow">Snowberry</p>
      <h1>Menyiapkan kondisi greenhouse</h1>
      <p>Tahukah Anda? {FUN_FACTS[factIndex]}</p>
    </main>
  );
}

function SetupForm({ onSave }: { onSave: (profile: { greenhouse_name: string; plant_phase: PlantPhase }) => void }) {
  const [step, setStep] = useState(1);
  const [greenhouseName, setGreenhouseName] = useState("Greenhouse Ciwidey");
  const [plantPhase, setPlantPhase] = useState<PlantPhase>("vegetatif");
  return (
    <main className="startup-screen">
      <Leaf size={54} strokeWidth={1.5} aria-hidden="true" />
      <p className="eyebrow">Pengaturan Awal</p>
      <h1>Kenali greenhouse Anda</h1>
      <p>Isi sekali agar informasi tanaman sesuai kondisi saat ini.</p>
      <div className="startup-form">
        <span className="plant-progress">{step} dari 2</span>
        {step === 1 ? (
          <>
            <label className="field">Nama Greenhouse<input required value={greenhouseName} onChange={(event) => setGreenhouseName(event.target.value)} /></label>
            <button className="btn primary" type="button" disabled={!greenhouseName.trim()} onClick={() => setStep(2)}>Berikutnya</button>
          </>
        ) : (
          <>
            <label className="field">Tahap Tanaman<select value={plantPhase} onChange={(event) => setPlantPhase(event.target.value as PlantPhase)}><option value="vegetatif">Vegetatif</option><option value="berbunga">Berbunga</option><option value="buah">Buah</option></select></label>
            <button className="btn primary" type="button" onClick={() => onSave({ greenhouse_name: greenhouseName.trim(), plant_phase: plantPhase })}>Simpan dan Mulai Pantau</button>
            <button className="btn plain" type="button" onClick={() => setStep(1)}>Sebelumnya</button>
          </>
        )}
      </div>
    </main>
  );
}

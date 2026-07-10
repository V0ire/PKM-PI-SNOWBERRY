import { Leaf } from "lucide-react";
import type { PlantPhase } from "../types";

export function StartupScreen({
  showSetup,
  onSave,
}: {
  showSetup: boolean;
  onSave: (profile: { greenhouse_name: string; plant_phase: PlantPhase }) => void;
}) {
  if (showSetup) {
    return <SetupForm onSave={onSave} />;
  }

  return (
    <main className="startup-screen" aria-live="polite">
      <Leaf size={54} strokeWidth={1.5} aria-hidden="true" />
      <p className="eyebrow">Snowberry</p>
      <h1>Menyiapkan kondisi greenhouse</h1>
      <p>Tahukah Anda? Kelembapan tinggi terlalu lama dapat meningkatkan risiko jamur pada tanaman stroberi.</p>
    </main>
  );
}

function SetupForm({ onSave }: { onSave: (profile: { greenhouse_name: string; plant_phase: PlantPhase }) => void }) {
  return (
    <main className="startup-screen">
      <Leaf size={54} strokeWidth={1.5} aria-hidden="true" />
      <p className="eyebrow">Pengaturan Awal</p>
      <h1>Kenali greenhouse Anda</h1>
      <p>Isi sekali agar informasi tanaman sesuai kondisi saat ini.</p>
      <form
        className="startup-form"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          onSave({ greenhouse_name: String(form.get("greenhouse_name")).trim(), plant_phase: form.get("plant_phase") as PlantPhase });
        }}
      >
        <label className="field">
          Nama Greenhouse
          <input name="greenhouse_name" required defaultValue="Greenhouse Ciwidey" />
        </label>
        <label className="field">
          Tahap Tanaman
          <select name="plant_phase" defaultValue="vegetatif">
            <option value="vegetatif">Vegetatif</option>
            <option value="berbunga">Berbunga</option>
            <option value="buah">Buah</option>
          </select>
        </label>
        <button className="btn primary" type="submit">Mulai Pantau Greenhouse</button>
      </form>
    </main>
  );
}

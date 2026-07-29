import type { DailyCheckItem } from "../types";
import { sensorVisual } from "../utils/status";

export function CheckPage({ checks, onBack }: { checks: DailyCheckItem[]; onBack: () => void }) {
  return (
    <div className="page-stack check-page">
      <header className="page-heading">
        <p className="eyebrow">Kondisi Perlu Dicek</p>
        <h1>Yang perlu dilakukan</h1>
        <p>Ikuti satu per satu agar kondisi greenhouse kembali stabil.</p>
      </header>
      {checks.map((check) => (
        <article key={check.id} className={`check-detail tone-${check.tone}`}>
          <span>{sensorVisual[check.tone].label}</span>
          <h2>{check.title}</h2>
          <p>{check.body}</p>
          <strong>{check.action}</strong>
        </article>
      ))}
      <button className="btn outline" type="button" onClick={onBack}>Kembali ke Beranda</button>
    </div>
  );
}

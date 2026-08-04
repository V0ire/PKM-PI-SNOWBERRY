import type { GrowthPhaseKey } from "../types";

// Garis waktu fase menggantikan bar /90 hari. Bar lama menyiratkan panen selesai
// di hari ke-90 padahal stroberi terus berbuah; petani butuh tahu fase, bukan persen.
const PHASES: Array<{ key: GrowthPhaseKey; label: string }> = [
  { key: "vegetative", label: "Vegetatif" },
  { key: "flowering", label: "Berbunga" },
  { key: "fruiting", label: "Berbuah" },
];

export function PhaseTimeline({ current }: { current: GrowthPhaseKey }) {
  const currentIndex = PHASES.findIndex((phase) => phase.key === current);

  return (
    <ol className="phase-timeline" aria-label="Tahap pertumbuhan">
      {PHASES.map((phase, index) => {
        const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "next";
        return (
          <li key={phase.key} className={state} aria-current={state === "current" ? "step" : undefined}>
            <span className="phase-dot" aria-hidden="true" />
            <span className="phase-name">{phase.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

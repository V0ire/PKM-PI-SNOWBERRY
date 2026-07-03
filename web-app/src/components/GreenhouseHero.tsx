import { CircleCheck, CloudOff, CloudSun, TriangleAlert } from "lucide-react";
import type { SensorStatusKey } from "../types";
import { sensorVisual } from "../utils/status";

function getGreeting(now: number): string {
  const hour = new Date(now).getHours();
  if (hour >= 5 && hour < 12) return "Selamat pagi!";
  if (hour >= 12 && hour < 17) return "Selamat siang!";
  if (hour >= 17 && hour < 21) return "Selamat sore!";
  return "Selamat malam!";
}

const STATUS_ICON: Record<SensorStatusKey, typeof CircleCheck> = {
  safe: CircleCheck,
  warning: CloudSun,
  danger: TriangleAlert,
  unknown: CloudOff,
};

export function GreenhouseHero({
  tone,
  title,
  detail,
  now,
  updatedText,
}: {
  tone: SensorStatusKey;
  title: string;
  detail: string;
  now: number;
  updatedText?: string;
}) {
  const visual = sensorVisual[tone];
  const greeting = getGreeting(now);
  const Icon = STATUS_ICON[tone];

  return (
    <section className={`greenhouse-hero ${visual.className}`}>
      <div className="hero-illustration">
        <span className={`hero-weather ${visual.className}`}>
          <Icon size={30} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <span className={`hero-badge ${visual.className}`}>
          <Icon size={15} strokeWidth={2.5} aria-hidden="true" />
          {visual.label}
        </span>
      </div>
      <div className="hero-copy">
        <p className="hero-greeting">{greeting}</p>
        <h1>{title}</h1>
        <p>{detail}</p>
        {updatedText && <span className="hero-updated">{updatedText}</span>}
      </div>
    </section>
  );
}

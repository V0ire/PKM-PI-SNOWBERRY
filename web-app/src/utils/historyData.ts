import type { TelemetryPoint } from "../types";

export type TelemetryDocument = { d?: unknown[]; samples?: unknown[] };

export function historyAxisLabel(timestamp: number, showDate: boolean): string {
  return new Intl.DateTimeFormat("id-ID", showDate
    ? { day: "numeric", month: "short", timeZone: "Asia/Jakarta" }
    : { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }
  ).format(timestamp);
}

// Label lengkap untuk readout titik yang disentuh: tanggal + jam:menit WIB.
export function historyFullLabel(timestamp: number): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
  }).format(timestamp);
}

// Firestore membagi riwayat berdasarkan tanggal WIB, bukan zona waktu browser.
export function jakartaDateDocIds(nowMs: number, days: number): string[] {
  const count = Math.max(0, Math.floor(days));
  if (count === 0) return [];
  const jakartaToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(nowMs);
  const [year, month, day] = jakartaToday.split("-").map(Number);
  const anchor = Date.UTC(year, month - 1, day);
  return Array.from({ length: count }, (_, index) =>
    new Date(anchor - (count - 1 - index) * 86_400_000).toISOString().slice(0, 10),
  );
}

function isTelemetryPoint(value: unknown): value is TelemetryPoint {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<TelemetryPoint>;
  return (
    [p.ts, p.t, p.h, p.l, p.s].every((item) => typeof item === "number" && Number.isFinite(item)) &&
    [p.gl, p.p, p.m, p.f].every((item) => typeof item === "boolean")
  );
}

export function mergeTelemetryDocuments(documents: TelemetryDocument[]): TelemetryPoint[] {
  const unique = new Map<number, TelemetryPoint>();
  for (const document of documents) {
    const values = document.d ?? document.samples ?? [];
    for (const value of values) {
      if (isTelemetryPoint(value) && !unique.has(value.ts)) unique.set(value.ts, value);
    }
  }
  return Array.from(unique.values()).sort((a, b) => a.ts - b.ts);
}

export const formatDecimal = (value: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value);

export const formatInteger = (value: number) => new Intl.NumberFormat("id-ID").format(Math.round(value));

export function formatTimeAgo(ts: number, now: number) {
  const seconds = Math.max(0, Math.floor((now - ts) / 1000));
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export function formatCountdown(until: number | null, now: number) {
  if (!until) return "00:00";
  const remaining = Math.max(0, until - now);
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function daysAfterPlanting(plantingDate: string, now = Date.now()) {
  const planting = Date.parse(`${plantingDate}T00:00:00+07:00`);
  if (Number.isNaN(planting)) return 0;
  return Math.max(0, Math.floor((now - planting) / 86_400_000));
}

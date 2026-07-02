import type {
  ActuatorAvailability,
  ConnectionState,
  DashboardSummary,
  FormState,
  RealtimeStatus,
  SensorMetric,
  SensorStatusKey,
  ThresholdConfig,
} from "../types";
import { formatDecimal, formatInteger, formatTimeAgo } from "./date";

export const sensorVisual: Record<
  SensorStatusKey,
  { label: string; className: string; bg: string; text: string; border: string; severity: number; shortMessage: string }
> = {
  safe: {
    label: "Aman",
    className: "tone-safe",
    bg: "var(--status-safe-bg)",
    text: "var(--status-safe-text)",
    border: "var(--status-safe-border)",
    severity: 0,
    shortMessage: "Kondisi stabil.",
  },
  warning: {
    label: "Perlu Perhatian",
    className: "tone-warning",
    bg: "var(--status-warning-bg)",
    text: "var(--status-warning-text)",
    border: "var(--status-warning-border)",
    severity: 1,
    shortMessage: "Perlu dicek.",
  },
  danger: {
    label: "Bahaya",
    className: "tone-danger",
    bg: "var(--status-danger-bg)",
    text: "var(--status-danger-text)",
    border: "var(--status-danger-border)",
    severity: 2,
    shortMessage: "Masalah penting.",
  },
  unknown: {
    label: "Tidak Diketahui",
    className: "tone-unknown",
    bg: "var(--status-unknown-bg)",
    text: "var(--status-unknown-text)",
    border: "var(--status-unknown-border)",
    severity: 3,
    shortMessage: "Data belum tersedia.",
  },
};

export const connectionVisual: Record<
  ConnectionState,
  { label: string; shortLabel: string; className: string; message: string; action: string }
> = {
  online: {
    label: "Terhubung",
    shortLabel: "Terhubung",
    className: "tone-safe",
    message: "Perangkat terhubung dan data masih baru.",
    action: "Kontrol manual dapat dikirim.",
  },
  stale: {
    label: "Data Lama",
    shortLabel: "Data Lama",
    className: "tone-warning",
    message: "Data mungkin tidak terbaru. Kontrol otomatis di perangkat tetap berjalan.",
    action: "Cek koneksi jika data tidak berubah beberapa menit lagi.",
  },
  offline: {
    label: "Offline",
    shortLabel: "Offline",
    className: "tone-danger",
    message: "Perangkat tidak terhubung. Cek daya, WiFi, atau posisi perangkat.",
    action: "Kontrol manual belum bisa dikirim.",
  },
};

export const actuatorAvailabilityVisual: Record<
  ActuatorAvailability,
  { label: string; className: string; disabled: boolean; message: string }
> = {
  ready: {
    label: "Siap",
    className: "tone-safe",
    disabled: false,
    message: "Kontrol manual siap dikirim.",
  },
  offline_disabled: {
    label: "Tidak Tersedia",
    className: "tone-unknown",
    disabled: true,
    message: "Perangkat sedang offline. Kontrol manual belum bisa dikirim.",
  },
  sending: {
    label: "Mengirim",
    className: "tone-warning",
    disabled: true,
    message: "Perintah sedang dikirim.",
  },
  error: {
    label: "Gagal",
    className: "tone-danger",
    disabled: true,
    message: "Perintah belum terkirim. Coba lagi nanti.",
  },
};

export const formVisual: Record<FormState, { label: string; className: string; message: string }> = {
  clean: { label: "Belum Diubah", className: "tone-unknown", message: "Belum ada perubahan." },
  dirty: { label: "Ada Perubahan", className: "tone-warning", message: "Periksa nilai sebelum menyimpan." },
  invalid: { label: "Perlu Diperbaiki", className: "tone-danger", message: "Ada nilai yang belum sesuai." },
  saving: { label: "Menyimpan", className: "tone-warning", message: "Pengaturan sedang disimpan." },
  saved: { label: "Tersimpan", className: "tone-safe", message: "Batas otomatis disimpan." },
  error: { label: "Gagal", className: "tone-danger", message: "Pengaturan belum tersimpan." },
};

export function getConnectionState(status: RealtimeStatus, now: number): ConnectionState {
  if (!status.device.online) return "offline";
  if (now - status.last_seen > 300_000) return "stale";
  return "online";
}

function boundedStatus(
  value: number | null,
  low: number,
  high: number,
  dangerLow: number,
  dangerHigh: number,
): SensorStatusKey {
  if (value === null) return "unknown";
  if (value < dangerLow || value > dangerHigh) return "danger";
  if (value < low || value > high) return "warning";
  return "safe";
}

function lightStatus(value: number | null, thresholds: ThresholdConfig): SensorStatusKey {
  if (value === null) return "unknown";
  if (value < thresholds.lux_low * 0.5) return "danger";
  if (value < thresholds.lux_low || value > thresholds.lux_high) return "warning";
  return "safe";
}

function valueText(value: number | null, unit: string, integer = false) {
  if (value === null) return "-";
  return `${integer ? formatInteger(value) : formatDecimal(value)} ${unit}`;
}

export function getSensorMetrics(status: RealtimeStatus, thresholds: ThresholdConfig): SensorMetric[] {
  const temp = status.sensors.temperature_c;
  const humidity = status.sensors.humidity_pct;
  const lux = status.sensors.lux;
  const soil = status.sensors.soil_pct;

  const tempStatus = boundedStatus(temp, thresholds.temp_low, thresholds.temp_high, 15, 30);
  const humidityStatus = boundedStatus(humidity, thresholds.rh_low, thresholds.rh_high, 50, 85);
  const light = lightStatus(lux, thresholds);
  const soilStatus = boundedStatus(soil, thresholds.soil_low, thresholds.soil_high, thresholds.soil_low - 10, thresholds.soil_high + 10);

  return [
    {
      id: "temperature",
      label: "Suhu Udara",
      value: valueText(temp, "°C"),
      unit: "°C",
      status: tempStatus,
      meaning:
        tempStatus === "safe"
          ? "Suhu masih sesuai untuk stroberi putih."
          : temp !== null && temp > thresholds.temp_high
            ? "Suhu mulai tinggi. Bunga dan buah bisa terganggu jika berlangsung lama."
            : tempStatus === "unknown"
              ? "Data suhu belum tersedia."
              : "Suhu mulai rendah. Pantau daun dan bunga.",
      action:
        temp !== null && temp > thresholds.temp_high
          ? "Kipas sedang membantu menjaga udara tetap stabil."
          : "Pantau perubahan suhu pada siang dan malam hari.",
      issue: tempStatus === "safe" ? null : temp !== null && temp > thresholds.temp_high ? "suhu udara tinggi" : "suhu udara rendah",
      severity: sensorVisual[tempStatus].severity,
    },
    {
      id: "humidity",
      label: "Kelembapan Udara",
      value: valueText(humidity, "%"),
      unit: "%",
      status: humidityStatus,
      meaning:
        humidityStatus === "safe"
          ? "Kelembapan udara masih dalam batas aman."
          : humidity !== null && humidity > thresholds.rh_high
            ? "Udara terlalu lembap. Risiko jamur meningkat."
            : humidityStatus === "unknown"
              ? "Data kelembapan udara belum tersedia."
              : "Udara mulai kering. Kabut dapat membantu menaikkan kelembapan.",
      action:
        humidity !== null && humidity > thresholds.rh_high
          ? "Kipas sedang membantu menurunkan kelembapan."
          : "Pastikan kabut bekerja saat udara terlalu kering.",
      issue:
        humidityStatus === "safe"
          ? null
          : humidity !== null && humidity > thresholds.rh_high
            ? "udara terlalu lembap"
            : "udara terlalu kering",
      severity: sensorVisual[humidityStatus].severity,
    },
    {
      id: "light",
      label: "Cahaya",
      value: valueText(lux, "lux", true),
      unit: "lux",
      status: light,
      meaning:
        light === "safe"
          ? "Cahaya cukup untuk mendukung pertumbuhan."
          : lux !== null && lux < thresholds.lux_low
            ? "Cahaya kurang. Lampu tanam dapat membantu."
            : light === "unknown"
              ? "Data cahaya belum tersedia."
              : "Cahaya sedang tinggi. Pantau suhu greenhouse.",
      action:
        lux !== null && lux < thresholds.lux_low
          ? "Lampu tanam dapat menjaga tanaman tetap mendapat cahaya cukup."
          : "Pantau cahaya saat cuaca berubah.",
      issue: light === "safe" ? null : lux !== null && lux < thresholds.lux_low ? "cahaya kurang" : "cahaya terlalu tinggi",
      severity: sensorVisual[light].severity,
    },
    {
      id: "soil",
      label: "Kelembapan Media",
      value: valueText(soil, "%"),
      unit: "%",
      status: soilStatus,
      meaning:
        soilStatus === "safe"
          ? "Media tanam cukup lembap."
          : soil !== null && soil < thresholds.soil_low
            ? "Media mulai kering. Pompa akan menyiram bertahap."
            : soilStatus === "unknown"
              ? "Data media tanam belum tersedia."
              : "Media terlalu basah. Akar butuh waktu agar air meresap.",
      action:
        soil !== null && soil < thresholds.soil_low
          ? "Pompa akan menyiram bertahap agar akar tidak tergenang."
          : "Beri waktu agar air meresap sebelum menambah siraman.",
      issue: soilStatus === "safe" ? null : soil !== null && soil < thresholds.soil_low ? "media mulai kering" : "media terlalu basah",
      severity: sensorVisual[soilStatus].severity,
    },
  ];
}

export function getDashboardSummary(
  metrics: SensorMetric[],
  status: RealtimeStatus,
  connection: ConnectionState,
  now: number,
): DashboardSummary {
  if (connection === "offline") {
    return {
      title: `Offline. Data terakhir diterima ${formatTimeAgo(status.last_seen, now)}.`,
      detail: "Kontrol otomatis di perangkat tetap berjalan dengan batas terakhir.",
      action: "Cek daya, WiFi, atau posisi perangkat.",
      tone: "danger",
    };
  }

  if (connection === "stale") {
    return {
      title: `Data lama. Terakhir diterima ${formatTimeAgo(status.last_seen, now)}.`,
      detail: "Kondisi mungkin sudah berubah sejak data terakhir masuk.",
      action: "Cek koneksi jika data tidak berubah beberapa menit lagi.",
      tone: "warning",
    };
  }

  if (status.fault.active_message) {
    return {
      title: "Masalah penting pada perangkat.",
      detail: status.fault.active_message,
      action: "Cek kabel, daya, atau posisi sensor sebelum mengubah batas otomatis.",
      tone: "danger",
    };
  }

  const issues = metrics.filter((metric) => metric.issue).sort((a, b) => b.severity - a.severity);
  if (issues.length > 0) {
    const issueText = issues.map((metric) => metric.issue).slice(0, 2).join(" dan ");
    return {
      title: `Perlu dicek: ${issueText}.`,
      detail: "Kontrol otomatis di perangkat tetap bekerja untuk menjaga greenhouse.",
      action: issues[0].action,
      tone: issues.some((metric) => metric.status === "danger") ? "danger" : "warning",
    };
  }

  return {
    title: "Greenhouse aman. Semua kondisi utama stabil.",
    detail: "Suhu, kelembapan, cahaya, dan media tanam berada dalam batas aman.",
    action: "Tidak ada tindakan mendesak saat ini.",
    tone: "safe",
  };
}

import type {
  ActuatorAvailability,
  ConnectionState,
  CropPhaseInfo,
  DashboardSummary,
  DailyCheckItem,
  FormState,
  GrowthPhaseKey,
  RealtimeStatus,
  SensorMetric,
  SensorStatusKey,
  ThresholdConfig,
} from "../types";
import { daysAfterPlanting, formatDecimal, formatInteger, formatTimeAgo } from "./date";

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
    message: "Data mungkin tidak terbaru. Cek listrik box Snowberry dan koneksi Wi-Fi.",
    action: "Hubungi tim teknis jika data tidak berubah beberapa menit lagi.",
  },
  offline: {
    label: "Offline",
    shortLabel: "Offline",
    className: "tone-danger",
    message: "Data greenhouse belum masuk. Cek listrik box Snowberry dan koneksi Wi-Fi.",
    action: "Hubungi tim teknis jika masalah berlanjut.",
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

export function getGrowthPhaseInfo(plantingDate: string, now = Date.now()): CropPhaseInfo {
  const hst = daysAfterPlanting(plantingDate, now);

  if (hst <= 30) {
    return {
      key: "vegetative",
      hst,
      name: "Vegetatif",
      title: `Fase Vegetatif - Hari ke-${hst} setelah tanam`,
      shortTitle: `Fase Vegetatif - Hari ke-${hst}`,
      description: "Tanaman sedang memperkuat akar, daun, dan crown sebelum masuk masa bunga.",
      focus: "Fokus hari ini: media lembap stabil, daun sehat, dan akar tidak tergenang.",
      risk: "Media terlalu basah dapat membuat akar mudah busuk, terutama jika udara ikut lembap.",
      action: "Cek daun rusak dan pastikan penyiraman tetap bertahap.",
      targets: {
        "Suhu ideal": "18-24 °C",
        "Kelembapan ideal": "60-75%",
        "Cahaya ideal": "12-16 jam per hari",
        "Kelembapan media ideal": "60-70%",
      },
    };
  }

  if (hst <= 60) {
    return {
      key: "flowering",
      hst,
      name: "Berbunga",
      title: `Fase Berbunga - Hari ke-${hst} setelah tanam`,
      shortTitle: `Fase Berbunga - Hari ke-${hst}`,
      description: "Tanaman mulai membentuk bunga. Kelembapan dan cahaya perlu lebih dijaga.",
      focus: "Fokus hari ini: udara tidak terlalu lembap agar penyerbukan tidak terganggu.",
      risk: "Kelembapan tinggi dapat membuat serbuk sari menggumpal dan meningkatkan risiko jamur pada bunga.",
      action: "Pantau kelembapan malam dan bantu sirkulasi udara saat bunga mulai banyak.",
      targets: {
        "Suhu ideal": "15-22 °C",
        "Kelembapan ideal": "50-70%",
        "Cahaya ideal": "20.000-40.000 lux saat siang",
        "Kelembapan media ideal": "55-65%",
      },
    };
  }

  return {
    key: "fruiting",
    hst,
    name: "Berbuah",
    title: `Fase Berbuah - Hari ke-${hst} setelah tanam`,
    shortTitle: `Fase Berbuah - Hari ke-${hst}`,
    description: "Buah mulai membesar. Media perlu stabil agar buah tidak pecah atau terlalu berair.",
    focus: "Fokus hari ini: media tidak terlalu basah dan udara cukup kering untuk mencegah jamur buah.",
    risk: "Media terlalu basah dapat membuat buah pecah, sedangkan udara lembap memudahkan jamur berkembang.",
    action: "Panen buah matang, buang buah rusak, dan hindari penyiraman berlebih.",
    targets: {
      "Suhu ideal": "18-25 °C",
      "Kelembapan ideal": "55-70%",
      "Cahaya ideal": "Cukup untuk pembentukan gula",
      "Kelembapan media ideal": "50-60%",
    },
  };
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

export function getSensorMetrics(status: RealtimeStatus, thresholds: ThresholdConfig, phase: CropPhaseInfo): SensorMetric[] {
  const temp = status.sensors.temperature_c;
  const humidity = status.sensors.humidity_pct;
  const lux = status.sensors.lux;
  const soil = status.sensors.soil_pct;
  const isFlowering = phase.key === "flowering";
  const isFruiting = phase.key === "fruiting";

  const tempStatus = boundedStatus(temp, thresholds.temp_low, thresholds.temp_high, 15, 30);
  const humidityStatus = boundedStatus(humidity, thresholds.rh_low, thresholds.rh_high, 50, 85);
  const light = lightStatus(lux, thresholds);
  const soilStatus = boundedStatus(soil, thresholds.soil_low, thresholds.soil_high, thresholds.soil_low - 10, thresholds.soil_high + 10);

  return [
    {
      id: "temperature",
      label: "Suhu Udara",
      shortLabel: "Suhu",
      value: valueText(temp, "°C"),
      unit: "°C",
      status: tempStatus,
      meaning:
        tempStatus === "safe"
          ? `Suhu masih nyaman untuk fase ${phase.name.toLowerCase()}.`
          : temp !== null && temp > thresholds.temp_high
            ? isFlowering
              ? "Suhu mulai tinggi untuk bunga. Kuncup dan penyerbukan bisa terganggu jika berlangsung lama."
              : isFruiting
                ? "Suhu mulai tinggi. Buah bisa lebih cepat lunak dan rasa manis berkurang."
                : "Suhu mulai tinggi. Daun dan akar bisa stres jika berlangsung lama."
            : tempStatus === "unknown"
              ? "Data suhu belum tersedia."
              : "Suhu mulai rendah. Pertumbuhan bisa melambat jika kondisi ini berlangsung lama.",
      action:
        temp !== null && temp > thresholds.temp_high
          ? "Pastikan kipas dan sirkulasi udara membantu menurunkan panas."
          : "Pantau perubahan suhu pada siang dan malam hari.",
      issue:
        tempStatus === "safe"
          ? null
          : tempStatus === "unknown"
            ? "data suhu belum tersedia"
            : temp !== null && temp > thresholds.temp_high
              ? "suhu udara tinggi"
              : "suhu udara rendah",
      severity: sensorVisual[tempStatus].severity,
    },
    {
      id: "humidity",
      label: "Kelembapan Udara",
      shortLabel: "Udara",
      value: valueText(humidity, "%"),
      unit: "%",
      status: humidityStatus,
      meaning:
        humidityStatus === "safe"
          ? `Kelembapan udara masih aman untuk fase ${phase.name.toLowerCase()}.`
          : humidity !== null && humidity > thresholds.rh_high
            ? isFlowering
              ? "Udara terlalu lembap untuk bunga. Serbuk sari bisa menggumpal dan risiko jamur meningkat."
              : isFruiting
                ? "Udara terlalu lembap. Buah lebih mudah terkena jamur jika kondisi ini lama."
                : "Udara terlalu lembap. Risiko jamur pada daun meningkat."
            : humidityStatus === "unknown"
              ? "Data kelembapan udara belum tersedia."
              : "Udara mulai kering. Pengatur kelembapan dapat membantu menaikkan kelembapan.",
      action:
        humidity !== null && humidity > thresholds.rh_high
          ? "Pastikan kipas membantu sirkulasi dan cek area bunga yang terlalu basah."
          : "Pastikan pengatur kelembapan bekerja saat udara terlalu kering.",
      issue:
        humidityStatus === "safe"
          ? null
          : humidityStatus === "unknown"
            ? "data kelembapan belum tersedia"
            : humidity !== null && humidity > thresholds.rh_high
              ? "kelembapan udara tinggi"
              : "udara terlalu kering",
      severity: sensorVisual[humidityStatus].severity,
    },
    {
      id: "light",
      label: "Cahaya",
      shortLabel: "Cahaya",
      value: valueText(lux, "lux", true),
      unit: "lux",
      status: light,
      meaning:
        light === "safe"
          ? `Cahaya cukup untuk mendukung fase ${phase.name.toLowerCase()}.`
          : lux !== null && lux < thresholds.lux_low
            ? isFlowering
              ? "Cahaya kurang untuk bunga. Tangkai bunga bisa lemah jika kondisi ini sering terjadi."
              : isFruiting
                ? "Cahaya kurang. Pembentukan rasa manis buah bisa melambat."
                : "Cahaya kurang. Pertumbuhan daun bisa melambat."
            : light === "unknown"
              ? "Data cahaya belum tersedia."
              : "Cahaya sedang tinggi. Pantau suhu greenhouse.",
      action:
        lux !== null && lux < thresholds.lux_low
          ? "Lampu tanam dapat menjaga tanaman tetap mendapat cahaya cukup."
          : "Pantau cahaya saat cuaca berubah.",
      issue:
        light === "safe"
          ? null
          : light === "unknown"
            ? "data cahaya belum tersedia"
            : lux !== null && lux < thresholds.lux_low
              ? "cahaya kurang"
              : "cahaya terlalu tinggi",
      severity: sensorVisual[light].severity,
    },
    {
      id: "soil",
      label: "Kelembapan Media",
      shortLabel: "Media",
      value: valueText(soil, "%"),
      unit: "%",
      status: soilStatus,
      meaning:
        soilStatus === "safe"
          ? `Media tanam cukup lembap untuk fase ${phase.name.toLowerCase()}.`
          : soil !== null && soil < thresholds.soil_low
            ? "Media mulai kering. Pompa akan menyiram bertahap."
            : soilStatus === "unknown"
              ? "Data media tanam belum tersedia."
              : isFruiting
                ? "Media terlalu basah. Buah bisa mudah pecah jika air berlebih."
                : "Media terlalu basah. Akar butuh waktu agar air meresap.",
      action:
        soil !== null && soil < thresholds.soil_low
          ? "Pompa akan menyiram bertahap agar akar tidak tergenang."
          : "Beri waktu agar air meresap sebelum menambah siraman.",
      issue:
        soilStatus === "safe"
          ? null
          : soilStatus === "unknown"
            ? "data media belum tersedia"
            : soil !== null && soil < thresholds.soil_low
              ? "media mulai kering"
              : "media terlalu basah",
      severity: sensorVisual[soilStatus].severity,
    },
  ];
}

function joinIssueText(issues: string[]) {
  if (issues.length <= 1) return issues[0] ?? "";
  return `${issues.slice(0, -1).join(", ")} dan ${issues[issues.length - 1]}`;
}

function phaseSensitivityText(phaseKey: GrowthPhaseKey) {
  if (phaseKey === "flowering") {
    return "Fase berbunga lebih sensitif terhadap kelembapan tinggi dan cahaya kurang.";
  }
  if (phaseKey === "fruiting") {
    return "Fase berbuah perlu media stabil agar buah tidak pecah dan tidak mudah berjamur.";
  }
  return "Fase vegetatif perlu media lembap stabil agar akar dan daun kuat.";
}

export function getDailyCheckItems(
  metrics: SensorMetric[],
  status: RealtimeStatus,
  connection: ConnectionState,
  phase: CropPhaseInfo,
  now: number,
): DailyCheckItem[] {
  const checks: DailyCheckItem[] = [];

  if (status.fault.active_message) {
    checks.push({
      id: "fault",
      title: "Cek masalah perangkat",
      body: status.fault.active_message,
      action: "Periksa kabel, daya, atau posisi sensor sebelum mengubah batas otomatis.",
      tone: "danger",
    });
  }

  if (connection === "offline") {
    checks.push({
      id: "offline",
      title: "Sambungkan perangkat dulu",
      body: `Data terakhir diterima ${formatTimeAgo(status.last_seen, now)}. Angka di aplikasi belum bisa dipakai sebagai kondisi terbaru.`,
       action: "Cek listrik box Snowberry dan koneksi Wi-Fi. Hubungi tim teknis jika masalah berlanjut.",
      tone: "danger",
    });
  } else if (connection === "stale") {
    checks.push({
      id: "stale",
      title: "Pastikan data sudah baru",
      body: `Data terakhir masuk ${formatTimeAgo(status.last_seen, now)}. Kondisi greenhouse mungkin sudah berubah.`,
      action: "Tunggu pembaruan data atau cek koneksi perangkat.",
      tone: "warning",
    });
  }

  const issueChecks = metrics
    .filter((metric) => metric.issue)
    .sort((a, b) => b.severity - a.severity)
    .slice(0, connection === "online" ? 2 : 1)
    .map<DailyCheckItem>((metric) => ({
      id: metric.id,
      title: `Cek ${metric.shortLabel.toLowerCase()}`,
      body: metric.meaning,
      action: metric.action,
      tone: metric.status,
    }));

  checks.push(...issueChecks);

  if (checks.length === 0) {
    checks.push({
      id: "safe",
      title: "Tidak ada cek mendesak",
      body: `Kondisi utama masih nyaman untuk stroberi putih di fase ${phase.name.toLowerCase()}.`,
      action: "Lanjut pantau pagi dan sore seperti biasa.",
      tone: "safe",
    });
  }

  if (checks.length < 3) {
    checks.push({
      id: "phase",
      title: phase.shortTitle,
      body: phase.focus,
      action: phase.action,
      tone: "safe",
    });
  }

  return checks.slice(0, 3);
}

export function getDashboardSummary(
  metrics: SensorMetric[],
  status: RealtimeStatus,
  connection: ConnectionState,
  now: number,
  phase: CropPhaseInfo,
): DashboardSummary {
  const checks = getDailyCheckItems(metrics, status, connection, phase, now);
  const badge = phase.shortTitle;

  if (connection === "offline") {
    return {
       title: "Data greenhouse belum masuk.",
       detail: `Data terakhir diterima ${formatTimeAgo(status.last_seen, now)}. Angka di aplikasi belum bisa dipakai sebagai kondisi terbaru.`,
       action: "Cek listrik box Snowberry dan koneksi Wi-Fi. Hubungi tim teknis jika masalah berlanjut.",
       cropContext: "Periksa box Snowberry sebelum mengambil keputusan dari data lama.",
      badge,
      tone: "danger",
      checks,
    };
  }

  if (connection === "stale") {
    return {
      title: "Data lama. Konfirmasi kondisi greenhouse dulu.",
      detail: `Terakhir diterima ${formatTimeAgo(status.last_seen, now)}. Kondisi tanaman mungkin sudah berubah sejak data terakhir masuk.`,
      action: "Tunggu data baru atau cek koneksi perangkat.",
      cropContext: phase.focus,
      badge,
      tone: "warning",
      checks,
    };
  }

  if (status.fault.active_message) {
    return {
      title: "Ada masalah pada perangkat.",
      detail: status.fault.active_message,
      action: "Cek kabel, daya, atau posisi sensor sebelum mengubah batas otomatis.",
      cropContext: "Data sensor bisa kurang akurat sampai masalah perangkat selesai dicek.",
      badge,
      tone: "danger",
      checks,
    };
  }

  const issues = metrics.filter((metric) => metric.issue).sort((a, b) => b.severity - a.severity);
  if (issues.length > 0) {
    const issueText = joinIssueText(issues.map((metric) => metric.issue).slice(0, 2).filter(Boolean) as string[]);
    const hasDanger = issues.some((metric) => metric.status === "danger");
    return {
      title: `${hasDanger ? "Masalah penting" : "Perlu dicek"}: ${issueText}.`,
      detail: phaseSensitivityText(phase.key),
      action: issues[0].action,
      cropContext: phase.focus,
      badge,
      tone: hasDanger ? "danger" : "warning",
      checks,
    };
  }

  return {
    title: "Greenhouse aman untuk stroberi putih.",
    detail: `Semua kondisi utama masih nyaman di fase ${phase.name.toLowerCase()}.`,
    action: "Tidak ada tindakan mendesak saat ini.",
    cropContext: phase.focus,
    badge,
    tone: "safe",
    checks,
  };
}

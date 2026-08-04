import type { RealtimeStatus, ThresholdConfig } from "../types";

// Skala batang sensor: rentang nyaman selalu tergambar di tengah dengan ruang
// di kiri-kanan, supaya nilai di luar batas tetap terlihat posisinya.
// Padding 40% dari lebar batas aman, minimal cukup agar batang tidak mepet.
export type GaugeScale = {
  markerPercent: number;
  bandStartPercent: number;
  bandWidthPercent: number;
  bandLabel: string;
};

export function gaugeScale(
  value: number | null,
  low: number,
  high: number,
  unit: string,
  format: (n: number) => string = (n) => String(Math.round(n)),
): GaugeScale {
  const bandSpan = Math.max(1, high - low);
  const pad = bandSpan * 0.4;
  let min = low - pad;
  let max = high + pad;

  // Nilai di luar skala menarik batas skala agar penanda tetap terlihat.
  if (value !== null) {
    if (value < min) min = value - bandSpan * 0.1;
    if (value > max) max = value + bandSpan * 0.1;
  }

  const span = Math.max(1, max - min);
  const toPercent = (n: number) => ((n - min) / span) * 100;

  return {
    markerPercent: value === null ? 0 : toPercent(value),
    bandStartPercent: toPercent(low),
    bandWidthPercent: (bandSpan / span) * 100,
    bandLabel: `${format(low)}–${format(high)}${unit}`,
  };
}

// Rentang nyaman per sensor diambil dari batas otomatis — tidak ada angka hardcode.
export function sensorScale(
  id: "temperature" | "humidity" | "light" | "soil",
  status: RealtimeStatus,
  thresholds: ThresholdConfig,
): GaugeScale {
  switch (id) {
    case "temperature":
      return gaugeScale(status.sensors.temperature_c, thresholds.temp_low, thresholds.temp_high, "°C");
    case "humidity":
      return gaugeScale(status.sensors.humidity_pct, thresholds.rh_low, thresholds.rh_high, "%");
    case "soil":
      return gaugeScale(status.sensors.soil_pct, thresholds.soil_low, thresholds.soil_high, "%");
    case "light":
      return gaugeScale(status.sensors.lux, thresholds.lux_low, thresholds.lux_high, " lux", (n) =>
        n >= 1000 ? `${Math.round(n / 1000)}rb` : String(Math.round(n)),
      );
  }
}

export function nextSensors(previous, nowMs, scenario, pumpOn) {
  const hour = Number(new Date(nowMs).toLocaleString("en-US", { timeZone: "Asia/Jakarta", hour: "numeric", hour12: false }));
  const dayPhase = Math.sin(((hour - 6) / 12) * Math.PI);
  const daylight = Math.max(0, dayPhase);
  const temperature = clamp(17 + daylight * 10 + noise(0.3), 16, 29);
  const humidity = clamp(92 - daylight * 22 + noise(2), 60, 95);
  const lux = Math.round(clamp(daylight * 18000 + noise(500), 0, 20000));
  const soilDrop = 0.08;
  const soilRise = pumpOn ? 2.2 : 0;
  const soil = clamp((previous?.soil_pct ?? 65) - soilDrop + soilRise, 35, 80);

  if (scenario === "fault-soil") {
    return { temperature_c: round1(temperature), humidity_pct: round1(humidity), lux, soil_pct: null, soil_raw_adc: 4095, psu_voltage: 12.1 };
  }
  if (scenario === "fault-psu") {
    return { temperature_c: round1(temperature), humidity_pct: round1(humidity), lux, soil_pct: round1(soil), soil_raw_adc: soilAdc(soil), psu_voltage: 9.5 };
  }
  return { temperature_c: round1(temperature), humidity_pct: round1(humidity), lux, soil_pct: round1(soil), soil_raw_adc: soilAdc(soil), psu_voltage: round1(12 + noise(0.15)) };
}

export function faultForSensors(sensors, scenario, nvsSynced) {
  if (scenario === "fault-soil" || sensors.soil_pct === null) {
    return { active_code: "SOIL_SENSOR_ERROR", active_message: "Sensor kelembapan media bermasalah.", last_fault_code: "SOIL_SENSOR_ERROR", last_fault_at: Date.now() };
  }
  if (scenario === "fault-psu" || sensors.psu_voltage < 10) {
    return { active_code: "PSU_VOLTAGE_LOW", active_message: "Tegangan listrik alat turun. Periksa adaptor 12V.", last_fault_code: "PSU_VOLTAGE_LOW", last_fault_at: Date.now() };
  }
  if (!nvsSynced) {
    return { active_code: "CONFIG_INVALID", active_message: "Pengaturan batas tidak valid. Memakai pengaturan terakhir.", last_fault_code: "CONFIG_INVALID", last_fault_at: Date.now() };
  }
  return { active_code: null, active_message: null, last_fault_code: null, last_fault_at: null };
}

function soilAdc(soilPct) {
  return Math.round(3000 - (soilPct / 100) * 2000);
}

function noise(amplitude) {
  return (Math.random() * 2 - 1) * amplitude;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

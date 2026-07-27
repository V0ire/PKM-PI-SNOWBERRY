#include "control.h"
#include <Arduino.h>
#include "actuators.h"
#include "config.h"

namespace {
using AK = ActuatorKey;

// State kontrol internal (bukan state fisik pin — itu di actuators.cpp).
struct FanMistState {
  bool fanLatched = false;
  bool mistLatched = false;
} g_fm;

// Pump pulse/soak + dua start dalam rolling 5 jam.
struct PumpState {
  bool watering = false;
  bool pulseOn = false;
  uint32_t phaseStart = 0;
  uint32_t starts[2] = {0, 0};
  uint8_t startCount = 0;
  float soilAtCycleStart = 0;
  uint8_t cyclesNoEffect = 0;
} g_pump;

// Growlight: akumulasi jam terang harian.
struct LightState {
  float onMsToday = 0;
  int lastDay = -1;
  uint32_t lastOnMark = 0;
} g_light;

Reason g_reason[static_cast<int>(AK::COUNT)] = {
  Reason::SAFETY_OFF, Reason::SAFETY_OFF, Reason::SAFETY_OFF,
  Reason::SAFETY_OFF, Reason::SAFETY_OFF, Reason::SAFETY_OFF
};

void setReason(AK k, Reason r) { g_reason[static_cast<int>(k)] = r; }

// Terapkan keinginan ON/OFF + catat reason.
void drive(AK k, bool wantOn, Reason r, uint32_t nowMs) {
  actuators::apply(k, wantOn, nowMs);
  setReason(k, r);
}

void safetyOff(AK k, uint32_t nowMs, Reason r) {
  actuators::forceOff(k, nowMs);
  setReason(k, r);
}

void driveHumidifier(bool wantOn, Reason r, uint32_t nowMs) {
  drive(AK::MIST, wantOn, r, nowMs);
  drive(AK::FAN, wantOn, r, nowMs);
  drive(AK::MIST_2, wantOn, r, nowMs);
  drive(AK::FAN_2, wantOn, r, nowMs);
}

void safetyOffHumidifier(uint32_t nowMs, Reason r) {
  safetyOff(AK::MIST, nowMs, r);
  safetyOff(AK::FAN, nowMs, r);
  safetyOff(AK::MIST_2, nowMs, r);
  safetyOff(AK::FAN_2, nowMs, r);
}
}  // namespace

namespace control {

bool validate(const Thresholds& t) {
  if (!(t.temp_low < t.temp_high)) return false;
  if (!(t.rh_low < t.rh_high)) return false;
  if (!(t.soil_low < t.soil_high)) return false;
  if (!(t.lux_low < t.lux_high)) return false;
  if (!(t.pump_pulse_ms <= t.soak_period_ms)) return false;
  if (t.rh_low < 0 || t.rh_high > 100) return false;
  if (t.soil_low < 0 || t.soil_high > 100) return false;
  if (t.light_window_start >= t.light_window_end) return false;
  if (t.light_window_end > 24) return false;
  return true;
}

bool soilPercent(const Thresholds& t, uint16_t rawAdc, float& outPct) {
  if (t.soil_adc_dry == 0 || t.soil_adc_wet == 0) return false;  // belum kalibrasi
  if (rawAdc == 0 || rawAdc >= 4095) return false;               // pinned = lepas/short
  // Capacitive: ADC tinggi = kering, ADC rendah = basah.
  float span = static_cast<float>(t.soil_adc_dry) - static_cast<float>(t.soil_adc_wet);
  if (span == 0) return false;
  float pct = (static_cast<float>(t.soil_adc_dry) - rawAdc) / span * 100.0f;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  outPct = pct;
  return true;
}

// ---- Fan + Mist dengan resolusi konflik ---------------------------------
static void controlFanMist(const Thresholds& t, const SensorReading& s, uint32_t nowMs) {
  if (!s.rh_valid) {
    safetyOffHumidifier(nowMs, Reason::SENSOR_INVALID);
    g_fm = {};
    return;
  }
  bool wantOn = g_fm.fanLatched || g_fm.mistLatched;
  Reason reason = wantOn ? Reason::HUMIDITY_LOW : Reason::HUMIDITY_OK;
  if (s.humidity_pct <= t.rh_low) {
    wantOn = true;
    reason = Reason::HUMIDITY_LOW;
  } else if (s.humidity_pct >= t.rh_high) {
    wantOn = false;
    reason = Reason::HUMIDITY_HIGH;
  }
  g_fm.fanLatched = wantOn;
  g_fm.mistLatched = wantOn;
  driveHumidifier(wantOn, reason, nowMs);
}

// ---- Pump pulse/soak + proteksi ------------------------------------------
static Fault controlPump(const Thresholds& t, const SensorReading& s, uint32_t nowMs) {
  if (!s.soil_valid) {
    safetyOff(AK::PUMP, nowMs, Reason::SENSOR_INVALID);
    g_pump.watering = false;
    g_pump.pulseOn = false;
    return Fault::NONE;
  }

  // Buang start yang lebih tua dari pump_window_ms (5 jam)
  while (g_pump.startCount > 0 && (nowMs - g_pump.starts[0] >= t.pump_window_ms)) {
    g_pump.starts[0] = g_pump.starts[1];
    g_pump.startCount--;
  }

  Fault fault = Fault::NONE;
  const bool needWater = s.soil_pct <= t.soil_low;
  const bool satisfied = s.soil_pct >= t.soil_high;
  if (g_pump.startCount >= t.pump_start_limit && !g_pump.watering) {
    safetyOff(AK::PUMP, nowMs, Reason::SOIL_OK);
    if (needWater) fault = Fault::PUMP_MAX_CYCLE_REACHED;
    return fault;
  }

  if (!g_pump.watering) {
    if (needWater) {
      g_pump.watering = true;
      g_pump.pulseOn = true;
      g_pump.phaseStart = nowMs;
      g_pump.soilAtCycleStart = s.soil_pct;
      g_pump.starts[g_pump.startCount++] = nowMs;
    } else {
      safetyOff(AK::PUMP, nowMs, Reason::SOIL_OK);
      return fault;
    }
  }

  if (satisfied) {
    safetyOff(AK::PUMP, nowMs, Reason::SOIL_OK);
    g_pump.watering = false;
    g_pump.pulseOn = false;
    g_pump.cyclesNoEffect = 0;
    return fault;
  }

  if (g_pump.pulseOn) {
    drive(AK::PUMP, true, Reason::SOIL_LOW, nowMs);
    if (nowMs - g_pump.phaseStart >= t.pump_pulse_ms) {
      g_pump.pulseOn = false;
      g_pump.phaseStart = nowMs;
      safetyOff(AK::PUMP, nowMs, Reason::SOIL_LOW);
      if (s.soil_pct - g_pump.soilAtCycleStart < 1.0f) {
        if (++g_pump.cyclesNoEffect >= 3) fault = Fault::PUMP_NO_EFFECT;
      } else {
        g_pump.cyclesNoEffect = 0;
      }
      g_pump.soilAtCycleStart = s.soil_pct;
    }
  } else {
    safetyOff(AK::PUMP, nowMs, Reason::SOIL_LOW);
    if (nowMs - g_pump.phaseStart >= t.soak_period_ms) {
      if (g_pump.startCount < t.pump_start_limit) {
        g_pump.pulseOn = true;
        g_pump.phaseStart = nowMs;
        g_pump.starts[g_pump.startCount++] = nowMs;
      } else {
        g_pump.watering = false;
      }
    }
  }
  return fault;
}

// ---- Growlight lux + photoperiod window ----------------------------------
static void controlGrowlight(const Thresholds& t, const SensorReading& s,
                             const TimeCtx& time, uint32_t nowMs) {
  if (!s.lux_valid) {
    safetyOff(AK::GROWLIGHT, nowMs, Reason::SENSOR_INVALID);
    return;
  }

  // Akumulasi jam terang harian.
  if (actuators::isOn(AK::GROWLIGHT) && g_light.lastOnMark != 0) {
    g_light.onMsToday += (nowMs - g_light.lastOnMark);
  }
  g_light.lastOnMark = nowMs;
  if (time.synced) {
    int day = static_cast<int>(time.epoch_ms / 86400000LL);
    if (day != g_light.lastDay) { g_light.lastDay = day; g_light.onMsToday = 0; }
  }

  const bool darkEnough = s.lux <= t.lux_low;
  const bool brightEnough = s.lux >= t.lux_high;
  const float maxMs = t.max_light_hours_per_day * 3600000.0f;
  const bool overDaily = g_light.onMsToday >= maxMs;

  bool inWindow;
  if (time.synced) {
    inWindow = (time.hour >= t.light_window_start && time.hour < t.light_window_end);
  } else {
    // TIME_NOT_SYNCED: mode konservatif — hanya izinkan jika sangat gelap,
    // dan tetap hormati batas harian. Tidak "hari panjang" tak sengaja.
    inWindow = true;
  }

  bool want;
  Reason reason;
  if (brightEnough || overDaily || !inWindow) {
    want = false;
    reason = overDaily || !inWindow ? Reason::PHOTOPERIOD_LIMIT : Reason::LUX_OK;
  } else if (darkEnough) {
    want = true;
    reason = time.synced ? Reason::LUX_LOW : Reason::PHOTOPERIOD_LIMIT;
  } else {
    want = actuators::isOn(AK::GROWLIGHT);  // hysteresis: tahan state
    reason = want ? Reason::LUX_LOW : Reason::LUX_OK;
  }
  drive(AK::GROWLIGHT, want, reason, nowMs);
}

// ---- Manual override (prioritas di atas auto, di bawah safety) ----------
static bool applyManual(const ManualCommand& cmd, const SensorReading& s,
                        const TimeCtx& time, uint32_t nowMs, Fault& outFault) {
  if (!cmd.valid || cmd.mode != Mode::MANUAL) return false;

  uint32_t active_duration = cmd.duration_ms;
  if (active_duration == 0 || active_duration > timing::MANUAL_MAX_MS) {
    active_duration = timing::MANUAL_MAX_MS;
  }

  // Expiry: pakai epoch jika synced, else fallback durasi via millis().
  bool expired = false;
  if (time.synced && cmd.manual_until_epoch > 0) {
    expired = (time.epoch_ms >= cmd.manual_until_epoch);
  } else {
    expired = (nowMs - cmd.received_at_ms >= active_duration);
  }

  if (expired) { outFault = Fault::COMMAND_EXPIRED; return false; }

  // Hard safety tetap menang: pump manual ON dilarang jika soil invalid.
  if (cmd.key == AK::PUMP && cmd.state && !s.soil_valid) {
    safetyOff(AK::PUMP, nowMs, Reason::SAFETY_OFF);
    outFault = Fault::COMMAND_REJECTED_SAFETY;
    return true;  // manual "ditangani" (ditolak), auto tidak jalan untuk pump
  }

  drive(cmd.key, cmd.state, Reason::MANUAL_OVERRIDE, nowMs);
  return true;
}

void step(const Thresholds& t, const SensorReading& s, const ManualCommand& cmd,
          const TimeCtx& time, uint32_t nowMs, Fault& outFault) {
  outFault = Fault::NONE;

  // Manual override berlaku per-aktuator. Jika command menyasar 1 aktuator,
  // aktuator lain tetap AUTO.
  bool manualHandled = false;
  AK manualKey = cmd.key;
  if (cmd.valid && cmd.mode == Mode::MANUAL) {
    manualHandled = applyManual(cmd, s, time, nowMs, outFault);
  }

  auto isManual = [&](AK k) { return manualHandled && manualKey == k; };

  // AUTO untuk aktuator yang tidak sedang manual.
  if (!isManual(AK::FAN) && !isManual(AK::MIST) && !isManual(AK::FAN_2) && !isManual(AK::MIST_2)) {
    controlFanMist(t, s, nowMs);
  }
  if (!isManual(AK::PUMP)) {
    Fault pf = controlPump(t, s, nowMs);
    if (pf != Fault::NONE && outFault == Fault::NONE) outFault = pf;
  }
  if (!isManual(AK::GROWLIGHT)) {
    controlGrowlight(t, s, time, nowMs);
  }
}

Reason reasonOf(ActuatorKey key) { return g_reason[static_cast<int>(key)]; }

}  // namespace control

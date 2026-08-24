#include "control.h"
#include <Arduino.h>
#include <stddef.h>

#include "actuators.h"
#include "config.h"

namespace {
using AK = ActuatorKey;

struct PumpState {
  bool pulse_on = false;
  bool conservative_lock = false;
  uint32_t pulse_started_ms = 0;
  uint32_t soak_until_ms = 0;
  uint32_t last_manual_token = 0;
  bool manual_token_seen = false;
  control::PumpStartRecord starts[2];
  size_t start_count = 0;
} g_pump;

bool defaultReserve(const control::PumpStartRecord&) { return false; }
control::PumpStartReserver g_reserve = defaultReserve;
bool g_humidifier_latched = false;
bool g_light_latched = false;
Reason g_reason[static_cast<size_t>(AK::COUNT)] = {};

void reason(AK key, Reason value) { g_reason[static_cast<size_t>(key)] = value; }
bool fresh(bool valid, uint32_t sampled, uint32_t now) {
  return valid && sampled != 0 && now - sampled <= timing::SENSOR_STALE_MS;
}
bool expired(const control::ManualCommand& cmd, const control::TimeCtx& time, uint32_t now) {
  uint32_t duration = cmd.duration_ms;
  if (duration == 0 || duration > timing::MANUAL_MAX_MS) duration = timing::MANUAL_MAX_MS;
  return time.synced && cmd.manual_until_epoch > 0
      ? time.epoch_ms >= cmd.manual_until_epoch
      : now - cmd.received_at_ms >= duration;
}
void off(AK key, uint32_t now, Reason why) {
  actuators::forceOff(key, now);
  reason(key, why);
}
void drive(AK key, bool on, uint32_t now, Reason why) {
  actuators::apply(key, on, now);
  reason(key, why);
}
void humidifierOff(uint32_t now, Reason why) {
  actuators::forceOffHumidifierGroup(now);
  reason(AK::MIST, why); reason(AK::FAN, why);
  reason(AK::MIST_2, why); reason(AK::FAN_2, why);
  g_humidifier_latched = false;
}
void humidifierDrive(bool on, uint32_t now, Reason why) {
  actuators::applyHumidifierGroup(on, now);
  reason(AK::MIST, why); reason(AK::FAN, why);
  reason(AK::MIST_2, why); reason(AK::FAN_2, why);
  g_humidifier_latched = on;
}
void pruneStarts(const control::TimeCtx& time, uint32_t now) {
  if (!time.synced) return;
  size_t kept = 0;
  for (size_t i = 0; i < g_pump.start_count; ++i) {
    const auto& start = g_pump.starts[i];
    const bool recent = start.epoch_ms > 0
        ? time.epoch_ms - start.epoch_ms < 18000000LL
        : now - start.boot_ms < 18000000UL;
    if (recent && kept < 2) g_pump.starts[kept++] = start;
  }
  g_pump.start_count = kept;
}
bool startPump(const control::TimeCtx& time, uint32_t now) {
  pruneStarts(time, now);
  if (g_pump.conservative_lock || g_pump.start_count >= 2 ||
      static_cast<int32_t>(now - g_pump.soak_until_ms) < 0) return false;
  control::PumpStartRecord record;
  record.epoch_ms = time.synced ? time.epoch_ms : 0;
  record.boot_ms = now;
  if (!g_reserve(record)) return false;
  g_pump.starts[g_pump.start_count++] = record;
  g_pump.pulse_on = true;
  g_pump.pulse_started_ms = now;
  actuators::apply(AK::PUMP, true, now);
  reason(AK::PUMP, Reason::SOIL_LOW);
  return true;
}
}

namespace control {
bool validate(const Thresholds& t) {
  return t.temp_low < t.temp_high && t.rh_low >= 0 && t.rh_low < t.rh_high && t.rh_high <= 100 &&
         t.soil_low >= 0 && t.soil_low < t.soil_high && t.soil_high <= 100 &&
         t.lux_low >= 0 && t.lux_low < t.lux_high &&
         t.pump_start_limit == 2 && t.pump_pulse_ms == 45000 &&
       t.soak_period_ms == 900000 && t.pump_window_ms == 18000000 &&
       t.light_window_start == 18 && t.light_window_end == 20 &&
         t.soil_adc_dry > t.soil_adc_wet && t.soil_adc_dry <= 4095;
}

bool soilPercent(const Thresholds& t, uint16_t raw, float& out) {
  if (t.soil_adc_dry <= t.soil_adc_wet || raw == 0 || raw >= 4095) return false;
  const float span = static_cast<float>(t.soil_adc_dry - t.soil_adc_wet);
  out = (static_cast<float>(t.soil_adc_dry) - raw) * 100.0f / span;
  if (out < 0) out = 0;
  if (out > 100) out = 100;
  return true;
}

void setPumpStartReserver(PumpStartReserver reserver) { g_reserve = reserver ? reserver : defaultReserve; }

void restorePumpSafety(const PumpStartRecord* records, size_t count,
                       bool trustworthyTime, int64_t nowEpochMs) {
  g_pump = {};
  if (!trustworthyTime) { g_pump.conservative_lock = true; return; }
  int64_t latestEpochMs = 0;
  for (size_t i = 0; records && i < count && g_pump.start_count < 2; ++i) {
    // A start reserved without trustworthy time cannot be aged safely. Keep it
    // charged and locked rather than letting a later NTP sync erase it.
    if (records[i].epoch_ms == 0) {
      g_pump.starts[g_pump.start_count++] = records[i];
      g_pump.conservative_lock = true;
    } else if (nowEpochMs - records[i].epoch_ms < 18000000LL) {
      g_pump.starts[g_pump.start_count++] = records[i];
      if (records[i].epoch_ms > latestEpochMs) latestEpochMs = records[i].epoch_ms;
    }
  }
  if (!g_pump.conservative_lock && latestEpochMs > 0) {
    const int64_t elapsed = nowEpochMs - latestEpochMs;
    if (elapsed < 900000LL) g_pump.soak_until_ms = millis() + static_cast<uint32_t>(900000LL - elapsed);
  }
}

void resetForTest() {
  g_pump = {};
  g_humidifier_latched = false;
  g_light_latched = false;
  for (auto& r : g_reason) r = Reason::SAFETY_OFF;
}

static void humidifier(const Thresholds& t, const SensorReading& s,
                       const ManualCommand& cmd, const TimeCtx& time,
                       uint32_t now, Fault& fault) {
  const bool safe = fresh(s.rh_valid, s.rh_sample_ms, now) &&
                    s.humidity_pct >= 0 && s.humidity_pct <= 100;
  const bool manual = cmd.valid && cmd.mode == Mode::MANUAL && cmd.target == ManualTarget::HUMIDIFIER;
  if (!safe) {
    humidifierOff(now, Reason::SENSOR_INVALID);
    if (manual && cmd.state) fault = Fault::COMMAND_REJECTED_SAFETY;
    return;
  }
  if (manual && !expired(cmd, time, now)) {
    if (cmd.state) humidifierDrive(true, now, Reason::MANUAL_OVERRIDE);
    else humidifierOff(now, Reason::MANUAL_OVERRIDE);
    return;
  }
  if (manual && expired(cmd, time, now)) fault = Fault::COMMAND_EXPIRED;
  bool want = g_humidifier_latched;
  if (s.humidity_pct <= t.rh_low) want = true;
  else if (s.humidity_pct >= t.rh_high) want = false;
  humidifierDrive(want, now, want ? Reason::HUMIDITY_LOW : Reason::HUMIDITY_OK);
}

static Fault pump(const Thresholds& t, const SensorReading& s,
                  const ManualCommand& cmd, const TimeCtx& time, uint32_t now) {
  (void)t;
  const bool safe = fresh(s.soil_valid, s.soil_sample_ms, now) &&
                    s.soil_raw_adc > 0 && s.soil_raw_adc < 4095;
  if (!safe) {
    off(AK::PUMP, now, Reason::SENSOR_INVALID);
    if (g_pump.pulse_on) g_pump.soak_until_ms = now + 900000;
    g_pump.pulse_on = false;
    return cmd.valid && cmd.target == ManualTarget::PUMP && cmd.state
        ? Fault::COMMAND_REJECTED_SAFETY : Fault::NONE;
  }
  if (g_pump.pulse_on) {
    if (now - g_pump.pulse_started_ms >= 45000) {
      off(AK::PUMP, now, Reason::SOIL_LOW);
      g_pump.pulse_on = false;
      g_pump.soak_until_ms = now + 900000;
    } else {
      drive(AK::PUMP, true, now, Reason::SOIL_LOW);
    }
    return Fault::NONE;
  }
  const bool manual = cmd.valid && cmd.mode == Mode::MANUAL && cmd.target == ManualTarget::PUMP;
  if (manual && expired(cmd, time, now)) return Fault::COMMAND_EXPIRED;
  if (manual && !cmd.state) { off(AK::PUMP, now, Reason::MANUAL_OVERRIDE); return Fault::NONE; }
  const bool newManualRequest = manual && cmd.state &&
      (!g_pump.manual_token_seen || cmd.received_at_ms != g_pump.last_manual_token);
  if (newManualRequest) {
    g_pump.last_manual_token = cmd.received_at_ms;
    g_pump.manual_token_seen = true;
  }
  // Siram otomatis hanya pada jendela sore (15:00-18:00 WIB). Di luar jendela
  // media keros tetap terpantau (reason water_window_wait) tanpa memotong
  // pulse yang sedang berjalan. Kontrol manual tidak terpengaruh jendela.
  const bool soilDry = s.soil_pct <= t.soil_low;
  const bool inWaterWindow = time.synced &&
      time.hour >= schedule::WATER_WINDOW_START_HOUR &&
      time.hour < schedule::WATER_WINDOW_END_HOUR;
  const bool autoRequest = !manual && soilDry && inWaterWindow;
  if (newManualRequest || autoRequest) {
    if (!startPump(time, now)) {
      off(AK::PUMP, now, Reason::SAFETY_OFF);
      return Fault::PUMP_MAX_CYCLE_REACHED;
    }
  } else if (!manual && soilDry) {
    off(AK::PUMP, now, Reason::WATER_WINDOW_WAIT);
  } else off(AK::PUMP, now, Reason::SOIL_OK);
  return Fault::NONE;
}

static void growlight(const Thresholds& t, const SensorReading& s,
                      const ManualCommand& cmd, const TimeCtx& time,
                      uint32_t now, Fault& fault) {
  const bool safe = time.synced && fresh(s.lux_valid, s.lux_sample_ms, now) &&
                    s.lux >= 0 && s.lux <= 120000;
  const bool manual = cmd.valid && cmd.mode == Mode::MANUAL && cmd.target == ManualTarget::GROWLIGHT;
  if (!safe) {
    off(AK::GROWLIGHT, now, !time.synced ? Reason::PHOTOPERIOD_LIMIT : Reason::SENSOR_INVALID);
    if (manual && cmd.state) fault = Fault::COMMAND_REJECTED_SAFETY;
    return;
  }
  if (manual && !expired(cmd, time, now)) {
    drive(AK::GROWLIGHT, cmd.state, now, Reason::MANUAL_OVERRIDE);
    g_light_latched = cmd.state;
    return;
  }
  if (manual && expired(cmd, time, now)) fault = Fault::COMMAND_EXPIRED;
  // Lampu otomatis hanya dalam jendela 18:00-20:00 WIB (keputusan produk).
  // Latch direset di luar jendela agar saat jendela terbuka keputusan dinilai
  // dari lux saat itu, bukan sisa latch kemarin.
  const bool inLightWindow = time.hour >= t.light_window_start &&
                             time.hour < t.light_window_end;
  if (!inLightWindow) {
    g_light_latched = false;
    off(AK::GROWLIGHT, now, Reason::PHOTOPERIOD_LIMIT);
    return;
  }
  if (s.lux <= t.lux_low) g_light_latched = true;
  else if (s.lux >= t.lux_high) g_light_latched = false;
  drive(AK::GROWLIGHT, g_light_latched, now, g_light_latched ? Reason::LUX_LOW : Reason::LUX_OK);
}

void step(const Thresholds& t, const SensorReading& s, const ManualCommand& cmd,
          const TimeCtx& time, uint32_t now, Fault& outFault) {
  outFault = Fault::NONE;
  if (cmd.valid && cmd.target == ManualTarget::UNKNOWN) outFault = Fault::COMMAND_REJECTED_SAFETY;
  humidifier(t, s, cmd, time, now, outFault);
  const Fault pumpFault = pump(t, s, cmd, time, now);
  if (outFault == Fault::NONE && pumpFault != Fault::NONE) outFault = pumpFault;
  growlight(t, s, cmd, time, now, outFault);
}

Reason reasonOf(ActuatorKey key) { return g_reason[static_cast<size_t>(key)]; }
}
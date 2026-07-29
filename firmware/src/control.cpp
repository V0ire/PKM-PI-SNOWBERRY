#include "control.h"
#include <Arduino.h>
#include "actuators.h"
#include "config.h"
#include "sensor_health.h"

namespace {
using AK = ActuatorKey;

// State kontrol internal (bukan state fisik pin — itu di actuators.cpp).
struct FanMistState {
  bool fanLatched = false;
  bool mistLatched = false;
} g_fm;

// Pump pulse/soak + dua start dalam rolling 5 jam.
struct PumpState {
  bool pulseOn = false;
  uint32_t phaseStart = 0;
  uint32_t starts[2] = {0, 0};
  int64_t startsEpoch[2] = {0, 0};
  uint8_t startCount = 0;
  float soilAtCycleStart = 0;
  uint8_t cyclesNoEffect = 0;
  uint32_t lastManualRequest = 0;
  bool restoredLock = false;
  uint32_t restoredAt = 0;
  bool persistFailed = false;
  uint32_t lastStop = 0;
} g_pump;

control::PumpHistorySaver g_saveHistory = nullptr;

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

void safetyOffHumidifier(uint32_t nowMs, Reason r);

void driveHumidifier(bool wantOn, Reason r, uint32_t nowMs) {
  if (!wantOn) {
    safetyOffHumidifier(nowMs,r);
    return;
  }
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

bool validFresh(bool valid, uint32_t updated, uint32_t now) {
  return valid && sensor_health::fresh(now, updated, timing::SENSOR_STALE_MS);
}

control::PumpHistory historySnapshot(bool synced) {
  control::PumpHistory h;
  h.count = g_pump.startCount;
  h.requires_conservative_lock = !synced;
  for (uint8_t i=0; i<h.count; ++i) h.starts_epoch_ms[i] = g_pump.startsEpoch[i];
  h.checksum=control::pumpHistoryChecksum(h);
  return h;
}

void dropOldStarts(const Thresholds& t, const control::TimeCtx& time, uint32_t nowMs) {
  while (g_pump.startCount) {
    bool old = false;
    if (time.synced && g_pump.startsEpoch[0] > 0)
      old = time.epoch_ms - g_pump.startsEpoch[0] >= t.pump_window_ms;
    else
      old = nowMs - g_pump.starts[0] >= t.pump_window_ms;
    if (!old) break;
    g_pump.starts[0]=g_pump.starts[1];
    g_pump.startsEpoch[0]=g_pump.startsEpoch[1];
    --g_pump.startCount;
  }
  if (g_pump.restoredLock && nowMs-g_pump.restoredAt >= t.pump_window_ms) {
    g_pump.restoredLock=false;
    g_pump.startCount=0;
  }
}

bool reserveStart(const Thresholds& t, const control::TimeCtx& time, uint32_t nowMs) {
  dropOldStarts(t,time,nowMs);
  if (g_pump.restoredLock || g_pump.startCount >= t.pump_start_limit) return false;
  const uint8_t i=g_pump.startCount;
  g_pump.starts[i]=nowMs;
  g_pump.startsEpoch[i]=time.synced ? time.epoch_ms : 0;
  ++g_pump.startCount;
  if (g_saveHistory && !g_saveHistory(historySnapshot(time.synced))) {
    --g_pump.startCount;
    g_pump.persistFailed=true;
    return false;
  }
  g_pump.pulseOn=true;
  g_pump.phaseStart=nowMs;
  return true;
}
}  // namespace

namespace control {

uint32_t pumpHistoryChecksum(const PumpHistory& h) {
  uint32_t value=2166136261u;
  auto add=[&](uint64_t n) {
    for (uint8_t i=0;i<8;++i) { value^=static_cast<uint8_t>(n>>(i*8)); value*=16777619u; }
  };
  add(h.magic); add(h.version); add(static_cast<uint64_t>(h.starts_epoch_ms[0]));
  add(static_cast<uint64_t>(h.starts_epoch_ms[1])); add(h.count);
  add(h.requires_conservative_lock ? 1 : 0);
  return value;
}

void setPumpHistorySaver(PumpHistorySaver saver) { g_saveHistory=saver; }
void restorePumpHistory(const PumpHistory& h, uint32_t nowMs) {
  g_pump={};
  if (h.magic != 0x50484D31 || h.version != 1 || h.count > 2 ||
      (h.count == 0 && !h.requires_conservative_lock) ||
      (h.count > 0 && h.starts_epoch_ms[0] <= 0) ||
      (h.count == 2 && (h.starts_epoch_ms[1] <= 0 || h.starts_epoch_ms[0] > h.starts_epoch_ms[1])) ||
      h.checksum != pumpHistoryChecksum(h)) {
    g_pump.restoredLock=true;
    g_pump.restoredAt=nowMs;
    return;
  }
  g_pump.startCount=h.count > 2 ? 2 : h.count;
  for (uint8_t i=0;i<g_pump.startCount;++i) g_pump.startsEpoch[i]=h.starts_epoch_ms[i];
  g_pump.restoredLock=h.requires_conservative_lock;
  g_pump.restoredAt=nowMs;
}
PumpHistory pumpHistory() { return historySnapshot(false); }
void resetForTest() { g_pump={}; g_fm={}; g_light={}; }

bool validate(const Thresholds& t) {
  if (!(t.temp_low < t.temp_high)) return false;
  if (!(t.rh_low < t.rh_high)) return false;
  if (!(t.soil_low < t.soil_high)) return false;
  if (!(t.lux_low < t.lux_high)) return false;
  if (t.pump_pulse_ms != 10000 || t.soak_period_ms != 600000) return false;
  if (t.pump_start_limit != 2 || t.pump_window_ms != 18000000) return false;
  if (t.rh_low < 0 || t.rh_high > 100) return false;
  if (t.soil_low < 0 || t.soil_high > 100) return false;
  if (t.light_window_start >= t.light_window_end) return false;
  if (t.light_window_end > 24) return false;
  if (t.max_light_hours_per_day <= 0 || t.max_light_hours_per_day > 24) return false;
  return true;
}

bool soilPercent(const Thresholds& t, uint16_t rawAdc, float& outPct) {
  if (t.soil_adc_dry == 0 || t.soil_adc_wet == 0) return false;  // belum kalibrasi
  if (rawAdc == 0 || rawAdc >= 4095) return false;               // pinned = lepas/short
  const uint16_t low = t.soil_adc_wet < t.soil_adc_dry ? t.soil_adc_wet : t.soil_adc_dry;
  const uint16_t high = t.soil_adc_wet > t.soil_adc_dry ? t.soil_adc_wet : t.soil_adc_dry;
  if (rawAdc < low || rawAdc > high) return false;
  // Capacitive: ADC tinggi = kering, ADC rendah = basah.
  float span = static_cast<float>(t.soil_adc_dry) - static_cast<float>(t.soil_adc_wet);
  if (span == 0) return false;
  float pct = (static_cast<float>(t.soil_adc_dry) - rawAdc) / span * 100.0f;
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  outPct = pct;
  return true;
}

int32_t jakartaDayId(int64_t epochMs) {
  return static_cast<int32_t>((epochMs + 7LL*3600000LL) / 86400000LL);
}

// ---- Fan + Mist dengan resolusi konflik ---------------------------------
static void controlFanMist(const Thresholds& t, const SensorReading& s, uint32_t nowMs) {
  if (!validFresh(s.rh_valid, s.rh_updated_ms, nowMs)) {
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
static Fault controlPump(const Thresholds& t, const SensorReading& s,
                         const TimeCtx& time, uint32_t nowMs, bool request) {
  if (!validFresh(s.soil_valid, s.soil_updated_ms, nowMs)) {
    safetyOff(AK::PUMP, nowMs, Reason::SENSOR_INVALID);
    if (g_pump.pulseOn) g_pump.lastStop=nowMs;
    g_pump.pulseOn = false;
    return request ? Fault::COMMAND_REJECTED_SAFETY : Fault::NONE;
  }

  dropOldStarts(t,time,nowMs);
  if (g_pump.pulseOn) {
    if (nowMs - g_pump.phaseStart >= t.pump_pulse_ms) {
      g_pump.pulseOn=false;
      g_pump.lastStop=nowMs;
      safetyOff(AK::PUMP,nowMs,Reason::SOIL_LOW);
    } else {
      drive(AK::PUMP,true,Reason::SOIL_LOW,nowMs);
    }
    return Fault::NONE;
  }

  safetyOff(AK::PUMP,nowMs,Reason::SOIL_OK);
  const bool autoRequest = s.soil_pct <= t.soil_low;
  if (!request && !autoRequest) return Fault::NONE;
  if (s.soil_pct >= t.soil_high && !request) return Fault::NONE;
  if (g_pump.restoredLock || g_pump.startCount >= t.pump_start_limit)
    return Fault::PUMP_MAX_CYCLE_REACHED;
  if (g_pump.lastStop && nowMs-g_pump.lastStop < t.soak_period_ms)
    return request ? Fault::COMMAND_REJECTED_SAFETY : Fault::NONE;
  if (!g_pump.lastStop && g_pump.startCount &&
      nowMs-g_pump.starts[g_pump.startCount-1] < t.soak_period_ms)
    return request ? Fault::COMMAND_REJECTED_SAFETY : Fault::NONE;
  if (!reserveStart(t,time,nowMs))
    return g_pump.persistFailed ? Fault::NVS_ERROR : Fault::PUMP_MAX_CYCLE_REACHED;
  g_pump.soilAtCycleStart=s.soil_pct;
  drive(AK::PUMP,true,request ? Reason::MANUAL_OVERRIDE : Reason::SOIL_LOW,nowMs);
  return Fault::NONE;
}

// ---- Growlight lux + photoperiod window ----------------------------------
static void controlGrowlight(const Thresholds& t, const SensorReading& s,
                             const TimeCtx& time, uint32_t nowMs) {
  if (!validFresh(s.lux_valid, s.lux_updated_ms, nowMs) || !time.synced) {
    safetyOff(AK::GROWLIGHT, nowMs, Reason::SENSOR_INVALID);
    return;
  }

  // Akumulasi jam terang harian.
  if (actuators::isOn(AK::GROWLIGHT) && g_light.lastOnMark != 0) {
    g_light.onMsToday += (nowMs - g_light.lastOnMark);
  }
  g_light.lastOnMark = nowMs;
  if (time.synced) {
    const int day = jakartaDayId(time.epoch_ms);
    if (day != g_light.lastDay) { g_light.lastDay = day; g_light.onMsToday = 0; }
  }

  const bool darkEnough = s.lux <= t.lux_low;
  const bool brightEnough = s.lux >= t.lux_high;
  const float maxMs = t.max_light_hours_per_day * 3600000.0f;
  const bool overDaily = g_light.onMsToday >= maxMs;

  const bool inWindow = (time.hour >= t.light_window_start && time.hour < t.light_window_end);

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

  if (cmd.key == AK::PUMP) return false;

  const bool humidifier = cmd.key == AK::MIST || cmd.key == AK::FAN ||
                          cmd.key == AK::MIST_2 || cmd.key == AK::FAN_2;
  if (humidifier) {
    if (cmd.state && !validFresh(s.rh_valid,s.rh_updated_ms,nowMs)) {
      safetyOffHumidifier(nowMs,Reason::SENSOR_INVALID);
      outFault=Fault::COMMAND_REJECTED_SAFETY;
    } else {
      driveHumidifier(cmd.state,Reason::MANUAL_OVERRIDE,nowMs);
    }
    return true;
  }

  if (cmd.key == AK::GROWLIGHT && cmd.state &&
      (!validFresh(s.lux_valid,s.lux_updated_ms,nowMs) || !time.synced)) {
    safetyOff(AK::GROWLIGHT,nowMs,Reason::SENSOR_INVALID);
    outFault=Fault::COMMAND_REJECTED_SAFETY;
    return true;
  }

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
  const uint32_t pumpRequestId = cmd.received_at_ms + 1;
  const bool pumpCommand = cmd.valid && cmd.mode==Mode::MANUAL && cmd.key==AK::PUMP && cmd.state;
  bool pumpExpired=false;
  if (pumpCommand) {
    uint32_t duration=cmd.duration_ms;
    if (duration==0 || duration>timing::MANUAL_MAX_MS) duration=timing::MANUAL_MAX_MS;
    pumpExpired=time.synced && cmd.manual_until_epoch>0
      ? time.epoch_ms>=cmd.manual_until_epoch
      : nowMs-cmd.received_at_ms>=duration;
  }
  const bool pumpRequest = pumpCommand && !pumpExpired && pumpRequestId != g_pump.lastManualRequest;
  if (pumpRequest) g_pump.lastManualRequest=pumpRequestId;
  if (pumpExpired) outFault=Fault::COMMAND_EXPIRED;
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
  Fault pf = controlPump(t,s,time,nowMs,pumpRequest);
  if (cmd.valid && cmd.mode==Mode::MANUAL && cmd.key==AK::PUMP && cmd.state &&
      !validFresh(s.soil_valid,s.soil_updated_ms,nowMs))
    pf=Fault::COMMAND_REJECTED_SAFETY;
  if (pf != Fault::NONE && outFault == Fault::NONE) outFault=pf;
  if (!isManual(AK::GROWLIGHT)) {
    controlGrowlight(t, s, time, nowMs);
  }
}

Reason reasonOf(ActuatorKey key) { return g_reason[static_cast<int>(key)]; }

}  // namespace control

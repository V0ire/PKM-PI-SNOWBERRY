#include "control.h"
#include <Arduino.h>
#include <cmath>
#include <cstring>
#include "actuators.h"
#include "config.h"
#include "storage.h"

namespace {
using AK = ActuatorKey;
Reason reasons[static_cast<int>(AK::COUNT)] = {Reason::SAFETY_OFF, Reason::SAFETY_OFF, Reason::SAFETY_OFF};
bool rhRequest = false;
bool tempRequest = false;

struct PumpState {
  bool active = false;
  uint32_t startedAt = 0;
  uint32_t duration = 0;
  uint32_t soakStartedAt = 0;
  uint32_t starts[12] = {};
  uint32_t consumedCommand = 0;
  bool rebootLocked = true;
} pump;

void drive(AK key, bool on, Reason reason, uint32_t now) {
  actuators::apply(key, on, now);
  reasons[static_cast<int>(key)] = reason;
}
void off(AK key, Reason reason, uint32_t now) {
  actuators::forceOff(key, now);
  reasons[static_cast<int>(key)] = reason;
}
bool inSchedule(const Thresholds& t, uint8_t hour) {
  if (!t.light_schedule_enabled) return true;
  if (t.light_schedule_start_hour < t.light_schedule_end_hour)
    return hour >= t.light_schedule_start_hour && hour < t.light_schedule_end_hour;
  return hour >= t.light_schedule_start_hour || hour < t.light_schedule_end_hour;
}
void humidifierAuto(const Thresholds& t, const SensorReading& s, uint32_t now) {
  if (!s.rh_valid) { off(AK::HUMIDIFIER, Reason::SENSOR_INVALID, now); return; }
  if (s.humidity_pct <= t.rh_low) rhRequest = true;
  else if (s.humidity_pct >= t.rh_high) rhRequest = false;
  if (!t.temperature_influence) {
    drive(AK::HUMIDIFIER, rhRequest, rhRequest ? Reason::HUMIDITY_LOW : Reason::HUMIDITY_OK, now);
    return;
  }
  if (!s.temp_valid) {
    if (t.temperature_failure_fallback == TemperatureFailureFallback::RH_ONLY)
      drive(AK::HUMIDIFIER, rhRequest, rhRequest ? Reason::HUMIDITY_LOW : Reason::HUMIDITY_OK, now);
    else off(AK::HUMIDIFIER, Reason::SENSOR_INVALID, now);
    return;
  }
  if (s.temperature_c >= t.temp_high) tempRequest = true;
  else if (s.temperature_c <= t.temp_low) tempRequest = false;
  bool wanted = rhRequest == tempRequest ? rhRequest :
    (t.humidifier_priority == HumidifierPriority::RH ? rhRequest : tempRequest);
  drive(AK::HUMIDIFIER, wanted, wanted ? (tempRequest ? Reason::TEMP_HIGH : Reason::HUMIDITY_LOW) : Reason::TEMP_RH_OK, now);
}
Fault pumpStep(const Thresholds& t, const SensorReading& s, bool request, uint32_t commandId, uint32_t now, bool timeTrusted) {
  if (!s.soil_valid) { pump.active = false; off(AK::PUMP, Reason::SENSOR_INVALID, now); return Fault::NONE; }
  if (pump.active) {
    if (now - pump.startedAt < pump.duration) { drive(AK::PUMP, true, Reason::SOIL_LOW, now); return Fault::NONE; }
    pump.active = false; pump.soakStartedAt = now; off(AK::PUMP, Reason::SOIL_OK, now);
  }
  if (!request) { off(AK::PUMP, Reason::SOIL_OK, now); return Fault::NONE; }
  if (pump.soakStartedAt && now - pump.soakStartedAt < t.soak_period_ms) { off(AK::PUMP, Reason::SOIL_OK, now); return Fault::NONE; }
  if (pump.rebootLocked && (!timeTrusted || now < t.pump_window_ms)) {
    off(AK::PUMP, Reason::SAFETY_OFF, now);
    return Fault::PUMP_MAX_CYCLE_REACHED;
  }
  if (pump.rebootLocked) { pump.rebootLocked = false; storage::setPumpBootLock(false); }
  uint8_t used = 0;
  for (uint8_t i=0;i<12;i++) if (pump.starts[i] && now - pump.starts[i] < t.pump_window_ms) ++used; else pump.starts[i]=0;
  if (used >= t.pump_start_limit) { off(AK::PUMP, Reason::SAFETY_OFF, now); return Fault::PUMP_MAX_CYCLE_REACHED; }
  uint8_t slot=0; while (slot<12 && pump.starts[slot]) ++slot;
  if (slot>=12 || !storage::reservePumpStart()) { off(AK::PUMP, Reason::SAFETY_OFF, now); return Fault::NVS_ERROR; }
  pump.starts[slot]=now; pump.active=true; pump.startedAt=now; pump.duration=t.pump_pulse_ms; pump.consumedCommand=commandId;
  drive(AK::PUMP, true, Reason::SOIL_LOW, now); return Fault::NONE;
}
}

namespace control {
bool validate(const Thresholds& t) {
  if (!t.config_id[0] || !std::isfinite(t.temp_low) || !std::isfinite(t.temp_high) || !std::isfinite(t.rh_low) || !std::isfinite(t.rh_high) || !std::isfinite(t.soil_low) || !std::isfinite(t.soil_high) || !std::isfinite(t.lux_low) || !std::isfinite(t.lux_high)) return false;
  if (t.temp_low < 5 || t.temp_high > 45 || t.temp_low >= t.temp_high) return false;
  if (t.rh_low < 20 || t.rh_high > 95 || t.rh_low >= t.rh_high) return false;
  if (t.soil_low < 5 || t.soil_high > 95 || t.soil_low >= t.soil_high) return false;
  if (t.lux_low < 0 || t.lux_high > 100000 || t.lux_low >= t.lux_high) return false;
  if (t.pump_pulse_ms < 1000 || t.pump_pulse_ms > 120000 || t.soak_period_ms < 60000 || t.soak_period_ms > 7200000 || t.pump_pulse_ms >= t.soak_period_ms) return false;
  if (t.pump_start_limit < 1 || t.pump_start_limit > 12 || t.pump_window_ms < 3600000 || t.pump_window_ms > 86400000) return false;
  if (t.light_schedule_start_hour > 23 || t.light_schedule_end_hour > 23 || (t.light_schedule_enabled && t.light_schedule_start_hour == t.light_schedule_end_hour)) return false;
  return true;
}
bool soilPercent(const Thresholds& t, uint16_t raw, float& out) {
  if (t.soil_adc_dry <= t.soil_adc_wet || raw == 0 || raw >= 4095 || t.soil_adc_dry - t.soil_adc_wet < 100) return false;
  out = (static_cast<float>(t.soil_adc_dry) - raw) * 100.0f / (t.soil_adc_dry - t.soil_adc_wet);
  if (out < 0) out=0; if (out > 100) out=100; return true;
}
void step(const Thresholds& t, const SensorReading& s, const ManualCommand& cmd, const TimeCtx& time, uint32_t now, Fault& fault) {
  fault=Fault::NONE;
  bool manual = cmd.valid && cmd.mode == Mode::MANUAL;
  bool expired = manual && ((time.synced && cmd.manual_until_epoch > 0) ? time.epoch_ms >= cmd.manual_until_epoch : now - cmd.received_at_ms >= (cmd.duration_ms ? cmd.duration_ms : timing::MANUAL_MAX_MS));
  if (expired) { manual=false; fault=Fault::COMMAND_EXPIRED; }
  if (manual && cmd.key == AK::HUMIDIFIER) drive(AK::HUMIDIFIER, cmd.state, Reason::MANUAL_OVERRIDE, now); else humidifierAuto(t,s,now);
  if (manual && cmd.key == AK::GROWLIGHT) drive(AK::GROWLIGHT, cmd.state, Reason::MANUAL_OVERRIDE, now);
  else if (!s.lux_valid || (t.light_schedule_enabled && (!time.synced || !inSchedule(t,time.hour)))) off(AK::GROWLIGHT, s.lux_valid ? Reason::PHOTOPERIOD_LIMIT : Reason::SENSOR_INVALID, now);
  else if (s.lux <= t.lux_low) drive(AK::GROWLIGHT,true,Reason::LUX_LOW,now); else if (s.lux >= t.lux_high) drive(AK::GROWLIGHT,false,Reason::LUX_OK,now);
  bool manualPump = manual && cmd.key == AK::PUMP && cmd.state && cmd.command_id != pump.consumedCommand;
  bool autoPump = !manualPump && s.soil_valid && s.soil_pct <= t.soil_low;
  const bool manualPumpUnsafe = manualPump && !s.soil_valid;
  Fault pf = pumpStep(t, s, manualPump || autoPump, manualPump ? cmd.command_id : 0, now, time.synced);
  if (manualPumpUnsafe) pf = Fault::COMMAND_REJECTED_SAFETY;
  if (fault==Fault::NONE) fault=pf;
}
Reason reasonOf(ActuatorKey key) { int i=static_cast<int>(key); return i>=0 && i<static_cast<int>(AK::COUNT) ? reasons[i] : Reason::SAFETY_OFF; }
}

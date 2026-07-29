#include "status_json.h"
#include <cstdio>
#include "actuators.h"

namespace {
const char* actName(ActuatorKey k) {
  switch (k) {
    case ActuatorKey::GROWLIGHT: return "growlight";
    case ActuatorKey::PUMP: return "pump";
    case ActuatorKey::MIST: return "mist";
    case ActuatorKey::FAN: return "fan";
    case ActuatorKey::MIST_2: return "mist_2";
    case ActuatorKey::FAN_2: return "fan_2";
    default: return "unknown";
  }
}

// Tulis satu objek aktuator ke buffer.
int writeActuator(char* p, size_t cap, ActuatorKey k) {
  return snprintf(p, cap,
    "\"%s\":{\"state\":%s,\"mode\":\"AUTO\",\"reason\":\"%s\"}",
    actName(k),
    actuators::isOn(k) ? "true" : "false",
    reasonStr(control::reasonOf(k)));
}
}  // namespace

namespace status_json {

size_t buildStatus(char* buf, size_t cap,
                   const SensorReading& s, Fault fault,
                   const char* firmwareVersion, bool online, int rssi,
                   bool timeSynced, int64_t lastSeenEpochMs) {
  int n = snprintf(buf, cap,
    "{\"sensors\":{\"temperature_c\":%.1f,\"humidity_pct\":%.1f,\"lux\":%.0f,"
    "\"soil_pct\":%.1f,\"soil_raw_adc\":%u,\"psu_voltage\":%.2f},\"actuators\":{",
    s.temperature_c, s.humidity_pct, s.lux, s.soil_pct, s.soil_raw_adc, s.psu_voltage);
  if (n < 0 || (size_t)n >= cap) return 0;

  ActuatorKey order[6] = {ActuatorKey::GROWLIGHT, ActuatorKey::PUMP,
                          ActuatorKey::MIST, ActuatorKey::FAN,
                          ActuatorKey::MIST_2, ActuatorKey::FAN_2};
  for (int i = 0; i < 6; i++) {
    n += writeActuator(buf + n, cap - n, order[i]);
    if (i < 5) n += snprintf(buf + n, cap - n, ",");
    if ((size_t)n >= cap) return 0;
  }

  n += snprintf(buf + n, cap - n,
    "},\"device\":{\"online\":%s,\"rssi\":%d,\"firmware_version\":\"%s\","
    "\"time_synced\":%s},\"fault\":{\"active_code\":\"%s\",\"active_message\":\"%s\"},"
    "\"last_seen\":%lld}",
    online ? "true" : "false", rssi, firmwareVersion,
    timeSynced ? "true" : "false",
    faultCode(fault), faultMessage(fault),
    (long long)lastSeenEpochMs);
  if ((size_t)n >= cap) return 0;
  return (size_t)n;
}

size_t buildTelemetrySample(char* buf, size_t cap, const char* hhmm,
                            const SensorReading& s, Fault fault) {
  int n = snprintf(buf, cap,
    "{\"t\":\"%s\",\"tc\":%.1f,\"rh\":%.1f,\"lx\":%.0f,\"sl\":%.1f,\"pv\":%.2f,"
    "\"g\":%s,\"p\":%s,\"m\":%s,\"f\":%s,\"fc\":\"%s\"}",
    hhmm, s.temperature_c, s.humidity_pct, s.lux, s.soil_pct, s.psu_voltage,
    actuators::isOn(ActuatorKey::GROWLIGHT) ? "true" : "false",
    actuators::isOn(ActuatorKey::PUMP) ? "true" : "false",
    actuators::isOn(ActuatorKey::MIST) ? "true" : "false",
    actuators::isOn(ActuatorKey::FAN) ? "true" : "false",
    faultCode(fault));
  if (n < 0 || (size_t)n >= cap) return 0;
  return (size_t)n;
}

}  // namespace status_json

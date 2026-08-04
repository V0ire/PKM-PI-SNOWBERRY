#include "status_json.h"
#include <cstdio>
#include <cstring>
#include <ctime>
#include "actuators.h"

namespace {
const char* name(ActuatorKey key) {
  switch (key) {
    case ActuatorKey::GROWLIGHT: return "growlight";
    case ActuatorKey::PUMP: return "pump";
    case ActuatorKey::HUMIDIFIER: return "humidifier";
    default: return "unknown";
  }
}
bool manualActive(const control::ManualCommand& manual, const control::TimeCtx& time, uint32_t nowMs) {
  if (!manual.valid || manual.mode != Mode::MANUAL) return false;
  if (time.synced && manual.manual_until_epoch > 0) return time.epoch_ms < manual.manual_until_epoch;
  const uint32_t duration = manual.duration_ms ? manual.duration_ms : 30 * 60 * 1000UL;
  return nowMs - manual.received_at_ms < duration;
}
const char* calibrationName(CalibrationSource source) {
  return source == CalibrationSource::CALIBRATED ? "CALIBRATED" : "DEFAULT";
}
int actuator(char* out, size_t cap, ActuatorKey key, const control::ManualCommand& manual,
             const control::TimeCtx& time, uint32_t nowMs) {
  const bool activeManual = manualActive(manual, time, nowMs) && manual.key == key
    && (key != ActuatorKey::PUMP || actuators::isOn(key));
  const bool hasManualUntil = activeManual && key != ActuatorKey::PUMP && time.synced;
  char manualUntil[24];
  if (hasManualUntil) snprintf(manualUntil, sizeof(manualUntil), "%lld", static_cast<long long>(manual.manual_until_epoch));
  else strcpy(manualUntil, "null");
  return snprintf(out, cap, "\"%s\":{\"state\":%s,\"mode\":\"%s\",\"manual_until\":%s,\"reason\":\"%s\"}",
    name(key), actuators::isOn(key) ? "true" : "false", activeManual ? "MANUAL" : "AUTO",
    manualUntil,
    reasonStr(control::reasonOf(key)));
}
const char* numberOrNull(bool valid, char* out, size_t cap, const char* fmt, double value) {
  if (!valid) return "null";
  snprintf(out, cap, fmt, value); return out;
}
}
namespace status_json {
size_t buildStatus(char* buf, size_t cap, const SensorReading& s, Fault fault,
                   const char* version, bool online, int rssi, bool timeSynced,
                   int64_t lastSeen, const char* appliedConfigId, uint32_t uptimeSeconds,
                   const control::ManualCommand& manual, const control::TimeCtx& time,
                   uint32_t nowMs, CalibrationSource calibrationSource) {
  char t[24], h[24], l[24], soil[24];
  int n=snprintf(buf,cap,"{\"sensors\":{\"temperature_c\":%s,\"humidity_pct\":%s,\"lux\":%s,\"soil_pct\":%s,\"soil_raw_adc\":%u,\"psu_voltage\":null,\"calibration_source\":\"%s\"},\"actuators\":{",
    numberOrNull(s.temp_valid,t,sizeof t,"%.1f",s.temperature_c),
    numberOrNull(s.rh_valid,h,sizeof h,"%.1f",s.humidity_pct),
    numberOrNull(s.lux_valid,l,sizeof l,"%.0f",s.lux),
    numberOrNull(s.soil_valid,soil,sizeof soil,"%.1f",s.soil_pct), s.soil_raw_adc,
    calibrationName(calibrationSource));
  if(n<0||(size_t)n>=cap)return 0;
  ActuatorKey keys[]={ActuatorKey::GROWLIGHT,ActuatorKey::PUMP,ActuatorKey::HUMIDIFIER};
  for(int i=0;i<3;i++){n+=actuator(buf+n,cap-n,keys[i],manual,time,nowMs);if(i<2)n+=snprintf(buf+n,cap-n,",");if((size_t)n>=cap)return 0;}
  if (fault == Fault::NONE) {
    n+=snprintf(buf+n,cap-n,"},\"device\":{\"online\":%s,\"wifi_rssi\":%d,\"firmware_version\":\"%s\",\"uptime_seconds\":%lu,\"nvs_synced\":true,\"time_synced\":%s},\"fault\":{\"active_code\":null,\"active_message\":null},\"applied_config_id\":\"%s\",\"last_seen\":%lld}",
      online?"true":"false",rssi,version,(unsigned long)uptimeSeconds,timeSynced?"true":"false",appliedConfigId?appliedConfigId:"",(long long)lastSeen);
  } else {
    n+=snprintf(buf+n,cap-n,"},\"device\":{\"online\":%s,\"wifi_rssi\":%d,\"firmware_version\":\"%s\",\"uptime_seconds\":%lu,\"nvs_synced\":true,\"time_synced\":%s},\"fault\":{\"active_code\":\"%s\",\"active_message\":\"%s\"},\"applied_config_id\":\"%s\",\"last_seen\":%lld}",
      online?"true":"false",rssi,version,(unsigned long)uptimeSeconds,timeSynced?"true":"false",faultCode(fault),faultMessage(fault),appliedConfigId?appliedConfigId:"",(long long)lastSeen);
  }
  return n<0||(size_t)n>=cap?0:(size_t)n;
}
size_t buildTelemetrySample(char* buf,size_t cap,const char* hhmm,const SensorReading& s,Fault fault){
  const int64_t epochMs=static_cast<int64_t>(time(nullptr))*1000;
  int n=snprintf(buf,cap,"{\"time\":\"%s\",\"t\":%.1f,\"h\":%.1f,\"l\":%.0f,\"s\":%.1f,\"gl\":%s,\"p\":%s,\"m\":%s,\"f\":false,\"ts\":%lld,\"fault\":\"%s\"}",hhmm,s.temperature_c,s.humidity_pct,s.lux,s.soil_pct,actuators::isOn(ActuatorKey::GROWLIGHT)?"true":"false",actuators::isOn(ActuatorKey::PUMP)?"true":"false",actuators::isOn(ActuatorKey::HUMIDIFIER)?"true":"false",(long long)epochMs,faultCode(fault));
  return n<0||(size_t)n>=cap?0:(size_t)n;
}
}

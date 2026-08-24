#include <Arduino.h>
#include <esp_system.h>
#include <WiFi.h>
#include "actuators.h"
#include "calibration.h"
#include "config.h"
#include "control.h"
#ifndef SNOWBERRY_MEASUREMENT_MODE
#include "manual_control.h"
#endif
#ifdef SNOWBERRY_MEASUREMENT_MODE
#include "measurement_server.h"
#else
#include "network_worker.h"
#endif
#include "sensors.h"
#include "storage.h"
#include "types.h"

RTC_DATA_ATTR uint32_t g_bootCount = 0;

namespace {
enum class InitStage : uint8_t { GPIO_SAFE, STORAGE, SENSORS, NETWORK, RUNNING };
InitStage g_initStage = InitStage::GPIO_SAFE;
Thresholds g_thresholds;
SensorReading g_sensor;
control::ManualCommand g_manual;
control::TimeCtx g_time;
calibration::Machine g_calibration;
Fault g_activeFault = Fault::NONE;
uint32_t g_lastSensor;
uint32_t g_lastControl;
uint32_t g_lastReport;
uint32_t g_lastPublish;
uint32_t g_lastLoop;
uint32_t g_maxLoopLatency;
uint32_t g_deadlineOverruns;
uint32_t g_minFreeHeap = UINT32_MAX;
bool g_lastButton;
uint32_t g_buttonPressedAt;
#ifndef SNOWBERRY_MEASUREMENT_MODE
bool g_pumpHistoryRestored;
#endif

void forceAllOff(uint32_t now) {
  actuators::forceOff(ActuatorKey::GROWLIGHT, now);
  actuators::forceOff(ActuatorKey::PUMP, now);
  actuators::forceOffHumidifierGroup(now);
}

void runCalibration(uint32_t now) {
  const bool pressed = digitalRead(pins::BUTTON) == LOW;
  if (pressed && !g_lastButton) g_buttonPressedAt = now;
  if (pressed && g_calibration.active() && now - g_buttonPressedAt >= 3000) {
    g_calibration.cancel();
    g_lastButton = pressed;
    return;
  }
  if (pressed && !g_lastButton && !g_calibration.active()) g_calibration.start(now);
  g_lastButton = pressed;
  if (!g_calibration.active()) return;
  forceAllOff(now);
  g_calibration.step(pressed, now, static_cast<uint16_t>(analogRead(pins::SOIL_ADC)));
  uint16_t dry, wet;
  if (g_calibration.takeResult(dry, wet) && storage::saveSoilCalibration(dry, wet)) {
    g_thresholds.soil_adc_dry = dry;
    g_thresholds.soil_adc_wet = wet;
  }
}

void heartbeat(uint32_t now) {
  static uint32_t last;
  static bool state;
  if (now - last >= timing::DIAG_INTERVAL_MS) {
    last = now;
    state = !state;
    digitalWrite(timing::DIAG_PIN, state);
  }
}

void diagnostics(uint32_t now) {
  const uint32_t heap = ESP.getFreeHeap();
  if (heap < g_minFreeHeap) g_minFreeHeap = heap;
  Serial.printf("[system] boot=%lu reset=%d stage=%u loop_max_ms=%lu overruns=%lu heap=%lu heap_min=%lu\n",
      static_cast<unsigned long>(g_bootCount), static_cast<int>(esp_reset_reason()),
      static_cast<unsigned>(g_initStage), static_cast<unsigned long>(g_maxLoopLatency),
      static_cast<unsigned long>(g_deadlineOverruns), static_cast<unsigned long>(heap),
      static_cast<unsigned long>(g_minFreeHeap));
#ifndef SNOWBERRY_MEASUREMENT_MODE
  char ip[16];
  network_worker::ipAddress(ip, sizeof(ip));
  Serial.printf("[network] wifi=%s ip=%s rssi_dbm=%ld ntp=%s disconnect_reason=%d(%s) net=%s net_ms=%lu net_result=%d\n",
      network_worker::wifiConnected() ? "CONNECTED" : "DISCONNECTED", ip,
      network_worker::wifiConnected() ? static_cast<long>(WiFi.RSSI()) : 0L,
      g_time.synced ? "SYNCED" : "NOT_SYNCED", network_worker::wifiDisconnectReason(),
      network_worker::wifiDisconnectReasonName(),
      network_worker::operation(),
      static_cast<unsigned long>(network_worker::operationDurationMs()), network_worker::operationResult());
#endif
  Serial.printf("[sensor] temperature_c=%.1f valid=%d humidity_pct=%.1f valid=%d age_ms=%lu "
                "lux=%.1f valid=%d age_ms=%lu soil_pct=%.1f soil_raw_adc=%u valid=%d age_ms=%lu\n",
      g_sensor.temperature_c, g_sensor.temp_valid, g_sensor.humidity_pct, g_sensor.rh_valid,
      static_cast<unsigned long>(g_sensor.rh_sample_ms ? now - g_sensor.rh_sample_ms : 0),
      g_sensor.lux, g_sensor.lux_valid,
      static_cast<unsigned long>(g_sensor.lux_sample_ms ? now - g_sensor.lux_sample_ms : 0),
      g_sensor.soil_pct, g_sensor.soil_raw_adc, g_sensor.soil_valid,
      static_cast<unsigned long>(g_sensor.soil_sample_ms ? now - g_sensor.soil_sample_ms : 0));
  Serial.printf("[gpio] GPIO16(growlight) commanded=%s level=%s GPIO25(spare) commanded=OFF level=%s "
                "GPIO17(pump) commanded=%s level=%s GPIO18(mist1) commanded=%s level=%s "
                "GPIO19(fan1) commanded=%s level=%s GPIO23(mist2) commanded=%s level=%s "
                "GPIO32(fan2) commanded=%s level=%s\n",
      actuators::isOn(ActuatorKey::GROWLIGHT) ? "ON" : "OFF", digitalRead(pins::GROWLIGHT) ? "HIGH" : "LOW",
      digitalRead(pins::SPARE_SSR) ? "HIGH" : "LOW",
      actuators::isOn(ActuatorKey::PUMP) ? "ON" : "OFF", digitalRead(pins::PUMP) ? "HIGH" : "LOW",
      actuators::isOn(ActuatorKey::MIST) ? "ON" : "OFF", digitalRead(pins::MIST) ? "HIGH" : "LOW",
      actuators::isOn(ActuatorKey::FAN) ? "ON" : "OFF", digitalRead(pins::FAN) ? "HIGH" : "LOW",
      actuators::isOn(ActuatorKey::MIST_2) ? "ON" : "OFF", digitalRead(pins::MIST_2) ? "HIGH" : "LOW",
      actuators::isOn(ActuatorKey::FAN_2) ? "ON" : "OFF", digitalRead(pins::FAN_2) ? "HIGH" : "LOW");
  Serial.printf("[control] active_fault=%s message=\"%s\" block_growlight=%s block_pump=%s block_humidifier=%s\n",
      faultCode(g_activeFault), faultMessage(g_activeFault),
      reasonStr(control::reasonOf(ActuatorKey::GROWLIGHT)),
      reasonStr(control::reasonOf(ActuatorKey::PUMP)),
      reasonStr(control::reasonOf(ActuatorKey::MIST)));
}
}

void setup() {
  digitalWrite(timing::DIAG_PIN, LOW);
  pinMode(timing::DIAG_PIN, OUTPUT);
  digitalWrite(timing::DIAG_PIN, LOW);
  actuators::initSafeState();
  ++g_bootCount;
  Serial.begin(115200);
  pinMode(pins::BUTTON, INPUT_PULLUP);

  g_initStage = InitStage::STORAGE;
  if (!storage::begin() || !storage::loadThresholds(g_thresholds)) {
    g_thresholds = Thresholds{};
    storage::saveThresholds(g_thresholds);
  }
  control::setPumpStartReserver(storage::reservePumpStart);
  control::restorePumpSafety(nullptr, 0, false, 0);
#ifndef SNOWBERRY_MEASUREMENT_MODE
  manual_control::begin();
#endif

  g_initStage = InitStage::SENSORS;
  sensors::begin();
  g_initStage = InitStage::NETWORK;
#ifdef SNOWBERRY_MEASUREMENT_MODE
  measurement::begin(&g_sensor);
#else
  network_worker::begin(g_thresholds);
#endif
  g_initStage = InitStage::RUNNING;
}

void loop() {
  const uint32_t now = millis();
  if (g_lastLoop) {
    const uint32_t latency = now - g_lastLoop;
    if (latency > g_maxLoopLatency) g_maxLoopLatency = latency;
    if (latency > timing::CONTROL_INTERVAL_MS) ++g_deadlineOverruns;
  }
  g_lastLoop = now;
  heartbeat(now);
  runCalibration(now);

  if (now - g_lastSensor >= timing::SENSOR_INTERVAL_MS) {
    g_lastSensor = now;
    Fault sensorFault;
    sensors::read(g_thresholds, g_sensor, sensorFault, now);
    if (sensorFault != Fault::NONE) g_activeFault = sensorFault;
  }

#ifdef SNOWBERRY_MEASUREMENT_MODE
  forceAllOff(now);
  measurement::loop();
#else
  g_time.synced = network_worker::timeNow(g_time.epoch_ms, g_time.hour);
  if (g_time.synced && !g_pumpHistoryRestored) {
    control::PumpStartRecord starts[2];
    const size_t count = storage::loadPumpStarts(starts, 2);
    control::restorePumpSafety(starts, count, true, g_time.epoch_ms);
    g_pumpHistoryRestored = true;
  }
  Thresholds update;
  if (network_worker::takeThresholds(update)) g_thresholds = update;
  manual_control::take(g_manual);
  if (!g_calibration.active() && now - g_lastControl >= timing::CONTROL_INTERVAL_MS) {
    g_lastControl = now;
    Fault controlFault;
    control::step(g_thresholds, g_sensor, g_manual, g_time, now, controlFault);
    if (controlFault != Fault::NONE) g_activeFault = controlFault;
  }
#endif

  if (now - g_lastReport >= 5000) {
    g_lastReport = now;
    diagnostics(now);
  }
#ifndef SNOWBERRY_MEASUREMENT_MODE
  // Status penuh ke Firestore tiap 60 s (api-contract §4); publish pertama
  // langsung agar dashboard online sejak boot.
  if (g_lastPublish == 0 || now - g_lastPublish >= timing::STATUS_PUBLISH_INTERVAL_MS) {
    g_lastPublish = now;
    network_worker::submitStatus(g_sensor, g_activeFault, now);
  }
#endif
}
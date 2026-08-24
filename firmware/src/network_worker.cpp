#include "network_worker.h"
#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include <freertos/task.h>
#include <WiFi.h>
#include "config.h"
#include "firebase_sync.h"
#include "manual_control.h"
#include "storage.h"

namespace {
struct StatusItem { SensorReading sensor; Fault fault; uint32_t now_ms; };
QueueHandle_t g_thresholdQueue;
QueueHandle_t g_statusQueue;
Thresholds g_candidate;
bool g_ready;
SensorReading g_lastSensor;
bool g_hasSensor = false;
const char* g_operation = "idle";
volatile uint32_t g_duration;
volatile int g_result;
volatile int g_wifiDisconnectReason;

// Terjemahkan command cloud ke ManualCommand, putuskan ack, lalu antrekan.
// Ack dikirim segera agar web tidak menunggu siklus kontrol berikutnya.
void handleCloudCommand(uint32_t now) {
  fbsync::CloudCommand cmd;
  if (!fbsync::fetchCommand(cmd)) return;
  control::ManualCommand mc;
  mc.valid = true;
  mc.received_at_ms = now;
  mc.duration_ms = cmd.duration_ms ? cmd.duration_ms : 30UL * 60UL * 1000UL;
  mc.manual_until_epoch = cmd.manual_until_epoch;
  mc.mode = cmd.mode_manual ? Mode::MANUAL : Mode::AUTO;
  mc.state = cmd.state;
  const String actuator = String(cmd.actuator);
  if (actuator == "growlight") mc.target = ManualTarget::GROWLIGHT;
  else if (actuator == "pump") mc.target = ManualTarget::PUMP;
  else if (actuator == "mist" || actuator == "fan") mc.target = ManualTarget::HUMIDIFIER;
  else mc.target = ManualTarget::UNKNOWN;

  const char* ackStatus;
  const char* ackMessage;
  if (mc.target == ManualTarget::UNKNOWN) {
    ackStatus = "INVALID";
    ackMessage = "Perintah tidak valid.";
  } else if (cmd.mode_manual && cmd.state && mc.target == ManualTarget::PUMP &&
             !(g_hasSensor && g_lastSensor.soil_valid &&
               now - g_lastSensor.soil_sample_ms <= timing::SENSOR_STALE_MS)) {
    // Cermin aturan safety control.cpp: pompa manual menuntut data soil
    // valid DAN segar (<= 15 s), supaya ack tidak menipu petani.
    ackStatus = "REJECTED_SAFETY";
    ackMessage = "Perintah ditolak demi keamanan alat.";
  } else if (!manual_control::submitCloud(mc)) {
    ackStatus = "INVALID";
    ackMessage = "Perintah tidak valid.";
  } else {
    ackStatus = "APPLIED";
    ackMessage = "Perintah alat diterapkan.";
  }
  fbsync::publishAck(cmd.command_id, ackStatus, ackMessage);
}

void onWiFiEvent(WiFiEvent_t event, WiFiEventInfo_t info) {
  if (event == ARDUINO_EVENT_WIFI_STA_DISCONNECTED) {
    g_wifiDisconnectReason = info.wifi_sta_disconnected.reason;
  }
}

const char* disconnectReasonName(int reason) {
  switch (reason) {
    case 0: return "NONE";
    case 200: return "BEACON_TIMEOUT";
    case 201: return "NO_AP_FOUND";
    case 202: return "AUTH_FAIL";
    case 203: return "ASSOC_FAIL";
    case 204: return "HANDSHAKE_TIMEOUT";
    default: return "OTHER";
  }
}

void task(void*) {
  fbsync::Config cfg{};
  fbsync::begin(cfg);
  uint32_t lastThreshold = 0;
  uint32_t lastCommandPoll = 0;
  uint32_t lastTelemetry = 0;
  for (;;) {
    const uint32_t now = millis();
    fbsync::loop(now);
    if (now - lastThreshold >= 60000) {
      lastThreshold = now;
      g_operation = "threshold_fetch";
      const uint32_t started = millis();
      if (fbsync::fetchThresholds(g_candidate) && storage::saveThresholds(g_candidate)) {
        xQueueOverwrite(g_thresholdQueue, &g_candidate);
        g_result = 200;
      } else g_result = -1;
      g_duration = millis() - started;
      g_operation = "idle";
    }
    if (now - lastCommandPoll >= timing::COMMAND_POLL_INTERVAL_MS) {
      lastCommandPoll = now;
      g_operation = "command_fetch";
      const uint32_t started = millis();
      handleCloudCommand(now);
      g_duration = millis() - started;
      g_operation = "idle";
    }
    if (g_hasSensor && now - lastTelemetry >= timing::TELEMETRY_FLUSH_INTERVAL_MS) {
      lastTelemetry = now;
      g_operation = "telemetry_append";
      const uint32_t started = millis();
      fbsync::appendTelemetry(g_lastSensor, now);
      g_duration = millis() - started;
      g_operation = "idle";
    }
    StatusItem status;
    if (xQueueReceive(g_statusQueue, &status, 0) == pdTRUE) {
      g_lastSensor = status.sensor;
      g_hasSensor = true;
      g_operation = "status_publish";
      const uint32_t started = millis();
      fbsync::updateLiveSensors(status.sensor, status.fault, status.now_ms);
      g_duration = millis() - started;
      g_operation = "idle";
    }
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}
}
namespace network_worker {
void begin(const Thresholds& initial) {
  g_candidate = initial;
  WiFi.onEvent(onWiFiEvent, ARDUINO_EVENT_WIFI_STA_DISCONNECTED);
  g_thresholdQueue = xQueueCreate(1, sizeof(Thresholds));
  g_statusQueue = xQueueCreate(1, sizeof(StatusItem));
  if (!g_thresholdQueue || !g_statusQueue) return;
  g_ready = xTaskCreatePinnedToCore(task, "snowberry-network", 8192, nullptr, 0, nullptr, 0) == pdPASS;
}
bool takeThresholds(Thresholds& out) {
  return g_ready && xQueueReceive(g_thresholdQueue, &out, 0) == pdTRUE;
}
void submitStatus(const SensorReading& sensor, Fault fault, uint32_t nowMs) {
  if (!g_ready) return;
  StatusItem item{sensor, fault, nowMs};
  xQueueOverwrite(g_statusQueue, &item);
}
bool timeNow(int64_t& epochMs, uint8_t& hour) { return g_ready && fbsync::timeSynced(epochMs, hour); }
const char* operation() { return g_operation; }
uint32_t operationDurationMs() { return g_duration; }
int operationResult() { return g_result; }
bool wifiConnected() { return WiFi.status() == WL_CONNECTED; }
void ipAddress(char* out, size_t cap) {
  if (!out || cap == 0) return;
  const String ip = WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : "0.0.0.0";
  strlcpy(out, ip.c_str(), cap);
}
int wifiDisconnectReason() { return g_wifiDisconnectReason; }
const char* wifiDisconnectReasonName() { return disconnectReasonName(g_wifiDisconnectReason); }
}
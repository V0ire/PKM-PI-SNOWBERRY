#include "measurement_server.h"

#include <Arduino.h>
#include <WebServer.h>
#include <WiFi.h>

#if __has_include("measurement_config.local.h")
#include "measurement_config.local.h"
#else
#include "measurement_config.example.h"
#endif

namespace {
struct MeasurementRecord {
  String pointId;
  String label;
  String category;
  String sensorHeightCm;
  String notes;
  String photoRef;
  String cableLengthM;
  uint32_t savedAtMs = 0;
  int32_t wifiRssi = 0;
  SensorReading reading;
};

WebServer g_server(80);
SensorReading* g_sensor = nullptr;
MeasurementRecord g_records[MEASUREMENT_MAX_SAVED];
uint16_t g_recordCount = 0;
uint32_t g_lastWiFiAttempt = 0;

String jsonEscape(const String& value) {
  String out;
  out.reserve(value.length() + 8);
  for (size_t i = 0; i < value.length(); i++) {
    const char c = value[i];
    if (c == '"' || c == '\\') {
      out += '\\';
      out += c;
    } else if (c == '\n') {
      out += "\\n";
    } else if (c == '\r') {
      out += "\\r";
    } else if (c == '\t') {
      out += "\\t";
    } else {
      out += c;
    }
  }
  return out;
}

String quoted(const String& value) {
  return "\"" + jsonEscape(value) + "\"";
}

void addCors() {
  g_server.sendHeader("Access-Control-Allow-Origin", "*");
  g_server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  g_server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  g_server.sendHeader("Cache-Control", "no-store");
}

String numberOrNull(float value, bool valid, uint8_t decimals = 1) {
  if (!valid || isnan(value)) return "null";
  return String(value, static_cast<unsigned int>(decimals));
}

String readingJson(const SensorReading& reading) {
  String json = "{";
  json += "\"temperature_c\":" + numberOrNull(reading.temperature_c, reading.temp_valid, 1) + ",";
  json += "\"humidity_pct\":" + numberOrNull(reading.humidity_pct, reading.rh_valid, 1) + ",";
  json += "\"lux\":" + numberOrNull(reading.lux, reading.lux_valid, 0) + ",";
  json += "\"soil_raw_adc\":" + String(reading.soil_raw_adc) + ",";
  json += "\"soil_pct\":" + numberOrNull(reading.soil_pct, reading.soil_valid, 1) + ",";
  json += "\"psu_voltage\":" + numberOrNull(reading.psu_voltage, reading.psu_valid, 2);
  json += "}";
  return json;
}

void sendOptions() {
  addCors();
  g_server.send(204, "text/plain", "");
}

void handleRoot() {
  addCors();
  g_server.send(
      200,
      "text/plain",
      "Snowberry measurement API ready. Use /api/live, /api/save, /api/export.");
}

void handleLive() {
  addCors();
  if (!g_sensor) {
    g_server.send(503, "application/json", "{\"ok\":false,\"error\":\"sensor_not_ready\"}");
    return;
  }

  String json = "{";
  json += "\"ok\":true,";
  json += "\"measurement_mode\":true,";
  json += "\"hostname\":" + quoted(MEASUREMENT_HOSTNAME) + ",";
  json += "\"ip\":" + quoted(WiFi.localIP().toString()) + ",";
  json += "\"wifi_connected\":" + String(WiFi.status() == WL_CONNECTED ? "true" : "false") + ",";
  json += "\"wifi_rssi\":" + String(WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : 0) + ",";
  json += "\"uptime_ms\":" + String(millis()) + ",";
  json += "\"saved_count\":" + String(g_recordCount) + ",";
  json += "\"readings\":" + readingJson(*g_sensor);
  json += "}";
  g_server.send(200, "application/json", json);
}

void handleSave() {
  addCors();
  if (!g_sensor) {
    g_server.send(503, "application/json", "{\"ok\":false,\"error\":\"sensor_not_ready\"}");
    return;
  }
  if (g_recordCount >= MEASUREMENT_MAX_SAVED) {
    g_server.send(507, "application/json", "{\"ok\":false,\"error\":\"measurement_memory_full\"}");
    return;
  }

  MeasurementRecord& rec = g_records[g_recordCount++];
  rec.pointId = g_server.arg("point_id");
  rec.label = g_server.arg("label");
  rec.category = g_server.arg("category");
  rec.sensorHeightCm = g_server.arg("sensor_height_cm");
  rec.notes = g_server.arg("notes");
  rec.photoRef = g_server.arg("photo_ref");
  rec.cableLengthM = g_server.arg("cable_length_m");
  rec.savedAtMs = millis();
  rec.wifiRssi = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : 0;
  rec.reading = *g_sensor;

  String response = "{\"ok\":true,\"saved_count\":";
  response += String(g_recordCount);
  response += "}";
  g_server.send(200, "application/json", response);
}

String recordJson(const MeasurementRecord& rec) {
  String json = "{";
  json += "\"point_id\":" + quoted(rec.pointId) + ",";
  json += "\"label\":" + quoted(rec.label) + ",";
  json += "\"category\":" + quoted(rec.category) + ",";
  json += "\"sensor_height_cm\":" + quoted(rec.sensorHeightCm) + ",";
  json += "\"notes\":" + quoted(rec.notes) + ",";
  json += "\"photo_ref\":" + quoted(rec.photoRef) + ",";
  json += "\"cable_length_m\":" + quoted(rec.cableLengthM) + ",";
  json += "\"saved_at_ms\":" + String(rec.savedAtMs) + ",";
  json += "\"wifi_rssi\":" + String(rec.wifiRssi) + ",";
  json += "\"readings\":" + readingJson(rec.reading);
  json += "}";
  return json;
}

void handleExport() {
  addCors();
  String json = "[";
  for (uint16_t i = 0; i < g_recordCount; i++) {
    if (i > 0) json += ",";
    json += recordJson(g_records[i]);
  }
  json += "]";
  g_server.send(200, "application/json", json);
}

void beginWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setHostname(MEASUREMENT_HOSTNAME);
  WiFi.begin(MEASUREMENT_WIFI_SSID, MEASUREMENT_WIFI_PASSWORD);
  Serial.printf("[measurement] Connecting WiFi SSID=%s", MEASUREMENT_WIFI_SSID);
  for (uint8_t i = 0; i < 20 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[measurement] Open API from laptop/phone: http://%s/\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("[measurement] WiFi not connected yet. Will retry in loop.");
  }
}
}  // namespace

namespace measurement {

void begin(SensorReading* sensor) {
  g_sensor = sensor;
  beginWiFi();

  g_server.on("/", HTTP_GET, handleRoot);
  g_server.on("/api/live", HTTP_GET, handleLive);
  g_server.on("/api/save", HTTP_POST, handleSave);
  g_server.on("/api/export", HTTP_GET, handleExport);
  g_server.on("/api/live", HTTP_OPTIONS, sendOptions);
  g_server.on("/api/save", HTTP_OPTIONS, sendOptions);
  g_server.on("/api/export", HTTP_OPTIONS, sendOptions);
  g_server.begin();
  Serial.println("[measurement] HTTP API started.");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED && millis() - g_lastWiFiAttempt > 10000) {
    g_lastWiFiAttempt = millis();
    WiFi.disconnect();
    WiFi.begin(MEASUREMENT_WIFI_SSID, MEASUREMENT_WIFI_PASSWORD);
    Serial.println("[measurement] Retrying WiFi...");
  }
  g_server.handleClient();
}
}

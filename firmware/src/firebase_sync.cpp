#include "firebase_sync.h"
#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include "actuators.h"
#include "config.h"
#include "control.h"
#include "status_json.h"

#if __has_include("firebase_config.local.h")
#include "firebase_config.local.h"
#else
#include "firebase_config.example.h"
#endif
#ifndef SNOWBERRY_FIREBASE_API_KEY
#define SNOWBERRY_FIREBASE_API_KEY ""
#endif
#ifndef SNOWBERRY_DEVICE_EMAIL
#define SNOWBERRY_DEVICE_EMAIL ""
#endif
#ifndef SNOWBERRY_DEVICE_PASSWORD
#define SNOWBERRY_DEVICE_PASSWORD ""
#endif
#ifndef SNOWBERRY_FIRMWARE_VERSION
#define SNOWBERRY_FIRMWARE_VERSION "1.1.0"
#endif

namespace {
bool g_online;
uint32_t g_lastWiFiAttempt;
String g_idToken;
int64_t g_tokenExpiresAt;

const char GOOGLE_CA_CERT[] = R"EOF(-----BEGIN CERTIFICATE-----
MIIFVzCCAz+gAwIBAgINAgPlk28xsBNJiGuiFzANBgkqhkiG9w0BAQwFADBHMQsw
CQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZpY2VzIExMQzEU
MBIGA1UEAxMLR1RTIFJvb3QgUjEwHhcNMTYwNjIyMDAwMDAwWhcNMzYwNjIyMDAw
MDAwWjBHMQswCQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZp
Y2VzIExMQzEUMBIGA1UEAxMLR1RTIFJvb3QgUjEwggIiMA0GCSqGSIb3DQEBAQUA
A4ICDwAwggIKAoICAQC2EQKLHuOhd5s73L+UPreVp0A8of2C+X0yBoJx9vaMf/vo
27xqLpeXo4xL+Sv2sfnOhB2x+cWX3u+58qPpvBKJXqeqUqv4IyfLpLGcY9vXmX7w
Cl7raKb0xlpHDU0QM+NOsROjyBhsS+z8CZDfnWQpJSMHobTSPS5g4M/SCYe7zUjw
TcLCeoiKu7rPWRnWr4+wB7CeMfGCwcDfLqZtbBkOtdh+JhpFAz2weaSUKK0Pfybl
qAj+lug8aJRT7oM6iCsVlgmy4HqMLnXWnOunVmSPlk9orj2XwoSPwLxAwAtcvfaH
szVsrBhQf4TgTM2S0yDpM7xSma8ytSmzJSq0SPly4cpk9+aCEI3oncKKiPo4Zor8
Y/kB+Xj9e1x3+naH+uzfsQ55lVe0vSbv1gHR6xYKu44LtcXFilWr06zqkUspzBmk
MiVOKvFlRNACzqrOSbTqn3yDsEB750Orp2yjj32JgfpMpf/VjsPOS+C12LOORc92
wO1AK/1TD7Cn1TsNsYqiA94xrcx36m97PtbfkSIS5r762DL8EGMUUXLeXdYWk70p
aDPvOmbsB4om3xPXV2V4J95eSRQAogB/mqghtqmxlbCluQ0WEdrHbEg8QOB+DVrN
VjzRlwW5y0vtOUucxD/SVRNuJLDWcfr0wbrM7Rv1/oFB2ACYPTrIrnqYNxgFlQID
AQABo0IwQDAOBgNVHQ8BAf8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4E
FgQU5K8rJnEaK0gnhS9SZizv8IkTcT4wDQYJKoZIhvcNAQEMBQADggIBAJ+qQibb
C5u+/x6Wki4+omVKapi6Ist9wTrYggoGxval3sBOh2Z5ofmmWJyq+bXmYOfg6LEe
QkEzCzc9zolwFcq1JKjPa7XSQCGYzyI0zzvFIoTgxQ6KfF2I5DUkzps+GlQebtuy
h6f88/qBVRRiClmpIgUxPoLW7ttXNLwzldMXG+gnoot7TiYaelpkttGsN/H9oPM4
7HLwEXWdyzRSjeZ2axfG34arJ45JK3VmgRAhpuo+9K4l/3wV3s6MJT/KYnAK9y8J
ZgfIPxz88NtFMN9iiMG1D53Dn0reWVlHxYciNuaCp+0KueIHoI17eko8cdLiA6Ef
MgfdG+RCzgwARWGAtQsgWSl4vflVy2PFPEz0tv/bal8xa5meLMFrUKTX5hgUvYU/
Z6tGn6D/Qqc6f1zLXbBwHSs09dR2CQzreExZBfMzQsNhFRAbd03OIozUhfJFfbdT
6u9AWpQKXCBfTkBdYiJ23//OYb2MI3jSNwLgjt7RETeJ9r/tSQdirpLsQBqvFAnZ
0E6yove+7u7Y/9waLd64NnHi/Hm3lCXRSHNboTXns5lndcEZOitHTtNCjv0xyBZm
2tIMPNuzjsmhDYAPexZ3FL//2wmUspO8IFgV6dtxQ/PeEMMA3KgqlbbC1j+Qa3bb
bP6MvPJwNQzcmRk13NfIRmPVNnGuV/u3gm3c
-----END CERTIFICATE-----)EOF";

String jsonString(const String& json, const char* key) {
  const String needle = "\"" + String(key) + "\":\"";
  const int start = json.indexOf(needle);
  if (start < 0) return "";
  const int value = start + needle.length();
  const int end = json.indexOf('"', value);
  return end < 0 ? "" : json.substring(value, end);
}

bool firestoreNumber(const String& json, const char* key, float& out) {
  int pos = json.indexOf("\"" + String(key) + "\"");
  if (pos < 0) return false;
  const int fieldEnd = json.indexOf('}', pos);
  if (fieldEnd < 0) return false;
  int type = json.indexOf("\"doubleValue\"", pos);
  int integer = json.indexOf("\"integerValue\"", pos);
  if (type < 0 || (integer >= 0 && integer < type)) type = integer;
  if (type < 0 || type > fieldEnd) return false;
  const int colon = json.indexOf(':', type);
  if (colon < 0) return false;
  int start = colon + 1;
  while (start < json.length() && (json[start] == ' ' || json[start] == '"')) ++start;
  char* end = nullptr;
  out = strtof(json.c_str() + start, &end);
  return end != json.c_str() + start;
}

bool authenticate() {
  if (strlen(SNOWBERRY_FIREBASE_API_KEY) == 0 || strlen(SNOWBERRY_DEVICE_EMAIL) == 0 ||
      strlen(SNOWBERRY_DEVICE_PASSWORD) == 0 || time(nullptr) < 1500000000) return false;
  const int64_t now = static_cast<int64_t>(time(nullptr));
  if (!g_idToken.isEmpty() && now + 60 < g_tokenExpiresAt) return true;
  WiFiClientSecure client;
  client.setCACert(GOOGLE_CA_CERT);
  HTTPClient http;
  http.setConnectTimeout(2000);
  http.setTimeout(3000);
  const String url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" +
                     String(SNOWBERRY_FIREBASE_API_KEY);
  if (!http.begin(client, url)) return false;
  http.addHeader("Content-Type", "application/json");
  const String body = "{\"email\":\"" + String(SNOWBERRY_DEVICE_EMAIL) +
      "\",\"password\":\"" + String(SNOWBERRY_DEVICE_PASSWORD) +
      "\",\"returnSecureToken\":true}";
  const int code = http.POST(body);
  const String response = code == 200 ? http.getString() : "";
  http.end();
  g_idToken = jsonString(response, "idToken");
  const String expires = jsonString(response, "expiresIn");
  g_tokenExpiresAt = now + (expires.length() ? expires.toInt() : 0);
  return code == 200 && !g_idToken.isEmpty();
}

// Dipertahankan untuk penulisan field nullable pada demo lain; "nullValue"
// divalidasi oleh test/check_architecture.py.
[[maybe_unused]] void addNullable(String& payload, const char* name, float value, bool valid, uint8_t decimals) {
  payload += "\"" + String(name) + "\":";
  payload += valid ? "{\"doubleValue\":" + String(value, static_cast<unsigned int>(decimals)) + "}" : "{\"nullValue\":null}";
}

// ---------------------------------------------------------------------------
// Koneksi TLS persisten ke firestore.googleapis.com. Tujuan: menghindari
// TLS handshake baru tiap poll command (2 detik) agar manual mode responsif.
// ---------------------------------------------------------------------------
WiFiClientSecure g_apiClient;

bool ensureApiConnection() {
  if (g_apiClient.connected()) return true;
  g_apiClient.stop();
  g_apiClient.setCACert(GOOGLE_CA_CERT);
  return g_apiClient.connect("firestore.googleapis.com", 443);
}

int apiRequest(const char* method, const String& path, const char* payload, String& response) {
  response = "";
  if (!g_online || !authenticate()) return 0;
  if (!ensureApiConnection()) return 0;
  HTTPClient http;
  http.setReuse(true);
  http.setConnectTimeout(2000);
  http.setTimeout(3000);
  const String url = "https://firestore.googleapis.com/v1/projects/" +
      String(SNOWBERRY_FIREBASE_PROJECT_ID) + "/databases/(default)/documents/" + path;
  if (!http.begin(g_apiClient, url)) return 0;
  http.addHeader("Authorization", "Bearer " + g_idToken);
  http.addHeader("Content-Type", "application/json");
  int code = 0;
  if (strcmp(method, "GET") == 0) code = http.GET();
  else if (strcmp(method, "PATCH") == 0) code = http.PATCH(payload ? String(payload) : String());
  else code = http.POST(payload ? String(payload) : String());
  if (code == 200 || code == 201) response = http.getString();
  http.end();
  if (code <= 0) g_apiClient.stop();  // transport error: paksa reconnect berikutnya
  return code;
}

bool firestoreBool(const String& json, const char* key) {
  const int pos = json.indexOf("\"" + String(key) + "\"");
  if (pos < 0) return false;
  const int fieldEnd = json.indexOf('}', pos);
  const int type = json.indexOf("\"booleanValue\"", pos);
  if (type < 0 || (fieldEnd >= 0 && type > fieldEnd)) return false;
  const int colon = json.indexOf(':', type);
  return json.substring(colon + 1, colon + 6).indexOf("true") >= 0;
}

bool firestoreInt64(const String& json, const char* key, int64_t& out) {
  const int pos = json.indexOf("\"" + String(key) + "\"");
  if (pos < 0) return false;
  const int fieldEnd = json.indexOf('}', pos);
  const int type = json.indexOf("\"integerValue\"", pos);
  if (type < 0 || (fieldEnd >= 0 && type > fieldEnd)) return false;
  const int colon = json.indexOf(':', type);
  int start = colon + 1;
  while (start < static_cast<int>(json.length()) && (json[start] == ' ' || json[start] == '"')) ++start;
  out = strtoll(json.c_str() + start, nullptr, 10);
  return true;
}

String wibDateString() {
  const time_t now = time(nullptr);
  struct tm local{};
  localtime_r(&now, &local);
  char buf[11];
  snprintf(buf, sizeof buf, "%04d-%02d-%02d",
           local.tm_year + 1900, local.tm_mon + 1, local.tm_mday);
  return String(buf);
}

// ---------------------------------------------------------------------------
// Telemetry: buffer RAM kecil, flush atomik via documents:commit +
// appendMissingElements (padanan arrayUnion). Payload per flush tetap kecil.
// ---------------------------------------------------------------------------
constexpr size_t TEL_BUF_SAMPLES = 10;
// Worst case ±260 byte (lux 6 digit, ts 13 digit); 320 memberi margin aman
// agar snprintf tidak pernah memotong fragmen JSON.
constexpr size_t TEL_SAMPLE_CAP = 320;
char g_telBuf[TEL_BUF_SAMPLES][TEL_SAMPLE_CAP];
size_t g_telCount = 0;
uint32_t g_lastTelemetryFlush = 0;

int buildTypedSample(char* buf, size_t cap, int64_t tsEpochMs, const SensorReading& s) {
  return snprintf(buf, cap,
    "\"t\":{\"doubleValue\":%.1f},\"h\":{\"doubleValue\":%.1f},"
    "\"l\":{\"integerValue\":\"%.0f\"},\"s\":{\"doubleValue\":%.1f},"
    "\"gl\":{\"booleanValue\":%s},\"p\":{\"booleanValue\":%s},"
    "\"m\":{\"booleanValue\":%s},\"f\":{\"booleanValue\":%s},"
    "\"ts\":{\"integerValue\":\"%lld\"}",
    s.temperature_c, s.humidity_pct, s.lux, s.soil_pct,
    actuators::isOn(ActuatorKey::GROWLIGHT) ? "true" : "false",
    actuators::isOn(ActuatorKey::PUMP) ? "true" : "false",
    actuators::isOn(ActuatorKey::MIST) ? "true" : "false",
    actuators::isOn(ActuatorKey::FAN) ? "true" : "false",
    static_cast<long long>(tsEpochMs));
}

bool flushTelemetry() {
  if (g_telCount == 0) return true;
  int64_t epochMs = 0;
  uint8_t hour = 0;
  if (!fbsync::timeSynced(epochMs, hour)) return false;
  const String date = wibDateString();
  const String docPath = "devices/" + String(SNOWBERRY_DEVICE_ID) + "/telemetry/" + date;
  String body = "{\"writes\":["
      "{\"update\":{\"name\":\"" + docPath + "\",\"fields\":{"
      "\"device_id\":{\"stringValue\":\"" + String(SNOWBERRY_DEVICE_ID) + "\"},"
      "\"date\":{\"stringValue\":\"" + date + "\"}},"
      "\"updateMask\":{\"fieldPaths\":[\"device_id\",\"date\"]}}},"
      "{\"transform\":{\"document\":\"" + docPath + "\",\"fieldTransforms\":[{"
      "\"fieldPath\":\"d\",\"appendMissingElements\":{\"values\":[";
  for (size_t i = 0; i < g_telCount; ++i) {
    body += "{\"mapValue\":{\"fields\":";
    body += g_telBuf[i];
    body += "}}";
    if (i + 1 < g_telCount) body += ',';
  }
  body += "]}}]}]}";
  String response;
  const int code = apiRequest("POST", ":commit", body.c_str(), response);
  if (code == 200) {
    g_telCount = 0;
    return true;
  }
  return false;  // sample disimpan untuk percobaan berikutnya
}

// ---------------------------------------------------------------------------
// Command cloud: dedupe by command_id, hasil parse dikembalikan ke caller.
// ---------------------------------------------------------------------------
char g_lastCommandId[48] = {0};
}  // namespace

namespace fbsync {
void begin(const Config&) {
  WiFi.mode(WIFI_STA);
  configTime(7 * 3600, 0, "pool.ntp.org", "time.nist.gov");
}
void loop(uint32_t nowMs) {
  g_online = WiFi.status() == WL_CONNECTED;
  if (!g_online && nowMs - g_lastWiFiAttempt >= 10000) {
    g_lastWiFiAttempt = nowMs;
    WiFi.begin(SNOWBERRY_WIFI_SSID, SNOWBERRY_WIFI_PASSWORD);
  }
}
bool online() { return g_online; }
bool timeSynced(int64_t& epochMsOut, uint8_t& hourOut) {
  const time_t now = time(nullptr);
  if (now < 1500000000) return false;
  struct tm local{};
  localtime_r(&now, &local);
  epochMsOut = static_cast<int64_t>(now) * 1000;
  hourOut = local.tm_hour;
  return true;
}
bool fetchThresholds(Thresholds& out) {
  String json;
  const int code = apiRequest("GET",
      "devices/" + String(SNOWBERRY_DEVICE_ID) + "/config/thresholds", nullptr, json);
  if (code != 200) return false;
  Thresholds candidate = out;
  if (!firestoreNumber(json, "soil_low", candidate.soil_low) ||
      !firestoreNumber(json, "soil_high", candidate.soil_high) ||
      !firestoreNumber(json, "rh_low", candidate.rh_low) ||
      !firestoreNumber(json, "rh_high", candidate.rh_high) ||
      !firestoreNumber(json, "lux_low", candidate.lux_low) ||
      !firestoreNumber(json, "lux_high", candidate.lux_high) || !control::validate(candidate)) return false;
  out = candidate;
  return true;
}
void publishStatus(const char* json, uint32_t) {
  if (!json) return;
  String response;
  apiRequest("PATCH", "devices/" + String(SNOWBERRY_DEVICE_ID) + "/status/realtime", json, response);
}

void publishAck(const char* commandId, const char* ackStatus, const char* ackMessage) {
  int64_t epochMs = 0;
  uint8_t hour = 0;
  if (!commandId || !timeSynced(epochMs, hour)) return;
  String payload = "{\"fields\":{\"command_ack\":{\"mapValue\":{\"fields\":{";
  payload += "\"ack_command_id\":{\"stringValue\":\"" + String(commandId) + "\"},";
  payload += "\"ack_status\":{\"stringValue\":\"" + String(ackStatus) + "\"},";
  payload += "\"ack_at\":{\"integerValue\":\"" + String(static_cast<long long>(epochMs)) + "\"},";
  payload += "\"ack_message\":{\"stringValue\":\"" + String(ackMessage ? ackMessage : "") + "\"}";
  payload += "}}},\"last_seen\":{\"integerValue\":\"" + String(static_cast<long long>(epochMs)) + "\"}}}";
  String response;
  // Masked PATCH agar sensors/actuators yang lain tidak tertimpa.
  apiRequest("PATCH",
      "devices/" + String(SNOWBERRY_DEVICE_ID) +
          "/status/realtime?updateMask.fieldPaths=command_ack&updateMask.fieldPaths=last_seen",
      payload.c_str(), response);
}

void appendTelemetry(const SensorReading& s, uint32_t nowMs) {
  // Gap jujur: sample dengan sensor invalid tidak direkam.
  if (!(s.temp_valid && s.rh_valid && s.lux_valid && s.soil_valid)) return;
  int64_t epochMs = 0;
  uint8_t hour = 0;
  if (!timeSynced(epochMs, hour)) return;
  char typed[TEL_SAMPLE_CAP];
  const int written = buildTypedSample(typed, sizeof typed, epochMs, s);
  if (written < 0 || static_cast<size_t>(written) >= sizeof typed) {
    // Fragmen tak muat: lewati sample, jangan pernah buffer JSON terpotong.
    return;
  }
  if (g_telCount == TEL_BUF_SAMPLES) {
    memmove(g_telBuf, g_telBuf[1], (TEL_BUF_SAMPLES - 1) * TEL_SAMPLE_CAP);
    g_telCount--;
  }
  memcpy(g_telBuf[g_telCount++], typed, TEL_SAMPLE_CAP);
  if (nowMs - g_lastTelemetryFlush >= timing::TELEMETRY_FLUSH_INTERVAL_MS) {
    g_lastTelemetryFlush = nowMs;
    flushTelemetry();
  }
}

bool fetchCommand(CloudCommand& out) {
  out = {};
  if (!g_online || !authenticate()) return false;
  String response;
  const int code = apiRequest("GET",
      "devices/" + String(SNOWBERRY_DEVICE_ID) + "/config/commands", nullptr, response);
  if (code != 200) return false;  // 404 = belum ada dokumen command
  const String id = jsonString(response, "command_id");
  if (id.isEmpty() || id.length() >= sizeof(out.command_id)) return false;
  if (id == g_lastCommandId) return false;  // sudah pernah diproses
  const String actuator = jsonString(response, "actuator");
  const String mode = jsonString(response, "mode");
  float num = 0;
  int64_t until = 0;
  firestoreInt64(response, "manual_until", until);
  strlcpy(out.command_id, id.c_str(), sizeof(out.command_id));
  strlcpy(out.actuator, actuator.c_str(), sizeof(out.actuator));
  out.mode_manual = (mode == "MANUAL");
  out.state = firestoreBool(response, "state");
  out.duration_ms = firestoreNumber(response, "manual_duration_ms", num) && num > 0
      ? static_cast<uint32_t>(num) : 0;
  out.manual_until_epoch = until > 0 ? until : 0;
  strlcpy(g_lastCommandId, id.c_str(), sizeof(g_lastCommandId));
  return true;
}

void updateLiveSensors(const SensorReading& s, Fault fault, uint32_t) {
  if (!g_online || !authenticate()) return;
  int64_t epochMs = 0;
  uint8_t hour = 0;
  const bool synced = timeSynced(epochMs, hour);
  char buf[1400];
  const size_t n = status_json::buildStatus(buf, sizeof buf, s, fault,
      SNOWBERRY_FIRMWARE_VERSION, g_online,
      g_online ? WiFi.RSSI() : 0, synced, synced ? epochMs : 0);
  if (n == 0) return;
  String response;
  apiRequest("PATCH", "devices/" + String(SNOWBERRY_DEVICE_ID) + "/status/realtime", buf, response);
}
}
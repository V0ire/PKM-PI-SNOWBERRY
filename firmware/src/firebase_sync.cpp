#include "firebase_sync.h"

#include <Arduino.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>
#include <freertos/task.h>
#include <time.h>

#include "storage.h"

namespace {
constexpr uint32_t HTTP_TIMEOUT_MS = 5000;
constexpr uint32_t CONNECT_TIMEOUT_MS = 3000;
constexpr uint32_t TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;
constexpr uint32_t RETRY_MIN_MS = 2000;
constexpr uint32_t RETRY_MAX_MS = 60000;
constexpr size_t TELEMETRY_CAPACITY = 10;
constexpr size_t JSON_CAPACITY = 8192;
constexpr const char* ACK_APPLIED = "APPLIED";
constexpr const char* ACK_REJECTED_SAFETY = "REJECTED_SAFETY";
constexpr const char* ACK_EXPIRED = "EXPIRED";
constexpr const char* ACK_INVALID = "INVALID";

// GTS Root R1. Public trust anchor, not a credential.
const char GOOGLE_ROOT_CA[] PROGMEM = R"EOF(-----BEGIN CERTIFICATE-----
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

struct RuntimeConfig {
  String wifi_ssid, wifi_pass, email, password, api_key, project_id, device_id;
  uint32_t status_ms = 60000, telemetry_ms = 60000, command_ms = 10000, threshold_ms = 60000;
};
struct PendingAck { String id, status, message; bool ready = false; };

RuntimeConfig cfg;
Preferences prefs;
SemaphoreHandle_t lockHandle = nullptr;
TaskHandle_t workerHandle = nullptr;
Thresholds thresholdSlot;
bool thresholdReady = false;
control::ManualCommand commandSlot;
String commandIdSlot;
bool commandReady = false;
String statusSlot;
bool statusReady = false;
PendingAck ackSlot;
String telemetry[TELEMETRY_CAPACITY];
size_t telemetryCount = 0;
String idToken, refreshToken, lastCommandId;
uint32_t tokenExpiresAt = 0;
bool firebaseOnline = false;
uint32_t nextRetryAt = 0, retryMs = RETRY_MIN_MS;
uint32_t lastStatusAt = 0, lastTelemetryAt = 0, lastCommandAt = 0, lastThresholdAt = 0;

class Guard {
 public:
  Guard() { if (lockHandle) xSemaphoreTake(lockHandle, portMAX_DELAY); }
  ~Guard() { if (lockHandle) xSemaphoreGive(lockHandle); }
};

String nvsOr(const char* key, const char* supplied) {
  return supplied && supplied[0] ? String(supplied) : prefs.getString(key, "");
}

bool due(uint32_t now, uint32_t then, uint32_t interval) {
  return static_cast<uint32_t>(now - then) >= interval;
}

String urlEncode(const String& input) {
  const char* hex = "0123456789ABCDEF";
  String out;
  for (size_t i = 0; i < input.length(); ++i) {
    const uint8_t c = static_cast<uint8_t>(input[i]);
    if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') out += static_cast<char>(c);
    else { out += '%'; out += hex[c >> 4]; out += hex[c & 15]; }
  }
  return out;
}

bool request(const String& method, const String& url, const String& body, String& response,
             bool authenticated = true, const char* contentType = "application/json") {
  WiFiClientSecure client;
  client.setCACert(GOOGLE_ROOT_CA);
  client.setHandshakeTimeout(5);
  HTTPClient http;
  http.setConnectTimeout(CONNECT_TIMEOUT_MS);
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(client, url)) return false;
  http.addHeader("Content-Type", contentType);
  if (authenticated && idToken.length()) http.addHeader("Authorization", "Bearer " + idToken);
  int code = -1;
  if (method == "GET") code = http.GET();
  else if (method == "PATCH") code = http.PATCH(body);
  else if (method == "POST") code = http.POST(body);
  response = http.getString();
  http.end();
  return code >= 200 && code < 300;
}

bool signIn() {
  JsonDocument body;
  body["email"] = cfg.email;
  body["password"] = cfg.password;
  body["returnSecureToken"] = true;
  String payload, response;
  serializeJson(body, payload);
  const String url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + urlEncode(cfg.api_key);
  if (!request("POST", url, payload, response, false)) return false;
  JsonDocument result;
  if (deserializeJson(result, response)) return false;
  idToken = result["idToken"].as<String>();
  refreshToken = result["refreshToken"].as<String>();
  const uint32_t expires = result["expiresIn"].as<uint32_t>();
  if (!idToken.length() || !refreshToken.length() || expires < 60) return false;
  tokenExpiresAt = millis() + expires * 1000UL;
  return true;
}

bool refreshAuth() {
  String response;
  const String body = "grant_type=refresh_token&refresh_token=" + urlEncode(refreshToken);
  const String url = "https://securetoken.googleapis.com/v1/token?key=" + urlEncode(cfg.api_key);
  if (!request("POST", url, body, response, false, "application/x-www-form-urlencoded")) return false;
  JsonDocument result;
  if (deserializeJson(result, response)) return false;
  idToken = result["id_token"].as<String>();
  refreshToken = result["refresh_token"].as<String>();
  const uint32_t expires = result["expires_in"].as<uint32_t>();
  if (!idToken.length() || !refreshToken.length() || expires < 60) return false;
  tokenExpiresAt = millis() + expires * 1000UL;
  return true;
}

String documentUrl(const String& suffix) {
  return "https://firestore.googleapis.com/v1/projects/" + urlEncode(cfg.project_id) +
         "/databases/(default)/documents/devices/" + urlEncode(cfg.device_id) + suffix;
}

JsonVariantConst valueOf(JsonObjectConst fields, const char* key) {
  JsonObjectConst wrapper = fields[key].as<JsonObjectConst>();
  if (!wrapper["doubleValue"].isNull()) return wrapper["doubleValue"];
  if (!wrapper["integerValue"].isNull()) return wrapper["integerValue"];
  if (!wrapper["booleanValue"].isNull()) return wrapper["booleanValue"];
  if (!wrapper["stringValue"].isNull()) return wrapper["stringValue"];
  return JsonVariantConst();
}

bool hasAllConfigFields(JsonObjectConst f) {
  const char* names[] = {"config_id","soil_low","soil_high","rh_low","rh_high",
    "temperature_influence","temp_low","temp_high","humidifier_priority",
    "temperature_failure_fallback","lux_low","lux_high","light_schedule_enabled",
    "light_schedule_start_hour","light_schedule_end_hour","pump_pulse_ms",
    "soak_period_ms","pump_start_limit","pump_window_ms","planting_date","updated_at","updated_by"};
  for (const char* name : names) if (valueOf(f, name).isNull()) return false;
  return true;
}

bool parseThresholds(const String& json, Thresholds& out) {
  JsonDocument doc;
  if (deserializeJson(doc, json)) return false;
  JsonObjectConst f = doc["fields"];
  if (!f || !hasAllConfigFields(f)) return false;
  Thresholds t;
  const String id = valueOf(f, "config_id").as<String>();
  if (!id.length() || id.length() >= sizeof(t.config_id)) return false;
  strlcpy(t.config_id, id.c_str(), sizeof(t.config_id));
  t.soil_low = valueOf(f,"soil_low").as<float>(); t.soil_high = valueOf(f,"soil_high").as<float>();
  t.rh_low = valueOf(f,"rh_low").as<float>(); t.rh_high = valueOf(f,"rh_high").as<float>();
  t.temperature_influence = valueOf(f,"temperature_influence").as<bool>();
  t.temp_low = valueOf(f,"temp_low").as<float>(); t.temp_high = valueOf(f,"temp_high").as<float>();
  const String priority = valueOf(f,"humidifier_priority").as<String>();
  const String fallback = valueOf(f,"temperature_failure_fallback").as<String>();
  if (priority == "RH") t.humidifier_priority = HumidifierPriority::RH;
  else if (priority == "TEMPERATURE") t.humidifier_priority = HumidifierPriority::TEMPERATURE;
  else return false;
  if (fallback == "OFF") t.temperature_failure_fallback = TemperatureFailureFallback::OFF;
  else if (fallback == "RH_ONLY") t.temperature_failure_fallback = TemperatureFailureFallback::RH_ONLY;
  else return false;
  t.lux_low = valueOf(f,"lux_low").as<float>(); t.lux_high = valueOf(f,"lux_high").as<float>();
  t.light_schedule_enabled = valueOf(f,"light_schedule_enabled").as<bool>();
  t.light_schedule_start_hour = valueOf(f,"light_schedule_start_hour").as<uint8_t>();
  t.light_schedule_end_hour = valueOf(f,"light_schedule_end_hour").as<uint8_t>();
  t.pump_pulse_ms = valueOf(f,"pump_pulse_ms").as<uint32_t>();
  t.soak_period_ms = valueOf(f,"soak_period_ms").as<uint32_t>();
  t.pump_start_limit = valueOf(f,"pump_start_limit").as<uint8_t>();
  t.pump_window_ms = valueOf(f,"pump_window_ms").as<uint32_t>();
  // Calibration fields deliberately remain local values loaded from current NVS.
  Thresholds local;
  if (storage::loadThresholds(local)) {
    t.soil_adc_dry = local.soil_adc_dry; t.soil_adc_wet = local.soil_adc_wet;
    t.calibration_source = local.calibration_source;
  }
  if (!control::validate(t) || !storage::saveThresholds(t)) return false;
  Thresholds verified;
  if (!storage::loadThresholds(verified) || strcmp(verified.config_id, t.config_id) != 0) return false;
  out = verified;
  return true;
}

uint32_t commandToken(const String& id) {
  uint32_t hash = 2166136261UL;
  for (size_t i = 0; i < id.length(); ++i) { hash ^= static_cast<uint8_t>(id[i]); hash *= 16777619UL; }
  return hash ? hash : 1;
}

void queueAck(const String& id, const char* status, const char* message) {
  Guard guard;
  ackSlot.id = id;
  ackSlot.status = status;
  ackSlot.message = message;
  ackSlot.ready = true;
}

bool parseCommand(const String& json, control::ManualCommand& out, String& idOut) {
  JsonDocument doc;
  if (deserializeJson(doc, json)) return false;
  JsonObjectConst f = doc["fields"];
  const char* required[] = {"command_id","actuator","mode","state","manual_until","issued_at","issued_by"};
  for (const char* name : required) if (valueOf(f,name).isNull()) return false;
  const String id = valueOf(f,"command_id").as<String>();
  if (!id.length() || id.length() > 128 || id == lastCommandId) return false;
  control::ManualCommand c;
  const String actuator = valueOf(f,"actuator").as<String>();
  if (actuator == "growlight") c.key = ActuatorKey::GROWLIGHT;
  else if (actuator == "pump") c.key = ActuatorKey::PUMP;
  else if (actuator == "humidifier") c.key = ActuatorKey::HUMIDIFIER;
  else { queueAck(id,ACK_INVALID,"actuator invalid"); return false; }
  const String mode = valueOf(f,"mode").as<String>();
  if (mode == "AUTO") c.mode = Mode::AUTO;
  else if (mode == "MANUAL") c.mode = Mode::MANUAL;
  else { queueAck(id,ACK_INVALID,"mode invalid"); return false; }
  c.state = valueOf(f,"state").as<bool>();
  c.manual_until_epoch = valueOf(f,"manual_until").as<int64_t>();
  const int64_t issuedAt = valueOf(f,"issued_at").as<int64_t>();
  const int64_t nowEpoch = static_cast<int64_t>(time(nullptr)) * 1000;
  if (nowEpoch < 1600000000000LL || issuedAt <= 0) { queueAck(id,ACK_INVALID,"time unavailable"); return false; }
  if (c.mode == Mode::MANUAL && c.state) {
    if (c.manual_until_epoch <= nowEpoch) { queueAck(id,ACK_EXPIRED,"command expired"); return false; }
    const int64_t duration = c.manual_until_epoch - nowEpoch;
    if (c.key != ActuatorKey::PUMP && duration > 30 * 60 * 1000LL) {
      queueAck(id,ACK_REJECTED_SAFETY,"manual duration exceeds 30 minutes"); return false;
    }
    c.duration_ms = c.key == ActuatorKey::PUMP ? 0 : static_cast<uint32_t>(duration);
  }
  c.valid = true; c.received_at_ms = millis(); c.command_id = commandToken(id);
  lastCommandId = id;
  prefs.putString("last_command_id", lastCommandId);
  out = c; idOut = id;
  return true;
}

void firestoreValue(JsonVariant dst, JsonVariantConst src) {
  if (src.is<JsonObjectConst>()) {
    JsonObject map = dst["mapValue"]["fields"].to<JsonObject>();
    for (JsonPairConst kv : src.as<JsonObjectConst>()) firestoreValue(map[kv.key()], kv.value());
  } else if (src.is<JsonArrayConst>()) {
    JsonArray values = dst["arrayValue"]["values"].to<JsonArray>();
    for (JsonVariantConst item : src.as<JsonArrayConst>()) firestoreValue(values.add<JsonVariant>(), item);
  } else if (src.is<bool>()) dst["booleanValue"] = src.as<bool>();
  else if (src.is<long long>()) dst["integerValue"] = String(src.as<long long>());
  else if (src.is<double>()) dst["doubleValue"] = src.as<double>();
  else if (src.is<const char*>()) dst["stringValue"] = src.as<const char*>();
  else dst["nullValue"] = nullptr;
}

bool encodeDocument(const String& plain, String& encoded) {
  JsonDocument source, target;
  if (deserializeJson(source, plain) || !source.is<JsonObject>()) return false;
  JsonObject fields = target["fields"].to<JsonObject>();
  for (JsonPairConst kv : source.as<JsonObjectConst>()) firestoreValue(fields[kv.key()], kv.value());
  serializeJson(target, encoded);
  return true;
}

bool fetchThresholdDocument() {
  String response;
  if (!request("GET", documentUrl("/config/thresholds"), "", response)) return false;
  Thresholds parsed;
  if (!parseThresholds(response, parsed)) return false;
  Guard guard; thresholdSlot = parsed; thresholdReady = true; return true;
}

bool fetchCommandDocument() {
  String response;
  if (!request("GET", documentUrl("/config/commands"), "", response)) return false;
  control::ManualCommand parsed; String id;
  if (!parseCommand(response, parsed, id)) return true;
  Guard guard; commandSlot = parsed; commandIdSlot = id; commandReady = true; return true;
}

bool patchPlain(const String& suffix, const String& plain) {
  String encoded, response;
  return encodeDocument(plain, encoded) && request("PATCH", documentUrl(suffix), encoded, response);
}

bool flushAck() {
  PendingAck ack;
  { Guard guard; if (!ackSlot.ready) return true; ack = ackSlot; }
  JsonDocument plain;
  plain["command_ack"]["ack_command_id"] = ack.id;
  plain["command_ack"]["ack_status"] = ack.status;
  plain["command_ack"]["ack_message"] = ack.message;
  plain["command_ack"]["ack_at"] = static_cast<int64_t>(time(nullptr)) * 1000;
  String json; serializeJson(plain, json);
  if (!patchPlain("/status/realtime?updateMask.fieldPaths=command_ack", json)) return false;
  Guard guard; if (ackSlot.id == ack.id) ackSlot.ready = false; return true;
}

bool flushStatus() {
  String status;
  { Guard guard; if (!statusReady) return true; status = statusSlot; }
  if (!patchPlain("/status/realtime", status)) return false;
  Guard guard; if (statusSlot == status) statusReady = false; return true;
}

bool flushTelemetry() {
  String samples[TELEMETRY_CAPACITY]; size_t count;
  { Guard guard; count = telemetryCount; for (size_t i=0;i<count;i++) samples[i]=telemetry[i]; }
  if (!count) return true;
  char date[11] = "1970-01-01"; time_t now=time(nullptr); struct tm tmv{}; localtime_r(&now,&tmv); strftime(date,sizeof(date),"%Y-%m-%d",&tmv);
  const String name = "projects/" + cfg.project_id + "/databases/(default)/documents/devices/" +
                      cfg.device_id + "/telemetry/" + date;
  JsonDocument commit;
  JsonObject update = commit["writes"].add<JsonObject>()["update"].to<JsonObject>();
  update["name"] = name;
  update["fields"]["device_id"]["stringValue"] = cfg.device_id;
  update["fields"]["date"]["stringValue"] = date;
  JsonArray mask = commit["writes"][0]["updateMask"]["fieldPaths"].to<JsonArray>();
  mask.add("device_id"); mask.add("date");
  JsonObject transform = commit["writes"].add<JsonObject>()["transform"].to<JsonObject>();
  transform["document"] = name;
  JsonObject fieldTransform = transform["fieldTransforms"].add<JsonObject>();
  fieldTransform["fieldPath"] = "d";
  JsonArray values = fieldTransform["appendMissingElements"]["values"].to<JsonArray>();
  for (size_t i=0;i<count;i++) {
    JsonDocument sample;
    if (!deserializeJson(sample,samples[i])) firestoreValue(values.add<JsonVariant>(), sample.as<JsonVariantConst>());
  }
  String json, response; serializeJson(commit,json);
  const String url = "https://firestore.googleapis.com/v1/projects/" + urlEncode(cfg.project_id) +
                     "/databases/(default)/documents:commit";
  if (!request("POST",url,json,response)) return false;
  Guard guard;
  if (telemetryCount >= count) { for(size_t i=count;i<telemetryCount;i++) telemetry[i-count]=telemetry[i]; telemetryCount-=count; }
  return true;
}

void backoff(uint32_t now) {
  firebaseOnline = false; nextRetryAt = now + retryMs; retryMs = min(retryMs * 2, RETRY_MAX_MS);
}

void worker(void*) {
  configTime(0, 0, "pool.ntp.org", "time.google.com");
  for (;;) {
    const uint32_t now = millis();
    if (WiFi.status() != WL_CONNECTED || !cfg.email.length() || !cfg.api_key.length()) {
      firebaseOnline = false; vTaskDelay(pdMS_TO_TICKS(500)); continue;
    }
    if (static_cast<int32_t>(now - nextRetryAt) < 0) { vTaskDelay(pdMS_TO_TICKS(100)); continue; }
    bool authOk = idToken.length();
    if (authOk && static_cast<int32_t>(tokenExpiresAt - now) <= static_cast<int32_t>(TOKEN_REFRESH_MARGIN_MS)) authOk = refreshAuth();
    if (!authOk) authOk = signIn();
    if (!authOk) { backoff(now); continue; }
    bool ok = true;
    if (due(now,lastThresholdAt,cfg.threshold_ms)) { lastThresholdAt=now; ok=fetchThresholdDocument() && ok; }
    if (due(now,lastCommandAt,cfg.command_ms)) { lastCommandAt=now; ok=fetchCommandDocument() && ok; }
    if (due(now,lastStatusAt,cfg.status_ms)) { lastStatusAt=now; ok=flushStatus() && ok; }
    if (due(now,lastTelemetryAt,cfg.telemetry_ms)) { lastTelemetryAt=now; ok=flushTelemetry() && ok; }
    ok = flushAck() && ok;
    if (ok) { firebaseOnline=true; retryMs=RETRY_MIN_MS; nextRetryAt=now; }
    else backoff(now);
    vTaskDelay(pdMS_TO_TICKS(50));
  }
}
}  // namespace

namespace fbsync {
void begin(const Config& input) {
  if (workerHandle) return;
  lockHandle = xSemaphoreCreateMutex();
  prefs.begin("firebase", false);
  cfg.wifi_ssid=nvsOr("wifi_ssid",input.wifi_ssid); cfg.wifi_pass=nvsOr("wifi_pass",input.wifi_pass);
  cfg.email=nvsOr("device_email",input.device_email); cfg.password=nvsOr("device_pass",input.device_pass);
  cfg.api_key=nvsOr("api_key",input.api_key); cfg.project_id=nvsOr("project_id",input.project_id);
  cfg.device_id=nvsOr("device_id",input.device_id); lastCommandId=prefs.getString("last_command_id","");
  cfg.status_ms=input.status_interval_ms; cfg.telemetry_ms=input.telemetry_interval_ms;
  cfg.command_ms=input.command_poll_ms; cfg.threshold_ms=input.threshold_poll_ms;
  if (cfg.wifi_ssid.length()) { WiFi.mode(WIFI_STA); WiFi.begin(cfg.wifi_ssid.c_str(),cfg.wifi_pass.c_str()); }
  xTaskCreatePinnedToCore(worker,"firebase",12288,nullptr,1,&workerHandle,0);
}
void loop(uint32_t) { /* Network work lives on dedicated FreeRTOS worker. */ }
bool online() { return firebaseOnline && WiFi.status()==WL_CONNECTED; }
bool timeSynced(int64_t& epochMsOut,uint8_t& hourOut) {
  time_t now=time(nullptr); if(now<1600000000) return false; struct tm tmv{}; localtime_r(&now,&tmv);
  epochMsOut=static_cast<int64_t>(now)*1000; hourOut=tmv.tm_hour; return true;
}
bool pollCommand(control::ManualCommand& out,char* lastIdOut,size_t idCap) {
  Guard guard; if(!commandReady) return false; out=commandSlot;
  if(lastIdOut&&idCap) strlcpy(lastIdOut,commandIdSlot.c_str(),idCap); commandReady=false; return true;
}
bool fetchThresholds(Thresholds& out) { Guard guard; if(!thresholdReady)return false; out=thresholdSlot; thresholdReady=false; return true; }
void publishStatus(const char* json,uint32_t) { if(!json)return; Guard guard; statusSlot=json; statusReady=true; }
void publishAck(const char* commandId,const char* ackStatus,const char* ackMessage) {
  if(!commandId||!ackStatus)return; queueAck(commandId,ackStatus,ackMessage?ackMessage:"");
}
void appendTelemetry(const char* sampleJson,uint32_t) {
  if(!sampleJson)return; Guard guard;
  if(telemetryCount==TELEMETRY_CAPACITY) { for(size_t i=1;i<telemetryCount;i++)telemetry[i-1]=telemetry[i]; --telemetryCount; }
  telemetry[telemetryCount++]=sampleJson;
}
}  // namespace fbsync

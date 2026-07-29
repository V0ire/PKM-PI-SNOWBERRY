#include <Arduino.h>
#include <WebServer.h>
#include <WiFi.h>

#if __has_include("firebase_config.local.h")
#include "firebase_config.local.h"
#else
#include "firebase_config.example.h"
#endif

namespace {
constexpr uint32_t TEST_ON_MAX_MS = 5000;
constexpr uint32_t WIFI_RETRY_MS = 10000;

struct Channel {
  uint8_t pin;
  const char* name;
  bool on;
  uint32_t offAtMs;
};

Channel channels[] = {
    {16, "Growlight SSR", false, 0}, {17, "Pump relay", false, 0},
    {18, "Mist 1 relay", false, 0},  {19, "Fan 1 relay", false, 0},
    {23, "Mist 2 relay", false, 0},  {32, "Fan 2 relay", false, 0},
    {25, "Spare SSR", false, 0},
};

WebServer server(80);
uint32_t lastWiFiAttemptMs = 0;

void writeChannel(Channel& channel, bool on) {
  channel.on = on;
  channel.offAtMs = on ? millis() + TEST_ON_MAX_MS : 0;
  digitalWrite(channel.pin, on ? HIGH : LOW);
  Serial.printf("GPIO %u - %s: %s\n", channel.pin, channel.name, on ? "ON" : "OFF");
}

void allOff() {
  for (auto& channel : channels) writeChannel(channel, false);
}

Channel* findChannel(uint8_t pin) {
  for (auto& channel : channels) {
    if (channel.pin == pin) return &channel;
  }
  return nullptr;
}

String statusJson() {
  String json = "{\"ok\":true,\"warning\":\"commanded GPIO state only; physical operation is not verified\",\"max_on_ms\":";
  json += TEST_ON_MAX_MS;
  json += ",\"channels\":[";
  for (size_t i = 0; i < sizeof(channels) / sizeof(channels[0]); i++) {
    if (i) json += ',';
    json += "{\"pin\":" + String(channels[i].pin) + ",\"name\":\"" + channels[i].name +
            "\",\"on\":" + String(channels[i].on ? "true" : "false") + "}";
  }
  json += "]}";
  return json;
}

void sendJson(int code, const String& body) {
  server.sendHeader("Cache-Control", "no-store");
  server.send(code, "application/json", body);
}

void handleChannel() {
  if (!server.hasArg("pin")) {
    sendJson(400, "{\"ok\":false,\"error\":\"missing pin\"}");
    return;
  }
  Channel* channel = findChannel(static_cast<uint8_t>(server.arg("pin").toInt()));
  if (!channel) {
    sendJson(404, "{\"ok\":false,\"error\":\"unknown pin\"}");
    return;
  }

  allOff();  // Test guard: only one channel may be ON.
  writeChannel(*channel, true);
  sendJson(200, statusJson());
}

void handleRoot() {
  server.send(200, "text/html",
              "<!doctype html><meta name=viewport content='width=device-width'><title>Snowberry actuator test</title>"
              "<style>body{font:18px system-ui;max-width:38rem;margin:2rem auto;padding:0 1rem}button{font:inherit;margin:.35rem;padding:.7rem}"
              ".off{background:#b00020;color:white}</style><h1>Snowberry online actuator test</h1>"
              "<p>Each channel turns ON for at most 5 seconds. Only one can be ON.</p>"
              "<button onclick=off() class=off>ALL OFF</button><div id=b></div><pre id=s></pre>"
              "<script>const pins=[16,17,18,19,23,32,25];b.innerHTML=pins.map(p=>`<button onclick=on(${p})>Test GPIO ${p}</button>`).join('');"
              "async function on(p){await fetch('/api/channel?pin='+p,{method:'POST'});status()}"
              "async function off(){await fetch('/api/all-off',{method:'POST'});status()}"
              "async function status(){s.textContent=JSON.stringify(await(await fetch('/api/status')).json(),null,2)}status();setInterval(status,1000)</script>");
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(SNOWBERRY_WIFI_SSID, SNOWBERRY_WIFI_PASSWORD);
  Serial.printf("[actuator-test] Connecting to %s", SNOWBERRY_WIFI_SSID);
  for (uint8_t i = 0; i < 20 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500);
    Serial.print('.');
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED)
    Serial.printf("[actuator-test] Open http://%s/\n", WiFi.localIP().toString().c_str());
}
}  // namespace

void setup() {
  // Latch every Rev B active-HIGH output OFF before enabling output mode.
  for (auto& channel : channels) digitalWrite(channel.pin, LOW);
  for (auto& channel : channels) pinMode(channel.pin, OUTPUT);

  Serial.begin(115200);
  delay(100);
  allOff();
  connectWiFi();

  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/status", HTTP_GET, [] { sendJson(200, statusJson()); });
  server.on("/api/channel", HTTP_POST, handleChannel);
  server.on("/api/all-off", HTTP_POST, [] {
    allOff();
    sendJson(200, statusJson());
  });
  server.begin();
}

void loop() {
  const uint32_t now = millis();
  for (auto& channel : channels) {
    if (channel.on && static_cast<int32_t>(now - channel.offAtMs) >= 0) writeChannel(channel, false);
  }

  if (WiFi.status() != WL_CONNECTED && now - lastWiFiAttemptMs >= WIFI_RETRY_MS) {
    allOff();
    lastWiFiAttemptMs = now;
    WiFi.disconnect();
    WiFi.begin(SNOWBERRY_WIFI_SSID, SNOWBERRY_WIFI_PASSWORD);
  }
  server.handleClient();
}

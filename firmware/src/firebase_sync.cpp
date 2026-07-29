#include "firebase_sync.h"
#include <Arduino.h>
#include <WiFi.h>
#include <time.h>
#if __has_include("firebase_config.local.h")
#include "firebase_config.local.h"
#else
#include "firebase_config.example.h"
#endif

namespace {
bool g_wifiConnected=false;
uint32_t g_nextRetry=0;
uint32_t g_retryMs=5000;
uint32_t g_wifiAttempts=0;
uint32_t g_networkOperations=0;
uint32_t g_networkFailures=0;

void connectWiFi(uint32_t nowMs) {
  if (WiFi.status()==WL_CONNECTED) {
    g_wifiConnected=true;
    g_retryMs=5000;
    return;
  }
  g_wifiConnected=false;
  if (static_cast<int32_t>(nowMs-g_nextRetry)<0) return;
  ++g_wifiAttempts;
  WiFi.begin(SNOWBERRY_WIFI_SSID,SNOWBERRY_WIFI_PASSWORD);
  g_nextRetry=nowMs+g_retryMs;
  if (g_retryMs<300000) g_retryMs*=2;
}
}  // namespace

namespace fbsync {
void begin(const Config&) {
  WiFi.mode(WIFI_STA);
  connectWiFi(millis());
  configTime(0,0,"pool.ntp.org","time.nist.gov");
  Serial.println("[firebase] Remote control disabled until authenticated device provisioning.");
}

void loop(uint32_t nowMs) { connectWiFi(nowMs); }

// Firebase is deliberately not ready: no unauthenticated Firestore operation is permitted.
bool online() { return false; }

bool timeSynced(int64_t& epochMsOut,uint8_t& hourOut) {
  const time_t now=time(nullptr);
  if (!g_wifiConnected || now<1500000000) return false;
  epochMsOut=static_cast<int64_t>(now)*1000;
  hourOut=static_cast<uint8_t>(((now/3600)+7)%24);
  return true;
}

bool pollCommand(control::ManualCommand&,char*,size_t) { return false; }
bool fetchThresholds(Thresholds&) { return false; }
void publishStatus(const char*,uint32_t) {}
void publishAck(const char*,const char*,const char*) {}
void appendTelemetry(const char*,uint32_t) {}
void updateLiveSensors(const SensorReading&,Fault,uint32_t) {}

Diagnostics diagnostics() {
  Diagnostics d;
  d.wifi_connected=g_wifiConnected;
  d.firebase_authenticated=false;
  d.ntp_synced=time(nullptr)>=1500000000;
  d.wifi_attempts=g_wifiAttempts;
  d.network_operations=g_networkOperations;
  d.network_failures=g_networkFailures;
  return d;
}
}  // namespace fbsync

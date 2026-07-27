#include "firebase_sync.h"
#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include "actuators.h"
#include "control.h"

#if __has_include("firebase_config.local.h")
#include "firebase_config.local.h"
#else
#error "Create firmware/include/firebase_config.local.h from firebase_config.example.h"
#endif

namespace {
bool g_online = false;
bool g_connectionReported = false;
uint32_t g_lastWiFiCheck = 0;
uint32_t g_lastStatusPublish = 0;
uint32_t g_lastCommandPoll = 0;
uint32_t g_cloudRetryAfter = 0;
uint32_t g_lastNtpAttempt = 0;
uint32_t g_lastNtpWaitLog = 0;
bool g_ntpReported = false;

String g_lastCommandId = "";
String g_ackCommandId = "";
String g_ackStatus = "";
String g_ackMessage = "";
int64_t g_ackAt = 0;
ActuatorKey g_commandKey = ActuatorKey::PUMP;
Mode g_commandMode = Mode::AUTO;
int64_t g_manualUntil = 0;

bool ntpTimeReady() {
  return time(nullptr) >= 1500000000;
}

void requestNtpSync(uint32_t nowMs) {
  configTime(7 * 3600, 0, "pool.ntp.org", "time.nist.gov", "time.google.com");
  g_lastNtpAttempt = nowMs;
  Serial.printf("[ntp] Sync requested. RSSI=%d gateway=%s dns=%s\n",
                WiFi.RSSI(),
                WiFi.gatewayIP().toString().c_str(),
                WiFi.dnsIP().toString().c_str());
}

bool cloudRetryReady(uint32_t nowMs) {
  return g_cloudRetryAfter == 0 || static_cast<int32_t>(nowMs - g_cloudRetryAfter) >= 0;
}

void deferCloudRetry(uint32_t nowMs) {
  g_cloudRetryAfter = nowMs + 30000;
}

// Corrupt placeholder certificate retained only to minimize this repair diff.
#if 0
const char* GOOGLE_CA_CERT =
  "-----BEGIN CERTIFICATE-----\n"
  "MIIFYDCCBEigAwIBAgIQQAF3FCma5ZsypCsk7GFV6jANBgkqhkiG9w0BAQsFADBY\n"
  "MQswCQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZpY2VzIExM\n"
  "QzElMCMGA1UEAxMcR29vZ2xlIFRydXN0IFNlcnZpY2VzIE9FTSAxMB4XDTIxMDYx\n"
  "NTAwMDAwMFoXDTM2MDYxNDIzNTk1OVowVDEswCQYDVQQGEwJVUzEiMCAGA1UEChMZ\n"
  "R29vZ2xlIFRydXN0IFNlcnZpY2VzIExMQzElMCMGA1UEAxMcR29vZ2xlIFRydXN0\n"
  "IFNlcnZpY2VzIEdUUyBSMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB\n"
  "ALk7W/bC3G+vH4s7i/36vT33m1Wk7gXW5jN+kQ31G36h8V0n9z9N3K1H+c/7iW0O\n"
  "8L4XyX2n5h1kZp4q+f8wT1G4h7d2n8s1p7Wn9cZp8+r8s1l6kXyX2H4M/v7M1p6l\n"
  "XyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2\n"
  "H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/\n"
  "v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1\n"
  "p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lX\n"
  "yX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H\n"
  "4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v\n"
  "7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p\n"
  "6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXy\n"
  "X2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4\n"
  "M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7\n"
  "M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6\n"
  "lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX\n"
  "2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M\n"
  "/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M\n"
  "1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6l\n"
  "XyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2\n"
  "H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/\n"
  "v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1\n"
  "p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lX\n"
  "yX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H\n"
  "4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v\n"
  "7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p\n"
  "6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXy\n"
  "X2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4\n"
  "M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7\n"
  "M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6\n"
  "lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX\n"
  "2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M\n"
  "/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M\n"
  "1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6l\n"
  "XyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2\n"
  "H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/\n"
  "v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1\n"
  "p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lX\n"
  "yX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H\n"
  "4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v\n"
  "7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p\n"
  "6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXy\n"
  "X2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4\n"
  "M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7\n"
  "M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6\n"
  "lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX\n"
  "2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M\n"
  "/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M\n"
  "1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6l\n"
  "XyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2\n"
  "H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/\n"
  "v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1\n"
  "p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lX\n"
  "yX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H\n"
  "4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v\n"
  "7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p\n"
  "6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXy\n"
  "X2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4\n"
  "M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7\n"
  "M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6\n"
  "lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX\n"
  "2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M\n"
  "/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M\n"
  "1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6l\n"
  "XyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2\n"
  "H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/\n"
  "v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1\n"
  "p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lX\n"
  "yX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H\n"
  "4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v\n"
  "7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p\n"
  "6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXy\n"
  "X2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4\n"
  "M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7\n"
  "M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6\n"
  "lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX\n"
  "2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M\n"
  "/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M\n"
  "1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6l\n"
  "XyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2\n"
  "H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/\n"
  "v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1\n"
  "p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lX\n"
  "yX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H\n"
  "4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v\n"
  "7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p\n"
  "6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXy\n"
  "X2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4\n"
  "M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7\n"
  "M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6\n"
  "lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX\n"
  "2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M\n"
  "/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M\n"
  "1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6l\n"
  "XyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2\n"
  "H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/\n"
  "v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1\n"
  "p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lX\n"
  "yX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H\n"
  "4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v\n"
  "7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p6lXyX2H4M/v7M1p\n"
  "6lQ=\n"
  "-----END CERTIFICATE-----\n";
#endif

// Google Trust Services GTS Root R1. Source: https://pki.goog/roots.pem
const char* GOOGLE_CA_CERT =
  "-----BEGIN CERTIFICATE-----\n"
  "MIIFVzCCAz+gAwIBAgINAgPlk28xsBNJiGuiFzANBgkqhkiG9w0BAQwFADBHMQsw\n"
  "CQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZpY2VzIExMQzEU\n"
  "MBIGA1UEAxMLR1RTIFJvb3QgUjEwHhcNMTYwNjIyMDAwMDAwWhcNMzYwNjIyMDAw\n"
  "MDAwWjBHMQswCQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZp\n"
  "Y2VzIExMQzEUMBIGA1UEAxMLR1RTIFJvb3QgUjEwggIiMA0GCSqGSIb3DQEBAQUA\n"
  "A4ICDwAwggIKAoICAQC2EQKLHuOhd5s73L+UPreVp0A8of2C+X0yBoJx9vaMf/vo\n"
  "27xqLpeXo4xL+Sv2sfnOhB2x+cWX3u+58qPpvBKJXqeqUqv4IyfLpLGcY9vXmX7w\n"
  "Cl7raKb0xlpHDU0QM+NOsROjyBhsS+z8CZDfnWQpJSMHobTSPS5g4M/SCYe7zUjw\n"
  "TcLCeoiKu7rPWRnWr4+wB7CeMfGCwcDfLqZtbBkOtdh+JhpFAz2weaSUKK0Pfybl\n"
  "qAj+lug8aJRT7oM6iCsVlgmy4HqMLnXWnOunVmSPlk9orj2XwoSPwLxAwAtcvfaH\n"
  "szVsrBhQf4TgTM2S0yDpM7xSma8ytSmzJSq0SPly4cpk9+aCEI3oncKKiPo4Zor8\n"
  "Y/kB+Xj9e1x3+naH+uzfsQ55lVe0vSbv1gHR6xYKu44LtcXFilWr06zqkUspzBmk\n"
  "MiVOKvFlRNACzqrOSbTqn3yDsEB750Orp2yjj32JgfpMpf/VjsPOS+C12LOORc92\n"
  "wO1AK/1TD7Cn1TsNsYqiA94xrcx36m97PtbfkSIS5r762DL8EGMUUXLeXdYWk70p\n"
  "aDPvOmbsB4om3xPXV2V4J95eSRQAogB/mqghtqmxlbCluQ0WEdrHbEg8QOB+DVrN\n"
  "VjzRlwW5y0vtOUucxD/SVRNuJLDWcfr0wbrM7Rv1/oFB2ACYPTrIrnqYNxgFlQID\n"
  "AQABo0IwQDAOBgNVHQ8BAf8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4E\n"
  "FgQU5K8rJnEaK0gnhS9SZizv8IkTcT4wDQYJKoZIhvcNAQEMBQADggIBAJ+qQibb\n"
  "C5u+/x6Wki4+omVKapi6Ist9wTrYggoGxval3sBOh2Z5ofmmWJyq+bXmYOfg6LEe\n"
  "QkEzCzc9zolwFcq1JKjPa7XSQCGYzyI0zzvFIoTgxQ6KfF2I5DUkzps+GlQebtuy\n"
  "h6f88/qBVRRiClmpIgUxPoLW7ttXNLwzldMXG+gnoot7TiYaelpkttGsN/H9oPM4\n"
  "7HLwEXWdyzRSjeZ2axfG34arJ45JK3VmgRAhpuo+9K4l/3wV3s6MJT/KYnAK9y8J\n"
  "ZgfIPxz88NtFMN9iiMG1D53Dn0reWVlHxYciNuaCp+0KueIHoI17eko8cdLiA6Ef\n"
  "MgfdG+RCzgwARWGAtQsgWSl4vflVy2PFPEz0tv/bal8xa5meLMFrUKTX5hgUvYU/\n"
  "Z6tGn6D/Qqc6f1zLXbBwHSs09dR2CQzreExZBfMzQsNhFRAbd03OIozUhfJFfbdT\n"
  "6u9AWpQKXCBfTkBdYiJ23//OYb2MI3jSNwLgjt7RETeJ9r/tSQdirpLsQBqvFAnZ\n"
  "0E6yove+7u7Y/9waLd64NnHi/Hm3lCXRSHNboTXns5lndcEZOitHTtNCjv0xyBZm\n"
  "2tIMPNuzjsmhDYAPexZ3FL//2wmUspO8IFgV6dtxQ/PeEMMA3KgqlbbC1j+Qa3bb\n"
  "bP6MvPJwNQzcmRk13NfIRmPVNnGuV/u3gm3c\n"
  "-----END CERTIFICATE-----\n";

void checkWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    if (!g_online) {
      g_online = true;
      Serial.printf("[wifi] Connected. IP=%s\n", WiFi.localIP().toString().c_str());
      requestNtpSync(millis());
    }
    return;
  }

  g_online = false;
  g_connectionReported = false;
  if (millis() - g_lastWiFiCheck < 10000) return;
  g_lastWiFiCheck = millis();

  Serial.printf("[wifi] Connecting to %s...\n", SNOWBERRY_WIFI_SSID);
  WiFi.begin(SNOWBERRY_WIFI_SSID, SNOWBERRY_WIFI_PASSWORD);
}

// Convert flat JSON to Firestore structured document.
String buildFirestorePayload(const SensorReading& s, Fault fault, uint32_t nowMs) {
  const int64_t epochMs = static_cast<int64_t>(time(nullptr)) * 1000;
  const auto addActuator = [](String& payload, const char* name, ActuatorKey key) {
    const bool manual = g_commandMode == Mode::MANUAL && g_commandKey == key &&
                        g_manualUntil > static_cast<int64_t>(time(nullptr)) * 1000;
    payload += "\"" + String(name) + "\":{\"mapValue\":{\"fields\":{";
    payload += "\"mode\":{\"stringValue\":\"" + String(manual ? "MANUAL" : "AUTO") + "\"},";
    payload += "\"state\":{\"booleanValue\":" + String(actuators::isOn(key) ? "true" : "false") + "},";
    payload += "\"manual_until\":";
    if (manual) payload += "{\"integerValue\":\"" + String(g_manualUntil) + "\"},";
    else payload += "{\"nullValue\":null},";
    payload += "\"reason\":{\"stringValue\":\"" + String(reasonStr(control::reasonOf(key))) + "\"}";
    payload += "}}}";
  };

  String payload = "{\"fields\":{";
  payload += "\"last_seen\":{\"integerValue\":\"" + String(epochMs) + "\"},";

  payload += "\"command_ack\":{\"mapValue\":{\"fields\":{";
  payload += "\"ack_command_id\":{\"stringValue\":\"" + g_ackCommandId + "\"},";
  payload += "\"ack_status\":{\"stringValue\":\"" + g_ackStatus + "\"},";
  payload += "\"ack_at\":";
  if (g_ackAt > 0) payload += "{\"integerValue\":\"" + String(g_ackAt) + "\"},";
  else payload += "{\"nullValue\":null},";
  payload += "\"ack_message\":{\"stringValue\":\"" + g_ackMessage + "\"}";
  payload += "}}},";

  payload += "\"fault\":{\"mapValue\":{\"fields\":{";
  payload += "\"active_code\":{\"stringValue\":\"" + String(faultCode(fault)) + "\"},";
  payload += "\"active_message\":{\"stringValue\":\"" + String(faultMessage(fault)) + "\"}";
  payload += "}}},";

  payload += "\"sensors\":{\"mapValue\":{\"fields\":{";
  payload += "\"temperature_c\":{\"doubleValue\":" + String(s.temperature_c, 1) + "},";
  payload += "\"humidity_pct\":{\"doubleValue\":" + String(s.humidity_pct, 1) + "},";
  payload += "\"lux\":{\"doubleValue\":" + String(s.lux, 0) + "},";
  payload += "\"soil_pct\":{\"doubleValue\":" + String(s.soil_pct, 1) + "},";
  payload += "\"soil_raw_adc\":{\"integerValue\":\"" + String(s.soil_raw_adc) + "\"},";
  payload += "\"psu_voltage\":{\"doubleValue\":" + String(s.psu_voltage, 2) + "}";
  payload += "}}}";
  payload += ",\"actuators\":{\"mapValue\":{\"fields\":{";
  addActuator(payload, "growlight", ActuatorKey::GROWLIGHT);
  payload += ",";
  addActuator(payload, "pump", ActuatorKey::PUMP);
  payload += ",";
  addActuator(payload, "mist", ActuatorKey::MIST);
  payload += ",";
  addActuator(payload, "fan", ActuatorKey::FAN);
  payload += "}}},";
  payload += "\"device\":{\"mapValue\":{\"fields\":{";
  payload += "\"online\":{\"booleanValue\":true},";
  payload += "\"wifi_rssi\":{\"integerValue\":\"" + String(WiFi.RSSI()) + "\"},";
  payload += "\"ip_address\":{\"stringValue\":\"" + WiFi.localIP().toString() + "\"},";
  payload += "\"firmware_version\":{\"stringValue\":\"demo-1.0\"},";
  payload += "\"uptime_seconds\":{\"integerValue\":\"" + String(nowMs / 1000) + "\"},";
  payload += "\"free_heap_bytes\":{\"integerValue\":\"" + String(ESP.getFreeHeap()) + "\"},";
  payload += "\"nvs_synced\":{\"booleanValue\":true},";
  payload += "\"time_synced\":{\"booleanValue\":true}";
  payload += "}}}";
  payload += "}}";
  return payload;
}

String parseFirestoreValue(const String& json, const String& key, const char* valueType) {
  int pos = json.indexOf("\"" + key + "\"");
  if (pos == -1) return "";
  int typePos = json.indexOf("\"" + String(valueType) + "\"", pos);
  if (typePos == -1) return "";
  int valueStart = json.indexOf(":", typePos);
  if (valueStart == -1) return "";
  valueStart++;
  while (valueStart < json.length() && isspace(json[valueStart])) valueStart++;
  if (json[valueStart] == '"') {
    const int valueEnd = json.indexOf("\"", valueStart + 1);
    return valueEnd == -1 ? "" : json.substring(valueStart + 1, valueEnd);
  }
  int valueEnd = valueStart;
  while (valueEnd < json.length() && json[valueEnd] != ',' && json[valueEnd] != '}') valueEnd++;
  String value = json.substring(valueStart, valueEnd);
  value.trim();
  return value;
}
}  // namespace

namespace fbsync {

void begin(const Config& cfg) {
  (void)cfg;
  WiFi.mode(WIFI_STA);
  checkWiFi();

}

void loop(uint32_t nowMs) {
  checkWiFi();
  if (!g_online) return;

  if (ntpTimeReady()) {
    if (!g_ntpReported) {
      g_ntpReported = true;
      Serial.printf("[ntp] Time synchronized. epoch=%lld\n",
                    static_cast<long long>(time(nullptr)));
    }
    return;
  }

  // SNTP is asynchronous. Retry configuration if no response after 30 seconds.
  if (nowMs - g_lastNtpAttempt >= 30000UL) requestNtpSync(nowMs);
}

bool online() { return g_online; }

bool timeSynced(int64_t& epochMsOut, uint8_t& hourOut) {
  const time_t now = time(nullptr);
  if (!g_online || now < 1500000000) return false;

  struct tm localTime;
  localtime_r(&now, &localTime);
  epochMsOut = static_cast<int64_t>(now) * 1000;
  hourOut = localTime.tm_hour;
  return true;
}

// Poll commands. Non-blocking.
bool pollCommand(control::ManualCommand& out, char* lastIdOut, size_t idCap) {
  if (!g_online) return false;
  if (!ntpTimeReady()) return false;

  uint32_t now = millis();
  if (!cloudRetryReady(now)) return false;
  if (now - g_lastCommandPoll < 5000 && g_lastCommandPoll != 0) return false;
  g_lastCommandPoll = now;

  WiFiClientSecure client;
  client.setCACert(GOOGLE_CA_CERT);
  HTTPClient http;
  http.setConnectTimeout(1500);
  http.setTimeout(1500);

  String url = "https://firestore.googleapis.com/v1/projects/";
  url += SNOWBERRY_FIREBASE_PROJECT_ID;
  url += "/databases/(default)/documents/devices/";
  url += SNOWBERRY_DEVICE_ID;
  url += "/config/commands";

  http.begin(client, url);
  int code = http.GET();
  if (code < 0) deferCloudRetry(now);
  if (code == 200) {
    g_cloudRetryAfter = 0;
    String payload = http.getString();
    String cmdId = parseFirestoreValue(payload, "command_id", "stringValue");
    if (cmdId != "" && cmdId != g_lastCommandId) {
      g_lastCommandId = cmdId;
      strncpy(lastIdOut, cmdId.c_str(), idCap);

      String actuatorStr = parseFirestoreValue(payload, "actuator", "stringValue");
      String modeStr = parseFirestoreValue(payload, "mode", "stringValue");
      String stateStr = parseFirestoreValue(payload, "state", "booleanValue");
      String typeStr = parseFirestoreValue(payload, "command_type", "stringValue");
      String durationStr = parseFirestoreValue(payload, "manual_duration_ms", "integerValue");
      String untilStr = parseFirestoreValue(payload, "manual_until", "integerValue");

      out.valid = true;
      out.key = (actuatorStr == "growlight") ? ActuatorKey::GROWLIGHT :
                (actuatorStr == "pump") ? ActuatorKey::PUMP :
                (actuatorStr == "mist") ? ActuatorKey::MIST : ActuatorKey::FAN;
      out.mode = (modeStr == "MANUAL") ? Mode::MANUAL : Mode::AUTO;
      out.state = (stateStr == "true");
      out.duration_ms = durationStr.length() ? strtoul(durationStr.c_str(), nullptr, 10) : 30 * 60 * 1000;
      out.manual_until_epoch = untilStr.length() ? strtoll(untilStr.c_str(), nullptr, 10) : 0;
      out.received_at_ms = now;
      if (typeStr == "REWATER") {
        out.key = ActuatorKey::PUMP;
        out.mode = Mode::MANUAL;
        out.state = true;
        out.duration_ms = 5000;
      }
      g_commandKey = out.key;
      g_commandMode = out.mode;
      g_manualUntil = out.manual_until_epoch;
      http.end();
      return true;
    }
  }
  http.end();
  return false;
}

bool fetchThresholds(Thresholds& out) {
  (void)out;
  return false;
}

void publishStatus(const char* json, uint32_t nowMs) {
  (void)json; (void)nowMs;
}

void publishAck(const char* commandId, const char* ackStatus, const char* ackMessage) {
  g_ackCommandId = commandId;
  g_ackStatus = ackStatus;
  g_ackMessage = ackMessage;
  g_ackAt = static_cast<int64_t>(time(nullptr)) * 1000;
  if (g_ackStatus == "REJECTED_SAFETY" || g_ackStatus == "EXPIRED") {
    g_commandMode = Mode::AUTO;
    g_manualUntil = 0;
  }
}

void appendTelemetry(const char* sampleJson, uint32_t nowMs) {
  (void)sampleJson; (void)nowMs;
}

// Live update trigger.
void updateLiveSensors(const SensorReading& s, Fault fault, uint32_t nowMs) {
  if (!g_online) return;
  if (!cloudRetryReady(nowMs)) return;

  if (!ntpTimeReady()) {
    if (nowMs - g_lastNtpWaitLog >= 30000UL || g_lastNtpWaitLog == 0) {
      g_lastNtpWaitLog = nowMs;
      Serial.println("[firebase] Waiting for NTP time sync; cloud publish paused.");
    }
    return;
  }

  if (nowMs - g_lastStatusPublish < 15000 && g_lastStatusPublish != 0) return;
  g_lastStatusPublish = nowMs;

  WiFiClientSecure client;
  client.setCACert(GOOGLE_CA_CERT);
  HTTPClient http;
  http.setConnectTimeout(1500);
  http.setTimeout(1500);

  String url = "https://firestore.googleapis.com/v1/projects/";
  url += SNOWBERRY_FIREBASE_PROJECT_ID;
  url += "/databases/(default)/documents/devices/";
  url += SNOWBERRY_DEVICE_ID;
  url += "/status/realtime?currentDocument.exists=true";

  String payload = buildFirestorePayload(s, fault, nowMs);

  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  int code = http.PATCH(payload);
  if (code >= 200 && code < 300) {
    g_cloudRetryAfter = 0;
    Serial.printf("[firebase] Status published, code=%d\n", code);
  } else if (code > 0) {
    deferCloudRetry(nowMs);
    Serial.printf("[firebase] Status rejected, code=%d body=%s\n", code, http.getString().c_str());
  } else {
    deferCloudRetry(nowMs);
    Serial.printf("[firebase] Publish failed: %s\n", http.errorToString(code).c_str());
  }
  http.end();
}

}  // namespace fbsync

#pragma once
#include <stddef.h>
#include "types.h"
namespace network_worker {
void begin(const Thresholds& initial);
bool takeThresholds(Thresholds& out);
void submitStatus(const SensorReading& sensor, Fault fault, uint32_t nowMs);
bool timeNow(int64_t& epochMs, uint8_t& hour);
const char* operation();
uint32_t operationDurationMs();
int operationResult();
bool wifiConnected();
void ipAddress(char* out, size_t cap);
int wifiDisconnectReason();
const char* wifiDisconnectReasonName();
}
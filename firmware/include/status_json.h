#pragma once
#include <cstddef>
#include "control.h"
#include "types.h"

// Builder JSON murni (tanpa Arduino) agar bisa diuji di host.
namespace status_json {

// Bangun dokumen status/realtime sesuai kontrak. Return panjang tertulis.
size_t buildStatus(char* buf, size_t cap,
                   const SensorReading& s,
                   Fault fault,
                   const char* firmwareVersion,
                   bool online,
                   int rssi,
                   bool timeSynced,
                   int64_t lastSeenEpochMs,
                   const char* appliedConfigId,
                   uint32_t uptimeSeconds,
                   const control::ManualCommand& manual,
                   const control::TimeCtx& time,
                   uint32_t nowMs,
                   CalibrationSource calibrationSource);

// Bangun 1 sample telemetry ringkas.
size_t buildTelemetrySample(char* buf, size_t cap,
                            const char* hhmm,
                            const SensorReading& s,
                            Fault fault);

}  // namespace status_json

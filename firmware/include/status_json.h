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
                   int64_t lastSeenEpochMs);

// Bangun 1 sample telemetry ringkas sesuai api-contract §5:
// {"t":num,"h":num,"l":num,"s":num,"gl":bool,"p":bool,"m":bool,"f":bool,"ts":epochMs}
size_t buildTelemetrySample(char* buf, size_t cap,
                            int64_t tsEpochMs, const SensorReading& s);

}  // namespace status_json

#pragma once
#include "control.h"
#include "types.h"

// Seam integrasi Firebase. Implementasi konkret (WiFi + Firestore REST/SDK)
// ditambahkan pada tahap deploy — lihat firmware/README.md.
//
// Kontrak: docs/03-technical/api-contract.md
// Prinsip WAJIB:
// - Semua fungsi non-blocking. Kegagalan jaringan TIDAK boleh menghentikan
//   control loop. Saat offline, ESP32 tetap kontrol lokal dengan NVS.
// - status/realtime & telemetry: WRITE oleh device.
// - config/thresholds & config/commands: READ oleh device.
namespace fbsync {

struct Config {
  const char* wifi_ssid;
  const char* wifi_pass;
  const char* device_email;   // akun device (dari NVS, bukan hardcode)
  const char* device_pass;
  const char* api_key;
  const char* project_id;
  const char* device_id;
  uint32_t status_interval_ms = 60000;
  uint32_t telemetry_interval_ms = 60000;
  uint32_t command_poll_ms = 10000;
  uint32_t threshold_poll_ms = 60000;
};

void begin(const Config& cfg);
void loop(uint32_t nowMs);                 // panggil tiap iterasi, non-blocking

bool online();                             // WiFi + Firebase siap
bool timeSynced(int64_t& epochMsOut, uint8_t& hourOut);

// Ambil command manual terbaru (jika command_id baru). Return false jika tidak ada.
bool pollCommand(control::ManualCommand& out, char* lastIdOut, size_t idCap);

// Ambil thresholds terbaru dari server. Return false jika tidak ada/invalid.
bool fetchThresholds(Thresholds& out);

// Publish status/realtime (dibangun oleh status_json).
void publishStatus(const char* json, uint32_t nowMs);

// Tulis acknowledgement command ke status/realtime.
void publishAck(const char* commandId, const char* ackStatus, const char* ackMessage);

// Tambah 1 sample telemetry (buffer RAM, flush per interval).
void appendTelemetry(const char* sampleJson, uint32_t nowMs);

}  // namespace fbsync

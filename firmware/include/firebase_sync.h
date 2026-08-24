#pragma once
#include <stddef.h>
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
  uint32_t threshold_poll_ms = 60000;
};

void begin(const Config& cfg);
void loop(uint32_t nowMs);                 // panggil tiap iterasi, non-blocking

bool online();                             // WiFi + Firebase siap
bool timeSynced(int64_t& epochMsOut, uint8_t& hourOut);

// Ambil thresholds terbaru dari server. Return false jika tidak ada/invalid.
bool fetchThresholds(Thresholds& out);

// Publish status/realtime (dibangun oleh status_json).
void publishStatus(const char* json, uint32_t nowMs);

// Tulis acknowledgement command ke status/realtime.
void publishAck(const char* commandId, const char* ackStatus, const char* ackMessage);

// Buffer 1 sample telemetry dari pembacaan sensor terakhir; flush otomatis
// tiap interval ke devices/{id}/telemetry/{YYYY-MM-DD} (tanggal WIB).
// Sample dengan sensor invalid dilewati (gap jujur). Non-blocking.
void appendTelemetry(const SensorReading& s, uint32_t nowMs);

// Ambil command baru dari config/commands bila ada. Return true hanya untuk
// command_id yang belum pernah diproses. Pemanggil wajib mem-publish ack.
struct CloudCommand {
  char command_id[48];
  char actuator[16];
  bool mode_manual;
  bool state;
  uint32_t duration_ms;
  int64_t manual_until_epoch;
};
bool fetchCommand(CloudCommand& out);

// Tulis langsung status lengkap (sensors+actuators+device+fault+last_seen)
// ke status/realtime untuk demo. Dipanggil dari network task saja.
void updateLiveSensors(const SensorReading& s, Fault fault, uint32_t nowMs);

}  // namespace fbsync

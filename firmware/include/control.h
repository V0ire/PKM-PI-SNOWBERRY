#pragma once
#include "types.h"

namespace control {

struct PumpHistory {
  uint32_t magic = 0x50484D31;  // PHM1
  uint16_t version = 1;
  int64_t starts_epoch_ms[2] = {0, 0};
  uint8_t count = 0;
  bool requires_conservative_lock = true;
  uint32_t checksum = 0;
};

uint32_t pumpHistoryChecksum(const PumpHistory& history);

using PumpHistorySaver = bool (*)(const PumpHistory&);
void setPumpHistorySaver(PumpHistorySaver saver);
void restorePumpHistory(const PumpHistory& history, uint32_t nowMs);
PumpHistory pumpHistory();
void resetForTest();

// Validasi threshold. Return true jika aman dipakai/disimpan ke NVS.
bool validate(const Thresholds& t);

// Konversi raw ADC soil -> persen memakai kalibrasi. Return false jika belum
// dikalibrasi atau ADC pinned (0/4095) => soil tidak dipercaya.
bool soilPercent(const Thresholds& t, uint16_t rawAdc, float& outPct);

// Day identifier for Asia/Jakarta (UTC+7), used by daily growlight accounting.
int32_t jakartaDayId(int64_t epochMs);

// Command manual (overlay). Basis waktu ganda: epoch (NTP) + durasi fallback.
struct ManualCommand {
  bool valid = false;
  ActuatorKey key = ActuatorKey::PUMP;
  Mode mode = Mode::AUTO;
  bool state = false;
  uint32_t duration_ms = 0;
  int64_t manual_until_epoch = 0;
  uint32_t received_at_ms = 0;   // basis millis() saat command diterima/diterapkan
};

// Konteks waktu untuk photoperiod + expiry manual.
struct TimeCtx {
  bool synced = false;
  int64_t epoch_ms = 0;   // waktu sekarang (ms sejak epoch) jika synced
  uint8_t hour = 0;       // jam lokal 0-23 jika synced
};

// Satu iterasi kontrol. Menerapkan decision priority:
// boot/fault safety > sensor invalid > manual valid > auto > default OFF.
// Mengembalikan Fault dominan (untuk status) via out param.
void step(const Thresholds& t,
          const SensorReading& s,
          const ManualCommand& cmd,
          const TimeCtx& time,
          uint32_t nowMs,
          Fault& outFault);

// Reason terakhir per aktuator (untuk publish status).
Reason reasonOf(ActuatorKey key);

}  // namespace control

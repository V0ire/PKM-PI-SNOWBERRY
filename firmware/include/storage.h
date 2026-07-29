#pragma once
#include "types.h"
#include "control.h"

namespace storage {
bool begin();
bool loadThresholds(Thresholds& out);       // false jika belum ada/korupsi
bool saveThresholds(const Thresholds& t);    // hanya panggil jika sudah valid
bool saveSoilCalibration(uint16_t dry, uint16_t wet);
bool loadPumpHistory(control::PumpHistory& out);
bool savePumpHistory(const control::PumpHistory& history);
uint32_t incrementBootCount();
}  // namespace storage

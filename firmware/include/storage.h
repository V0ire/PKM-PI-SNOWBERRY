#pragma once
#include "types.h"

namespace storage {
bool begin();
bool loadThresholds(Thresholds& out);       // false jika belum ada/korupsi
bool saveThresholds(const Thresholds& t);    // hanya panggil jika sudah valid
bool saveSoilCalibration(uint16_t dry, uint16_t wet);
// Persist conservative lock marker before GPIO17 HIGH. Runtime timestamps stay
// in RAM; raw millis() is never treated as valid across reboot.
bool reservePumpStart();
bool setPumpBootLock(bool locked);
bool pumpBootLock();
}  // namespace storage

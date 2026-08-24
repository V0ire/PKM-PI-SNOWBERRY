#pragma once
#include <stddef.h>
#include "control.h"
#include "types.h"

namespace storage {
bool begin();
bool loadThresholds(Thresholds& out);       // false jika belum ada/korupsi
bool saveThresholds(const Thresholds& t);    // hanya panggil jika sudah valid
bool saveSoilCalibration(uint16_t dry, uint16_t wet);
bool reservePumpStart(const control::PumpStartRecord& record);
size_t loadPumpStarts(control::PumpStartRecord* out, size_t cap);
}  // namespace storage

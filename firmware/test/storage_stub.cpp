#include "storage.h"

namespace storage {
static bool s_pumpLock = true;
bool begin() { return true; }
bool loadThresholds(Thresholds& out) { return true; }
bool saveThresholds(const Thresholds& t) { return true; }
bool saveSoilCalibration(uint16_t dry, uint16_t wet) { return true; }
bool reservePumpStart() { s_pumpLock = true; return true; }
bool setPumpBootLock(bool locked) { s_pumpLock = locked; return true; }
bool pumpBootLock() { return s_pumpLock; }
}

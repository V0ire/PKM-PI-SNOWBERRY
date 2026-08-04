#include "storage.h"
#include <Preferences.h>
#include "control.h"

namespace {
Preferences g_prefs;
constexpr const char* NS = "snowberry";
constexpr uint32_t MAGIC = 0x534E4231;  // "SNB1"
}  // namespace

namespace storage {

bool begin() {
  return g_prefs.begin(NS, false);
}

bool loadThresholds(Thresholds& out) {
  if (g_prefs.getUInt("magic", 0) != MAGIC) return false;
  size_t n = g_prefs.getBytes("thr", &out, sizeof(Thresholds));
  if (n != sizeof(Thresholds)) return false;
  // Validasi ulang: NVS bisa korupsi.
  if (!control::validate(out)) return false;
  return true;
}

bool saveThresholds(const Thresholds& t) {
  if (!control::validate(t)) return false;
  size_t n = g_prefs.putBytes("thr", &t, sizeof(Thresholds));
  if (n != sizeof(Thresholds)) return false;
  g_prefs.putUInt("magic", MAGIC);
  return true;
}

bool saveSoilCalibration(uint16_t dry, uint16_t wet) {
  Thresholds t;
  if (!loadThresholds(t)) {
    // Belum ada threshold valid: pakai default lalu set kalibrasi.
  }
  t.soil_adc_dry = dry;
  t.soil_adc_wet = wet;
  t.calibration_source = CalibrationSource::CALIBRATED;
  return saveThresholds(t);
}

bool reservePumpStart() { return g_prefs.putBool("pump_lock", true) == 1; }
bool setPumpBootLock(bool locked) { return g_prefs.putBool("pump_lock", locked) == 1; }
bool pumpBootLock() { return g_prefs.getBool("pump_lock", true); }

}  // namespace storage

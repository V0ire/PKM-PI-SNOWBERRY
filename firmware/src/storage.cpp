#include "storage.h"
#include <Preferences.h>
#include "control.h"

namespace {
Preferences g_prefs;
constexpr const char* NS = "snowberry-test";
constexpr uint32_t MAGIC = 0x534E4254;  // "SNBT"; isolate test defaults from production NVS
constexpr const char* PUMP_KEY = "pump_hist";
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
  return saveThresholds(t);
}

bool reservePumpStart(const control::PumpStartRecord& record) {
  control::PumpStartRecord records[2] = {};
  size_t count = loadPumpStarts(records, 2);
  if (count >= 2) { records[0] = records[1]; count = 1; }
  records[count++] = record;
  const size_t bytes = count * sizeof(records[0]);
  return g_prefs.putBytes(PUMP_KEY, records, bytes) == bytes;
}

size_t loadPumpStarts(control::PumpStartRecord* out, size_t cap) {
  if (!out || cap == 0) return 0;
  const size_t bytes = g_prefs.getBytesLength(PUMP_KEY);
  if (bytes == 0 || bytes % sizeof(control::PumpStartRecord) != 0) return 0;
  size_t count = bytes / sizeof(control::PumpStartRecord);
  if (count > cap) count = cap;
  return g_prefs.getBytes(PUMP_KEY, out, count * sizeof(out[0])) == count * sizeof(out[0]) ? count : 0;
}

}  // namespace storage

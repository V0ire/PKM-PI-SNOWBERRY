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
  return saveThresholds(t);
}

bool loadPumpHistory(control::PumpHistory& out) {
  const size_t n=g_prefs.getBytes("pump_hist",&out,sizeof(out));
  return n==sizeof(out) && out.magic==0x50484D31 && out.version==1 && out.count<=2 &&
         !(out.count==0 && !out.requires_conservative_lock) &&
         !(out.count>0 && out.starts_epoch_ms[0]<=0) &&
         !(out.count==2 && (out.starts_epoch_ms[1]<=0 || out.starts_epoch_ms[0]>out.starts_epoch_ms[1])) &&
         out.checksum==control::pumpHistoryChecksum(out);
}

bool savePumpHistory(const control::PumpHistory& history) {
  return history.magic==0x50484D31 && history.version==1 && history.count<=2 &&
         history.checksum==control::pumpHistoryChecksum(history) &&
         g_prefs.putBytes("pump_hist",&history,sizeof(history))==sizeof(history);
}

uint32_t incrementBootCount() {
  const uint32_t value=g_prefs.getUInt("boot_count",0)+1;
  return g_prefs.putUInt("boot_count",value)==sizeof(value) ? value : 0;
}

}  // namespace storage

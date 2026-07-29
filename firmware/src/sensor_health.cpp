#include "sensor_health.h"
#include <math.h>

namespace sensor_health {
bool fresh(uint32_t nowMs, uint32_t updatedMs, uint32_t maxAgeMs) {
  return updatedMs != 0 && nowMs - updatedMs <= maxAgeMs;
}

bool StuckDetector::update(float value, uint32_t nowMs) {
  if (!initialized_ || fabsf(value - value_) > 0.01f) {
    initialized_ = true;
    stuck_ = false;
    value_ = value;
    unchanged_since_ms_ = nowMs;
    return true;
  }
  stuck_ = nowMs - unchanged_since_ms_ > 300000;
  return !stuck_;
}
}  // namespace sensor_health
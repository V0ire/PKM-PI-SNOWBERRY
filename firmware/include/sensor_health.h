#pragma once
#include <stdint.h>

namespace sensor_health {
bool fresh(uint32_t nowMs, uint32_t updatedMs, uint32_t maxAgeMs);

class StuckDetector {
 public:
  bool update(float value, uint32_t nowMs);
  bool stuck() const { return stuck_; }
 private:
  bool initialized_ = false;
  bool stuck_ = false;
  float value_ = 0;
  uint32_t unchanged_since_ms_ = 0;
};
}  // namespace sensor_health
#pragma once
#include <stdint.h>
namespace sensor_safety {
constexpr float BH1750_MAX_LUX = 120000.0f;
constexpr uint32_t BH1750_STUCK_MS = 120000;
class Bh1750Health {
 public:
  bool accept(float lux, uint32_t nowMs);
  bool valid(uint32_t nowMs) const;
  void reset();
 private:
  float last_ = -1;
  uint32_t changed_at_ = 0;
  uint32_t sampled_at_ = 0;
  bool plausible_ = false;
};
}
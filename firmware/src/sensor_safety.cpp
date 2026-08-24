#include "sensor_safety.h"
#include <cmath>
namespace sensor_safety {
bool Bh1750Health::accept(float lux, uint32_t nowMs) {
  plausible_ = std::isfinite(lux) && lux >= 0 && lux <= BH1750_MAX_LUX;
  if (!plausible_) return false;
  if (last_ < 0 || std::fabs(lux - last_) > 0.01f) changed_at_ = nowMs;
  last_ = lux;
  sampled_at_ = nowMs;
  return valid(nowMs);
}
bool Bh1750Health::valid(uint32_t nowMs) const {
  return plausible_ && nowMs - sampled_at_ <= 15000 && nowMs - changed_at_ <= BH1750_STUCK_MS;
}
void Bh1750Health::reset() { *this = Bh1750Health{}; }
}
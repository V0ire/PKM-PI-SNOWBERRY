#include <cstdio>
#include "sensor_safety.h"

int main() {
  sensor_safety::Bh1750Health health;
  bool ok = true;
  ok &= health.accept(100.0f, 1000);
  for (uint32_t t = 3000; t < 125000; t += 2000) health.accept(100.0f, t);
  ok &= !health.valid(125000);
  health.reset();
  ok &= !health.accept(-1.0f, 1);
  ok &= !health.accept(200000.0f, 2);
  if (!ok) std::printf("FAIL: BH1750 plausible/stuck detection\n");
  return ok ? 0 : 1;
}
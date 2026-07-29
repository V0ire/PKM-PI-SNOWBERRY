#include <cstdio>
#include "sensor_health.h"
#include "config.h"

int main() {
  sensor_health::StuckDetector d;
  if (!sensor_health::fresh(1000, 1, timing::SENSOR_STALE_MS)) return 1;
  if (sensor_health::fresh(timing::SENSOR_STALE_MS + 2, 1, timing::SENSOR_STALE_MS)) return 2;
  if (!d.update(100.0f, 1000)) return 3;
  if (d.update(100.0f, 301001)) return 4;
  if (!d.stuck()) return 5;
  if (!d.update(101.0f, 302000) || d.stuck()) return 6;
  std::puts("Sensor health tests: ALL PASSED");
  return 0;
}
#include <cstdio>
#include "calibration.h"

int main() {
  calibration::Machine m;
  m.start(1000);
  m.step(false, 1001, 0);
  m.step(false, 1000 + calibration::STAGE_TIMEOUT_MS + 1, 0);
  const bool timeout = m.stage() == calibration::Stage::TIMED_OUT;
  m.start(2000);
  m.cancel();
  const bool cancelled = m.stage() == calibration::Stage::CANCELLED;
  if (!timeout || !cancelled) std::printf("FAIL: calibration timeout/cancel\n");
  return timeout && cancelled ? 0 : 1;
}
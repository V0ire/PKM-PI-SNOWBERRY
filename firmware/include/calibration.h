#pragma once
#include <stdint.h>

namespace calibration {
enum class State : uint8_t { IDLE, WAIT_RELEASE_DRY, WAIT_DRY, WAIT_RELEASE_WET, WAIT_WET, COMPLETE, CANCELLED };
struct Result { bool ready=false; uint16_t dry=0; uint16_t wet=0; };
class Machine {
 public:
  void start(uint32_t nowMs);
  Result update(bool pressed, uint16_t rawAdc, uint32_t nowMs);
  void reset();
  bool active() const;
  State state() const { return state_; }
 private:
  static constexpr uint32_t TIMEOUT_MS=120000;
  State state_=State::IDLE;
  uint32_t started_=0;
  uint16_t dry_=0;
};
}

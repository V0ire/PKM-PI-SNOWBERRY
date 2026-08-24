#pragma once
#include <stdint.h>
namespace calibration {
constexpr uint32_t STAGE_TIMEOUT_MS = 120000;
enum class Stage : uint8_t { IDLE, WAIT_RELEASE, WAIT_DRY, WAIT_DRY_RELEASE, WAIT_WET, COMPLETE, TIMED_OUT, CANCELLED };
class Machine {
 public:
  void start(uint32_t nowMs);
  void cancel();
  void step(bool pressed, uint32_t nowMs, uint16_t adc);
  Stage stage() const { return stage_; }
  bool active() const;
  bool takeResult(uint16_t& dry, uint16_t& wet);
 private:
  void enter(Stage stage, uint32_t nowMs);
  Stage stage_ = Stage::IDLE;
  uint32_t entered_ = 0;
  uint16_t dry_ = 0;
  uint16_t wet_ = 0;
};
}
#include "calibration.h"
namespace calibration {
void Machine::enter(Stage stage, uint32_t nowMs) { stage_ = stage; entered_ = nowMs; }
void Machine::start(uint32_t nowMs) { if (!active()) enter(Stage::WAIT_RELEASE, nowMs); }
void Machine::cancel() { stage_ = Stage::CANCELLED; }
bool Machine::active() const {
  return stage_ == Stage::WAIT_RELEASE || stage_ == Stage::WAIT_DRY ||
         stage_ == Stage::WAIT_DRY_RELEASE || stage_ == Stage::WAIT_WET;
}
void Machine::step(bool pressed, uint32_t nowMs, uint16_t adc) {
  if (!active()) return;
  if (nowMs - entered_ >= STAGE_TIMEOUT_MS) { enter(Stage::TIMED_OUT, nowMs); return; }
  switch (stage_) {
    case Stage::WAIT_RELEASE: if (!pressed) enter(Stage::WAIT_DRY, nowMs); break;
    case Stage::WAIT_DRY: if (pressed) { dry_ = adc; enter(Stage::WAIT_DRY_RELEASE, nowMs); } break;
    case Stage::WAIT_DRY_RELEASE: if (!pressed) enter(Stage::WAIT_WET, nowMs); break;
    case Stage::WAIT_WET: if (pressed) { wet_ = adc; enter(Stage::COMPLETE, nowMs); } break;
    default: break;
  }
}
bool Machine::takeResult(uint16_t& dry, uint16_t& wet) {
  if (stage_ != Stage::COMPLETE) return false;
  dry = dry_; wet = wet_; stage_ = Stage::IDLE;
  return dry > wet && dry - wet > 100;
}
}
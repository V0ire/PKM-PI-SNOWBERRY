#pragma once
#include <cstdint>
#include <cmath>
#include <vector>

enum class PinOp { WRITE_LOW, WRITE_HIGH, MODE_OUTPUT, MODE_INPUT_PULLUP, MODE_INPUT };
struct PinRecord {
  uint8_t pin;
  PinOp op;
};

extern std::vector<PinRecord> g_pinOps;
inline void clearPinOps() { g_pinOps.clear(); }

#define OUTPUT 1
#define INPUT_PULLUP 2
#define INPUT 0
#define HIGH 1
#define LOW 0

inline void digitalWrite(uint8_t pin, uint8_t level) {
  g_pinOps.push_back({pin, level ? PinOp::WRITE_HIGH : PinOp::WRITE_LOW});
}

inline void pinMode(uint8_t pin, uint8_t mode) {
  PinOp op = PinOp::MODE_INPUT;
  if (mode == OUTPUT) op = PinOp::MODE_OUTPUT;
  else if (mode == INPUT_PULLUP) op = PinOp::MODE_INPUT_PULLUP;
  g_pinOps.push_back({pin, op});
}

static inline uint32_t millis() { return 0; }
static inline void delay(uint32_t) {}

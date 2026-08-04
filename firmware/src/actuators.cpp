#include "actuators.h"
#include <Arduino.h>
#include "config.h"

namespace {
struct Chan {
  uint8_t pin;
  uint8_t onLevel;
  uint8_t offLevel;
  uint32_t minOn;
  uint32_t minOff;
  bool on;
  uint32_t lastChanged;
};

Chan g_chan[3] = {
  {pins::GROWLIGHT, polarity::SSR_ON,   polarity::SSR_OFF,   300000, 300000, false, 0},
  {pins::PUMP,      polarity::RELAY_ON, polarity::RELAY_OFF, 0,      0,      false, 0},
  {pins::HUMIDIFIER,polarity::RELAY_ON, polarity::RELAY_OFF, 5000,   5000,   false, 0},
};
}  // namespace

namespace actuators {

void initSafeState() {
  // Phase 1: Latch OFF level dulu pada SEMUA pin
  for (auto& c : g_chan) {
    digitalWrite(c.pin, c.offLevel);
  }
  // Phase 2: Set pinMode OUTPUT pada SEMUA pin (Contract §2)
  for (auto& c : g_chan) {
    pinMode(c.pin, OUTPUT);
    c.on = false;
    c.lastChanged = millis();
  }
}

bool apply(ActuatorKey key, bool wantOn, uint32_t nowMs) {
  const int idx = static_cast<int>(key);

  if (idx < 0 || idx >= static_cast<int>(ActuatorKey::COUNT)) return false;

  Chan& c = g_chan[idx];
  if (wantOn == c.on) return false;

  const uint32_t held = nowMs - c.lastChanged;
  if (c.on && held < c.minOn) return false;    // belum boleh mati
  if (!c.on && held < c.minOff) return false;  // belum boleh nyala

  c.on = wantOn;
  c.lastChanged = nowMs;
  digitalWrite(c.pin, wantOn ? c.onLevel : c.offLevel);
  return true;
}

void forceOff(ActuatorKey key, uint32_t nowMs) {
  const int idx = static_cast<int>(key);
  if (idx < 0 || idx >= static_cast<int>(ActuatorKey::COUNT)) {
    return;
  }

  Chan& c = g_chan[idx];
  // Unconditionally write physical OFF level to hardware (reassert safety)
  digitalWrite(c.pin, c.offLevel);

  c.on = false;
  c.lastChanged = nowMs;
}

bool isOn(ActuatorKey key) {
  const int idx = static_cast<int>(key);
  if (idx < 0 || idx >= static_cast<int>(ActuatorKey::COUNT)) return false;
  return g_chan[idx].on;
}

uint32_t lastChangedMs(ActuatorKey key) {
  const int idx = static_cast<int>(key);
  if (idx < 0 || idx >= static_cast<int>(ActuatorKey::COUNT)) return 0;
  return g_chan[idx].lastChanged;
}

uint32_t minOnMs(ActuatorKey key) {
  const int idx = static_cast<int>(key);
  if (idx < 0 || idx >= static_cast<int>(ActuatorKey::COUNT)) return 0;
  return g_chan[idx].minOn;
}

uint32_t minOffMs(ActuatorKey key) {
  const int idx = static_cast<int>(key);
  if (idx < 0 || idx >= static_cast<int>(ActuatorKey::COUNT)) return 0;
  return g_chan[idx].minOff;
}

}  // namespace actuators

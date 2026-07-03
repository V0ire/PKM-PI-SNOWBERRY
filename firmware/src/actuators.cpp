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

// Urut sesuai enum ActuatorKey: GROWLIGHT, PUMP, MIST, FAN.
Chan g_chan[4] = {
  {pins::GROWLIGHT, polarity::SSR_ON,   polarity::SSR_OFF,   300000, 300000, false, 0},
  {pins::PUMP,      polarity::RELAY_ON, polarity::RELAY_OFF, 0,      0,      false, 0},
  {pins::MIST,      polarity::RELAY_ON, polarity::RELAY_OFF, 5000,   30000,  false, 0},
  {pins::FAN,       polarity::RELAY_ON, polarity::RELAY_OFF, 30000,  30000,  false, 0},
};

Chan& ch(ActuatorKey k) { return g_chan[static_cast<int>(k)]; }
}  // namespace

namespace actuators {

void initSafeState() {
  // Spare SSR juga dipaksa OFF walau tanpa beban.
  // Latch OFF level dulu sebelum pinMode OUTPUT untuk menghindari brief active level saat boot.
  digitalWrite(pins::SPARE_SSR, polarity::SSR_OFF);
  pinMode(pins::SPARE_SSR, OUTPUT);

  for (auto& c : g_chan) {
    digitalWrite(c.pin, c.offLevel);
    pinMode(c.pin, OUTPUT);
    c.on = false;
    c.lastChanged = millis();
  }
}

bool apply(ActuatorKey key, bool wantOn, uint32_t nowMs) {
  Chan& c = ch(key);
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
  Chan& c = ch(key);
  if (!c.on) return;
  c.on = false;
  c.lastChanged = nowMs;
  digitalWrite(c.pin, c.offLevel);
}

bool isOn(ActuatorKey key) { return ch(key).on; }
uint32_t lastChangedMs(ActuatorKey key) { return ch(key).lastChanged; }
uint32_t minOnMs(ActuatorKey key) { return ch(key).minOn; }
uint32_t minOffMs(ActuatorKey key) { return ch(key).minOff; }

}  // namespace actuators

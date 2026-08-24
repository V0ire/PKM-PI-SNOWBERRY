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

// Urut sesuai enum ActuatorKey.
Chan g_chan[static_cast<int>(ActuatorKey::COUNT)] = {
  {pins::GROWLIGHT, polarity::ACTIVE_HIGH_ON, polarity::ACTIVE_HIGH_OFF, 5000,  5000,  false, 0},
  {pins::PUMP,      polarity::ACTIVE_HIGH_ON, polarity::ACTIVE_HIGH_OFF, 0,     0,     false, 0},
  {pins::MIST,      polarity::ACTIVE_HIGH_ON, polarity::ACTIVE_HIGH_OFF, 30000, 30000, false, 0},
  {pins::FAN,       polarity::ACTIVE_HIGH_ON, polarity::ACTIVE_HIGH_OFF, 30000, 30000, false, 0},
  {pins::MIST_2,    polarity::ACTIVE_HIGH_ON, polarity::ACTIVE_HIGH_OFF, 30000, 30000, false, 0},
  {pins::FAN_2,     polarity::ACTIVE_HIGH_ON, polarity::ACTIVE_HIGH_OFF, 30000, 30000, false, 0},
};

Chan& ch(ActuatorKey k) { return g_chan[static_cast<int>(k)]; }
bool g_humidifierOn = false;
uint32_t g_humidifierChanged = 0;
constexpr ActuatorKey HUMIDIFIER_KEYS[] = {
  ActuatorKey::MIST, ActuatorKey::FAN, ActuatorKey::MIST_2, ActuatorKey::FAN_2
};
}  // namespace

namespace actuators {

void initSafeState() {
  // Spare SSR juga dipaksa OFF walau tanpa beban.
  // Latch OFF level dulu sebelum pinMode OUTPUT untuk menghindari brief active level saat boot.
  digitalWrite(pins::SPARE_SSR, polarity::ACTIVE_HIGH_OFF);
  pinMode(pins::SPARE_SSR, OUTPUT);
  digitalWrite(pins::SPARE_SSR, polarity::ACTIVE_HIGH_OFF);

  for (auto& c : g_chan) {
    digitalWrite(c.pin, c.offLevel);
    pinMode(c.pin, OUTPUT);
    digitalWrite(c.pin, c.offLevel);
    c.on = false;
    // Safe at boot, but allow the first valid automatic decision immediately.
    c.lastChanged = millis() - c.minOff;
  }
  g_humidifierOn = false;
  g_humidifierChanged = millis() - 30000;
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

bool applyHumidifierGroup(bool wantOn, uint32_t nowMs) {
  if (wantOn == g_humidifierOn || nowMs - g_humidifierChanged < 30000) return false;
  for (ActuatorKey key : HUMIDIFIER_KEYS) {
    Chan& c = ch(key);
    c.on = wantOn;
    c.lastChanged = nowMs;
    digitalWrite(c.pin, wantOn ? c.onLevel : c.offLevel);
  }
  g_humidifierOn = wantOn;
  g_humidifierChanged = nowMs;
  return true;
}

void forceOff(ActuatorKey key, uint32_t nowMs) {
  Chan& c = ch(key);
  digitalWrite(c.pin, c.offLevel);
  if (!c.on) return;
  c.on = false;
  c.lastChanged = nowMs;
}

void forceOffHumidifierGroup(uint32_t nowMs) {
  const bool wasOn = g_humidifierOn;
  for (ActuatorKey key : HUMIDIFIER_KEYS) {
    Chan& c = ch(key);
    digitalWrite(c.pin, c.offLevel);
    c.on = false;
    if (wasOn) c.lastChanged = nowMs;
  }
  g_humidifierOn = false;
  if (wasOn) g_humidifierChanged = nowMs;
}

bool isOn(ActuatorKey key) { return ch(key).on; }
uint32_t lastChangedMs(ActuatorKey key) { return ch(key).lastChanged; }
uint32_t minOnMs(ActuatorKey key) { return ch(key).minOn; }
uint32_t minOffMs(ActuatorKey key) { return ch(key).minOff; }
bool applySpareForTest(bool wantOn, uint32_t nowMs) {
  (void)wantOn;
  (void)nowMs;
  digitalWrite(pins::SPARE_SSR, LOW);
  return false;
}

}  // namespace actuators

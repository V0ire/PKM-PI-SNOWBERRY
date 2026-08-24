#pragma once
#include "types.h"

// Lapisan aktuator: enforce polaritas hardware, boot safe-state, dan
// minimum ON/OFF time agar relay tidak chattering.
namespace actuators {

// WAJIB dipanggil paling awal di setup(), sebelum WiFi/Firebase/sensor.
// Semua aktuator dipaksa OFF sesuai polaritas hardware.
void initSafeState();

// Terapkan state fisik ke pin (menghormati polaritas). Return true jika
// perubahan benar-benar diterapkan (setelah cek min ON/OFF time).
bool apply(ActuatorKey key, bool wantOn, uint32_t nowMs);
bool applyHumidifierGroup(bool wantOn, uint32_t nowMs);

// Paksa OFF tanpa menghormati min-time (untuk fault/safety).
void forceOff(ActuatorKey key, uint32_t nowMs);
void forceOffHumidifierGroup(uint32_t nowMs);

bool isOn(ActuatorKey key);
uint32_t lastChangedMs(ActuatorKey key);

// Minimum runtime per aktuator (ms).
uint32_t minOnMs(ActuatorKey key);
uint32_t minOffMs(ActuatorKey key);
bool applySpareForTest(bool wantOn, uint32_t nowMs);

}  // namespace actuators

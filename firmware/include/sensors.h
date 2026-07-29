#pragma once
#include "types.h"

namespace sensors {
bool begin();  // init I2C + SHT30 + BH1750. Return false jika keduanya gagal.
// Baca semua sensor. Isi SensorReading + set fault dominan sensor (jika ada).
void read(const Thresholds& t, SensorReading& out, Fault& sensorFault, uint32_t nowMs);
// Coba pulihkan bus I2C yang macet (SDA stuck low).
void recoverI2C();
}  // namespace sensors

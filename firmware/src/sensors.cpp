#include "sensors.h"
#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_SHT31.h>
#include <BH1750.h>
#include "config.h"
#include "control.h"
#include "sensor_safety.h"

namespace {
Adafruit_SHT31 g_sht;
BH1750 g_bh;
bool g_shtOk;
bool g_bhOk;
uint8_t g_shtFails;
uint8_t g_bhFails;
uint8_t g_soilFails;
sensor_safety::Bh1750Health g_bhHealth;
void increment(uint8_t& value) { if (value < UINT8_MAX) ++value; }
void probe() {
  if (!g_shtOk) g_shtOk = g_sht.begin(i2c_addr::SHT30);
  if (!g_bhOk) {
    g_bhHealth.reset();
    g_bhOk = g_bh.begin(BH1750::CONTINUOUS_HIGH_RES_MODE, i2c_addr::BH1750);
  }
}
}

namespace sensors {
bool begin() {
  Wire.begin(pins::I2C_SDA, pins::I2C_SCL);
  Wire.setClock(100000);
  analogReadResolution(12);
  analogSetPinAttenuation(pins::SOIL_ADC, ADC_11db);
  probe();
  return g_shtOk || g_bhOk;
}
void recoverI2C() {
  pinMode(pins::I2C_SCL, OUTPUT);
  pinMode(pins::I2C_SDA, INPUT_PULLUP);
  for (int i = 0; i < 9; ++i) {
    digitalWrite(pins::I2C_SCL, HIGH); delayMicroseconds(5);
    digitalWrite(pins::I2C_SCL, LOW); delayMicroseconds(5);
  }
  Wire.begin(pins::I2C_SDA, pins::I2C_SCL);
  Wire.setClock(100000);
  g_shtOk = g_bhOk = false;
  g_bhHealth.reset();
  probe();
}
void read(const Thresholds& thresholds, SensorReading& out, Fault& fault, uint32_t nowMs) {
  fault = Fault::NONE;
  const float temp = g_shtOk ? g_sht.readTemperature() : NAN;
  const float rh = g_shtOk ? g_sht.readHumidity() : NAN;
  if (isfinite(temp) && isfinite(rh) && temp >= -40 && temp <= 125 && rh >= 0 && rh <= 100) {
    out.temperature_c = temp; out.humidity_pct = rh;
    out.temp_valid = out.rh_valid = true; out.rh_sample_ms = nowMs; g_shtFails = 0;
  } else {
    out.temp_valid = out.rh_valid = false; increment(g_shtFails);
    if (g_shtFails >= timing::SENSOR_FAIL_THRESHOLD) { fault = Fault::SHT30_ERROR; g_shtOk = false; }
  }
  const float lux = g_bhOk ? g_bh.readLightLevel() : -1;
  if (g_bhHealth.accept(lux, nowMs)) {
    out.lux = lux; out.lux_valid = true; out.lux_sample_ms = nowMs; g_bhFails = 0;
  } else {
    out.lux_valid = false; increment(g_bhFails);
    if (g_bhFails >= timing::SENSOR_FAIL_THRESHOLD) {
      if (fault == Fault::NONE) fault = Fault::BH1750_ERROR;
      // Re-probe transport failures. A plausible repeated value remains invalid
      // until it changes; reinitializing would incorrectly clear stuck history.
      if (!isfinite(lux) || lux < 0 || lux > sensor_safety::BH1750_MAX_LUX) g_bhOk = false;
    }
  }
  uint32_t total = 0;
  for (int i = 0; i < 8; ++i) total += analogRead(pins::SOIL_ADC);
  out.soil_raw_adc = static_cast<uint16_t>(total / 8);
  float pct;
  if (control::soilPercent(thresholds, out.soil_raw_adc, pct)) {
    out.soil_pct = pct; out.soil_valid = true; out.soil_sample_ms = nowMs; g_soilFails = 0;
  } else {
    out.soil_valid = false; increment(g_soilFails);
    if (fault == Fault::NONE) fault = Fault::SOIL_SENSOR_ERROR;
  }
  out.psu_voltage = 0; out.psu_valid = false;
  if (g_shtFails >= timing::SENSOR_FAIL_THRESHOLD && g_bhFails >= timing::SENSOR_FAIL_THRESHOLD) {
    fault = Fault::I2C_BUS_STUCK;
    recoverI2C();
  } else if (!g_shtOk || !g_bhOk) probe();
}
}
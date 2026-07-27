#include "sensors.h"
#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_SHT31.h>
#include <BH1750.h>
#include "config.h"
#include "control.h"

namespace {
Adafruit_SHT31 g_sht;
BH1750 g_bh;
bool g_shtOk = false;
bool g_bhOk = false;
uint8_t g_shtFails = 0;
uint8_t g_bhFails = 0;

}  // namespace

namespace sensors {

bool begin() {
  Wire.begin(pins::I2C_SDA, pins::I2C_SCL);
  Wire.setClock(100000);
  delay(100);  // Beri waktu hardware bus stabil
  analogReadResolution(12);
  analogSetPinAttenuation(pins::SOIL_ADC, ADC_11db);


  g_shtOk = g_sht.begin(i2c_addr::SHT30);
  g_bhOk = g_bh.begin(BH1750::CONTINUOUS_HIGH_RES_MODE, i2c_addr::BH1750);
  return g_shtOk || g_bhOk;
}

void recoverI2C() {
  // Bit-bang 9 clock untuk melepas slave yang menahan SDA.
  pinMode(pins::I2C_SCL, OUTPUT);
  pinMode(pins::I2C_SDA, INPUT_PULLUP);
  for (int i = 0; i < 9; i++) {
    digitalWrite(pins::I2C_SCL, HIGH); delayMicroseconds(5);
    digitalWrite(pins::I2C_SCL, LOW);  delayMicroseconds(5);
  }
  Wire.begin(pins::I2C_SDA, pins::I2C_SCL);
  Wire.setClock(100000);
}

void read(const Thresholds& t, SensorReading& out, Fault& sensorFault, uint32_t nowMs) {
  (void)nowMs;
  sensorFault = Fault::NONE;

  // --- SHT30 ---
  float temp = g_shtOk ? g_sht.readTemperature() : NAN;
  float rh = g_shtOk ? g_sht.readHumidity() : NAN;
  if (!isnan(temp) && !isnan(rh)) {
    out.temperature_c = temp; out.humidity_pct = rh;
    out.temp_valid = true; out.rh_valid = true;
    g_shtFails = 0;
  } else {
    out.temp_valid = false; out.rh_valid = false;
    if (++g_shtFails >= timing::SENSOR_FAIL_THRESHOLD) sensorFault = Fault::SHT30_ERROR;
  }

  // --- BH1750 ---
  float lux = g_bhOk ? g_bh.readLightLevel() : -1.0f;
  if (lux >= 0) {
    out.lux = lux; out.lux_valid = true; g_bhFails = 0;
  } else {
    out.lux_valid = false;
    if (++g_bhFails >= timing::SENSOR_FAIL_THRESHOLD && sensorFault == Fault::NONE)
      sensorFault = Fault::BH1750_ERROR;
  }

  // Jika kedua sensor I2C gagal beruntun, curigai bus macet -> recover.
  if (g_shtFails >= timing::SENSOR_FAIL_THRESHOLD &&
      g_bhFails >= timing::SENSOR_FAIL_THRESHOLD) {
    sensorFault = Fault::I2C_BUS_STUCK;
    recoverI2C();
  }

  // --- Soil ---
  uint32_t acc = 0;
  for (int i = 0; i < 8; i++) acc += analogRead(pins::SOIL_ADC);
  out.soil_raw_adc = static_cast<uint16_t>(acc / 8);
  float pct;
  if (control::soilPercent(t, out.soil_raw_adc, pct)) {
    out.soil_pct = pct; out.soil_valid = true;
  } else {
    out.soil_valid = false;
    if (t.soil_adc_dry == 0 || t.soil_adc_wet == 0) {
      if (sensorFault == Fault::NONE) sensorFault = Fault::SOIL_CALIBRATION_MISSING;
    } else if (sensorFault == Fault::NONE) {
      sensorFault = Fault::SOIL_SENSOR_ERROR;
    }
  }

  // GPIO35 tidak dipakai di Rev B. Jangan buat fault dari input floating.
  out.psu_voltage = 0;
  out.psu_valid = false;
}

}  // namespace sensors

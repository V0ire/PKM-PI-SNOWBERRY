#include <Arduino.h>
#include <Wire.h>
#include "config.h"

namespace {
uint32_t g_scanNumber;

void keepActuatorsOff() {
  constexpr uint8_t outputs[] = {
      pins::GROWLIGHT, pins::PUMP, pins::MIST, pins::FAN,
      pins::MIST_2, pins::FAN_2, pins::SPARE_SSR,
  };
  for (const uint8_t pin : outputs) {
    digitalWrite(pin, LOW);
    pinMode(pin, OUTPUT);
  }
}

const char* deviceName(uint8_t address) {
  if (address == i2c_addr::BH1750) return "BH1750 light sensor";
  if (address == i2c_addr::SHT30) return "SHT30 temperature/humidity sensor";
  return "unknown device";
}

void scanI2C() {
  uint8_t found = 0;
  bool bh1750Found = false;
  bool sht30Found = false;
  const uint32_t started = millis();
  Serial.printf("\n[i2c-scanner] Scan #%lu started\n", static_cast<unsigned long>(++g_scanNumber));
  for (uint8_t address = 1; address < 127; ++address) {
    Wire.beginTransmission(address);
    const uint8_t error = Wire.endTransmission();
    if (error == 0) {
      Serial.printf("[i2c-scanner] 0x%02X FOUND: %s\n", address, deviceName(address));
      bh1750Found |= address == i2c_addr::BH1750;
      sht30Found |= address == i2c_addr::SHT30;
      ++found;
    } else if (error == 2) {
      // Normal for an unused address; do not flood the serial monitor.
    } else if (error == 3) {
      Serial.printf("[i2c-scanner] 0x%02X NACK on data\n", address);
    } else if (error == 4) {
      Serial.printf("[i2c-scanner] 0x%02X Other I2C error\n", address);
    } else if (error == 5) {
      Serial.printf("[i2c-scanner] 0x%02X timeout\n", address);
    }
  }
  Serial.printf("[i2c-scanner] Expected BH1750 at 0x%02X: %s\n",
      i2c_addr::BH1750, bh1750Found ? "FOUND" : "MISSING");
  Serial.printf("[i2c-scanner] Expected SHT30 at 0x%02X: %s\n",
      i2c_addr::SHT30, sht30Found ? "FOUND" : "MISSING");
  Serial.printf("[i2c-scanner] SDA level=%s, SCL level=%s\n",
      digitalRead(pins::I2C_SDA) ? "HIGH" : "LOW",
      digitalRead(pins::I2C_SCL) ? "HIGH" : "LOW");
  Serial.printf("[i2c-scanner] Done: devices=%u duration=%lu ms\n", found,
      static_cast<unsigned long>(millis() - started));
  if (!bh1750Found || !sht30Found) {
    Serial.println("[i2c-scanner] Check 3.3V, GND, SDA, SCL, sensor address, and pull-up resistors.");
  }
}
}  // namespace

void setup() {
  keepActuatorsOff();
  Serial.begin(115200);
  Wire.begin(pins::I2C_SDA, pins::I2C_SCL);
  Wire.setClock(100000);
  delay(1000);
  Serial.println("\n=== Snowberry I2C Sensor Scanner ===");
  Serial.printf("Board: ESP32 | bus: 100 kHz | SDA=GPIO%u | SCL=GPIO%u\n",
      pins::I2C_SDA, pins::I2C_SCL);
  Serial.printf("Expected: BH1750=0x%02X, SHT30=0x%02X | repeat: 5 seconds\n",
      i2c_addr::BH1750, i2c_addr::SHT30);
  Serial.println("Actuator outputs are held LOW (OFF) during this scanner test.");
}

void loop() {
  scanI2C();
  delay(5000);
}

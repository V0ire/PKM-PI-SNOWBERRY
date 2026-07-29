#include <Arduino.h>
#include <BH1750.h>
#include <Wire.h>

namespace {
constexpr uint8_t SDA_PIN = 21;
constexpr uint8_t SCL_PIN = 22;
constexpr uint8_t BH1750_ADDRESS = 0x23;
constexpr uint32_t READ_INTERVAL_MS = 1000;

BH1750 lightMeter;
uint32_t lastReadMs = 0;
uint32_t reads = 0;
uint32_t failures = 0;
uint32_t saturated = 0;

bool addressResponds(uint8_t address) {
  Wire.beginTransmission(address);
  return Wire.endTransmission() == 0;
}

void printBusScan() {
  Serial.println("[scan] Scanning I2C bus...");
  uint8_t found = 0;
  for (uint8_t address = 1; address < 127; ++address) {
    Wire.beginTransmission(address);
    const uint8_t error = Wire.endTransmission();
    if (error == 0) {
      Serial.printf("[scan] Found device at 0x%02X\n", address);
      ++found;
    }
  }
  Serial.printf("[scan] Complete: %u device(s)\n", found);
}
}  // namespace

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\nSnowberry BH1750-only test");
  Serial.println("Wiring: VCC=3V3, GND=GND, SDA=GPIO21, SCL=GPIO22, ADDR=GND/default");

  if (!Wire.begin(SDA_PIN, SCL_PIN, 100000)) {
    Serial.println("[FAIL] Wire.begin failed");
    return;
  }
  Wire.setTimeOut(100);
  printBusScan();

  if (!addressResponds(BH1750_ADDRESS)) {
    Serial.println("[FAIL] No response from BH1750 at 0x23");
    Serial.println("Check VCC/GND/SDA/SCL and ADDR pin. Stop here.");
    return;
  }

  if (!lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE,
                        BH1750_ADDRESS, &Wire)) {
    Serial.println("[FAIL] BH1750 initialization failed");
    return;
  }
  Serial.println("[PASS] BH1750 initialized at 0x23");
  Serial.println("Cover sensor, then shine a lamp. Lux must change every second.");
}

void loop() {
  const uint32_t now = millis();
  if (now - lastReadMs < READ_INTERVAL_MS) return;
  lastReadMs = now;

  ++reads;
  const float lux = lightMeter.readLightLevel();
  if (lux < 0) {
    ++failures;
    Serial.printf("[FAIL] read=%lu lux=%.1f failures=%lu\n",
                  static_cast<unsigned long>(reads), lux,
                  static_cast<unsigned long>(failures));
    return;
  }

  if (lux >= 54600.0f) ++saturated;
  Serial.printf("[OK] read=%lu lux=%.1f saturated=%lu failures=%lu SDA=%d SCL=%d\n",
                static_cast<unsigned long>(reads), lux,
                static_cast<unsigned long>(saturated),
                static_cast<unsigned long>(failures),
                digitalRead(SDA_PIN), digitalRead(SCL_PIN));
}

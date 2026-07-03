// ============================================================================
// Snowberry Smart Greenhouse — ESP32 firmware (local-first)
//
// Tahap ini: kontrol lokal penuh tanpa WiFi/Firebase. Semua keputusan
// aktuator dibuat di ESP32 memakai threshold dari NVS.
//
// Decision priority (control::step):
//   boot safe-state > fault/safety OFF > sensor invalid > manual > auto > OFF
//
// Integrasi Firebase (login device, publish status/telemetry, baca command)
// ditambahkan pada tahap berikutnya — lihat firmware/README.md.
// ============================================================================
#include <Arduino.h>
#include "actuators.h"
#include "config.h"
#include "control.h"
#include "sensors.h"
#include "storage.h"
#include "types.h"

namespace {
Thresholds g_thresholds;
SensorReading g_sensor;
control::ManualCommand g_manual;   // diisi oleh layer Firebase nanti
control::TimeCtx g_time;           // diisi oleh NTP nanti
Fault g_activeFault = Fault::NONE;

uint32_t g_lastSensor = 0;
uint32_t g_lastControl = 0;
uint32_t g_lastReport = 0;

void logStatus(uint32_t nowMs) {
  Serial.printf("[%lus] T=%.1f RH=%.1f Lux=%.0f Soil=%.1f(%u) PSU=%.2f | ",
                nowMs / 1000,
                g_sensor.temperature_c, g_sensor.humidity_pct, g_sensor.lux,
                g_sensor.soil_pct, g_sensor.soil_raw_adc, g_sensor.psu_voltage);
  Serial.printf("GL=%d P=%d M=%d F=%d | fault=%s\n",
                actuators::isOn(ActuatorKey::GROWLIGHT),
                actuators::isOn(ActuatorKey::PUMP),
                actuators::isOn(ActuatorKey::MIST),
                actuators::isOn(ActuatorKey::FAN),
                faultCode(g_activeFault));
}

// Kalibrasi soil via tombol: tekan saat kering -> lepas -> tekan saat basah.
void runSoilCalibration() {
  Serial.println(">> Kalibrasi soil: pastikan sensor di media KERING, tekan tombol lagi...");
  while (digitalRead(pins::BUTTON) == LOW) delay(10);  // tunggu lepas
  while (digitalRead(pins::BUTTON) == HIGH) delay(10); // tunggu tekan (kering)
  delay(50);
  uint32_t acc = 0;
  for (int i = 0; i < 32; i++) { acc += analogRead(pins::SOIL_ADC); delay(5); }
  uint16_t dry = acc / 32;
  Serial.printf(">> ADC kering = %u. Basahi media, lalu tekan tombol...\n", dry);
  while (digitalRead(pins::BUTTON) == LOW) delay(10);
  while (digitalRead(pins::BUTTON) == HIGH) delay(10);
  delay(50);
  acc = 0;
  for (int i = 0; i < 32; i++) { acc += analogRead(pins::SOIL_ADC); delay(5); }
  uint16_t wet = acc / 32;
  Serial.printf(">> ADC basah = %u.\n", wet);
  if (dry > wet && (dry - wet) > 100) {
    if (storage::saveSoilCalibration(dry, wet)) {
      g_thresholds.soil_adc_dry = dry;
      g_thresholds.soil_adc_wet = wet;
      Serial.println(">> Kalibrasi tersimpan.");
    } else {
      Serial.println(">> Gagal simpan kalibrasi (NVS).");
    }
  } else {
    Serial.println(">> Kalibrasi tidak valid (kering harus > basah). Batal.");
  }
}
}  // namespace

void setup() {
  Serial.begin(115200);
  delay(100);

  // 1) SAFE STATE PALING AWAL — sebelum apa pun.
  actuators::initSafeState();
  Serial.println("\n[boot] Semua aktuator OFF (safe-state).");

  pinMode(pins::BUTTON, INPUT_PULLUP);

  // 2) Muat threshold dari NVS. Jika gagal, pakai default + fault.
  if (!storage::begin() || !storage::loadThresholds(g_thresholds)) {
    g_thresholds = Thresholds{};  // default aman Ciwidey
    g_activeFault = Fault::NVS_ERROR;
    Serial.println("[boot] NVS kosong/korupsi -> pakai default. Pump AUTO nonaktif sampai kalibrasi.");
  } else {
    Serial.println("[boot] Threshold dimuat dari NVS.");
  }

  // 3) Sensor terakhir (setelah safe-state aktif).
  if (!sensors::begin()) {
    Serial.println("[boot] Peringatan: sensor I2C tidak terdeteksi.");
  }

  // Kalibrasi opsional saat boot jika tombol ditahan.
  if (digitalRead(pins::BUTTON) == LOW) {
    delay(1500);
    if (digitalRead(pins::BUTTON) == LOW) runSoilCalibration();
  }

  g_time.synced = false;  // NTP menyusul di tahap Firebase.
  Serial.println("[boot] Masuk loop kontrol lokal.\n");
}

void loop() {
  const uint32_t now = millis();

  if (now - g_lastSensor >= timing::SENSOR_INTERVAL_MS) {
    g_lastSensor = now;
    Fault sensorFault = Fault::NONE;
    sensors::read(g_thresholds, g_sensor, sensorFault, now);
    if (sensorFault != Fault::NONE) g_activeFault = sensorFault;
    else if (g_activeFault != Fault::NVS_ERROR) g_activeFault = Fault::NONE;
  }

  if (now - g_lastControl >= timing::CONTROL_INTERVAL_MS) {
    g_lastControl = now;
    Fault controlFault = Fault::NONE;
    control::step(g_thresholds, g_sensor, g_manual, g_time, now, controlFault);
    if (controlFault != Fault::NONE) g_activeFault = controlFault;
  }

  if (now - g_lastReport >= 5000) {
    g_lastReport = now;
    logStatus(now);
  }

  // Tombol saat runtime -> masuk mode kalibrasi.
  if (digitalRead(pins::BUTTON) == LOW) {
    delay(50);
    if (digitalRead(pins::BUTTON) == LOW) runSoilCalibration();
  }
}

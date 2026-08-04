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
#include <WiFi.h>
#include "actuators.h"
#include "calibration.h"
#include "config.h"
#include "control.h"
#include "firebase_sync.h"
#include "sensors.h"
#include "status_json.h"
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
uint32_t g_lastCloudSample = 0;
char g_commandId[129] = {};
bool g_commandNeedsAck = false;
calibration::Machine g_calibration;

void logStatus(uint32_t nowMs) {
  Serial.printf("[%lus] T=%.1f RH=%.1f Lux=%.0f Soil=%.1f(%u) | ",
                nowMs / 1000,
                g_sensor.temperature_c, g_sensor.humidity_pct, g_sensor.lux,
                g_sensor.soil_pct, g_sensor.soil_raw_adc);
  Serial.printf("GL=%d P=%d HU=%d | fault=%s\n",
                actuators::isOn(ActuatorKey::GROWLIGHT),
                actuators::isOn(ActuatorKey::PUMP),
                actuators::isOn(ActuatorKey::HUMIDIFIER),
                faultCode(g_activeFault));
}

bool calibrationStep(uint32_t now) {
  if (!g_calibration.active()) return false;
  actuators::forceOff(ActuatorKey::GROWLIGHT, now);
  actuators::forceOff(ActuatorKey::PUMP, now);
  actuators::forceOff(ActuatorKey::HUMIDIFIER, now);
  uint32_t acc = 0;
  for (int i=0;i<8;i++) acc+=analogRead(pins::SOIL_ADC);
  auto result=g_calibration.update(digitalRead(pins::BUTTON)==LOW,static_cast<uint16_t>(acc/8),now);
  if(result.ready){
    if(storage::saveSoilCalibration(result.dry,result.wet)){
      g_thresholds.soil_adc_dry=result.dry;g_thresholds.soil_adc_wet=result.wet;
      g_thresholds.calibration_source=CalibrationSource::CALIBRATED;
      Serial.printf(">> Kalibrasi tersimpan: kering=%u basah=%u\n",result.dry,result.wet);
    } else Serial.println(">> Kalibrasi gagal disimpan.");
    g_calibration.reset();
  } else if(g_calibration.state()==calibration::State::CANCELLED){
    Serial.println(">> Kalibrasi dibatalkan atau melewati batas waktu.");g_calibration.reset();
  }
  return true;
}
}  // namespace

void setup() {
  // 1) SAFE STATE PALING AWAL — sebelum Serial/NVS/delay apa pun (Contract §2).
  actuators::initSafeState();

  Serial.begin(115200);
  delay(100);
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

  if (digitalRead(pins::BUTTON) == LOW) { g_calibration.start(millis()); Serial.println(">> Kalibrasi: lepas tombol, lalu tekan saat media kering dan basah."); }

  g_time.synced = false;
  fbsync::begin(fbsync::Config{});  // Kredensial/proyek dibaca dari NVS `firebase`.
  Serial.println("[boot] Masuk loop kontrol lokal.\n");
}

void loop() {
  const uint32_t now = millis();
  fbsync::loop(now);
  Thresholds cloudThresholds;
  if (fbsync::fetchThresholds(cloudThresholds)) g_thresholds = cloudThresholds;
  if (fbsync::pollCommand(g_manual, g_commandId, sizeof(g_commandId))) g_commandNeedsAck = true;
  int64_t epochMs = 0; uint8_t hour = 0;
  g_time.synced = fbsync::timeSynced(epochMs, hour);
  if (g_time.synced) { g_time.epoch_ms = epochMs; g_time.hour = hour; }

  if (calibrationStep(now)) return;

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
    if (g_commandNeedsAck) {
      const char* ack = controlFault == Fault::COMMAND_EXPIRED ? "EXPIRED"
        : controlFault == Fault::COMMAND_REJECTED_SAFETY ? "REJECTED_SAFETY"
        : controlFault == Fault::NONE ? "APPLIED" : "REJECTED_SAFETY";
      fbsync::publishAck(g_commandId, ack, controlFault == Fault::NONE ? "" : faultCode(controlFault));
      g_commandNeedsAck = false;
    }
  }

  if (now - g_lastCloudSample >= 60000) {
    g_lastCloudSample = now;
    char status[2048];
    if (status_json::buildStatus(status, sizeof(status), g_sensor, g_activeFault, "1.0.0",
                                 fbsync::online(), WiFi.RSSI(), g_time.synced, g_time.epoch_ms,
                                 g_thresholds.config_id, now / 1000, g_manual, g_time, now,
                                 g_thresholds.calibration_source))
      fbsync::publishStatus(status, now);
    char sample[512];
    char hhmm[6] = "--:--";
    if (g_time.synced) snprintf(hhmm, sizeof(hhmm), "%02u:00", g_time.hour);
    if (status_json::buildTelemetrySample(sample, sizeof(sample), hhmm, g_sensor, g_activeFault))
      fbsync::appendTelemetry(sample, now);
  }

  if (now - g_lastReport >= 5000) {
    g_lastReport = now;
    logStatus(now);
  }

  static bool wasPressed=false;
  bool pressed=digitalRead(pins::BUTTON)==LOW;
  if(pressed&&!wasPressed){g_calibration.start(now);Serial.println(">> Kalibrasi dimulai. Lepas tombol, tekan saat kering, lalu saat basah.");}
  wasPressed=pressed;
}

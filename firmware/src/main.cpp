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
#ifdef SNOWBERRY_MEASUREMENT_MODE
#include "measurement_server.h"
#endif
#include "sensors.h"
#include "storage.h"
#include "types.h"
#include "firebase_sync.h"
#include <esp_system.h>

namespace {
Thresholds g_thresholds;
SensorReading g_sensor;
control::ManualCommand g_manual;   // diisi oleh layer Firebase nanti
control::TimeCtx g_time;           // diisi oleh NTP nanti
Fault g_activeFault = Fault::NONE;

uint32_t g_lastSensor = 0;
uint32_t g_lastControl = 0;
uint32_t g_lastReport = 0;
uint32_t g_lastHeartbeat = 0;
uint32_t g_maxLoopUs = 0;
uint32_t g_minHeap = UINT32_MAX;
uint32_t g_bootCount = 0;
bool g_pendingCommandAck = false;
char g_pendingCommandId[64] = "";

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
  const auto d=fbsync::diagnostics();
  Serial.printf("[diag] reset=%d boot=%lu loop_max_us=%lu heap_min=%lu wifi=%d ntp=%d auth=%d net_ops=%lu net_fail=%lu\n",
                static_cast<int>(esp_reset_reason()),g_bootCount,g_maxLoopUs,g_minHeap,
                d.wifi_connected,d.ntp_synced,d.firebase_authenticated,
                d.network_operations,d.network_failures);
}

bool waitButton(uint8_t level,uint32_t deadline) {
  while (digitalRead(pins::BUTTON)==level) {
    if (static_cast<int32_t>(millis()-deadline)>=0) return false;
    delay(10);
  }
  return true;
}

// Kalibrasi soil via tombol: tekan saat kering -> lepas -> tekan saat basah.
void runSoilCalibration() {
  const uint32_t now = millis();
  for (uint8_t i = 0; i < static_cast<uint8_t>(ActuatorKey::COUNT); ++i) {
    actuators::forceOff(static_cast<ActuatorKey>(i), now);
  }
  Serial.println(">> Kalibrasi: semua aktuator OFF.");
  Serial.println(">> Kalibrasi soil: pastikan sensor di media KERING, tekan tombol lagi...");
  uint32_t deadline=millis()+timing::CALIBRATION_TIMEOUT_MS;
  if (!waitButton(LOW,deadline) || !waitButton(HIGH,deadline)) return;
  delay(50);
  uint32_t acc = 0;
  for (int i = 0; i < 32; i++) { acc += analogRead(pins::SOIL_ADC); delay(5); }
  uint16_t dry = acc / 32;
  Serial.printf(">> ADC kering = %u. Basahi media, lalu tekan tombol...\n", dry);
  deadline=millis()+timing::CALIBRATION_TIMEOUT_MS;
  if (!waitButton(LOW,deadline) || !waitButton(HIGH,deadline)) return;
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
  pinMode(LED_BUILTIN, OUTPUT);

  // 2) Muat threshold dari NVS. Jika gagal, pakai default + fault.
  const bool nvsReady=storage::begin();
  if (nvsReady) {
    g_bootCount=storage::incrementBootCount();
    control::PumpHistory history;
    storage::loadPumpHistory(history);  // missing/corrupt history keeps default five-hour lock
    control::restorePumpHistory(history,millis());
    control::setPumpHistorySaver(storage::savePumpHistory);
  }
  if (!nvsReady || !storage::loadThresholds(g_thresholds)) {
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

#ifdef SNOWBERRY_MEASUREMENT_MODE
  Serial.println("[boot] Masuk mode pengukuran: aktuator tetap OFF, API lokal aktif.");
  measurement::begin(&g_sensor);
#else
  g_time.synced = false;
  fbsync::Config cfg;
  fbsync::begin(cfg);
  Serial.println("[boot] Masuk loop kontrol lokal.\n");
#endif
}

void loop() {
  const uint32_t loopStart=micros();
  const uint32_t now = millis();

#ifndef SNOWBERRY_MEASUREMENT_MODE
  // Physical safety deadline always runs before Wi-Fi or cloud work.
  Fault deadlineFault=Fault::NONE;
  control::step(g_thresholds,g_sensor,g_manual,g_time,now,deadlineFault);
#endif

  if (now - g_lastSensor >= timing::SENSOR_INTERVAL_MS) {
    g_lastSensor = now;
    Fault sensorFault = Fault::NONE;
    sensors::read(g_thresholds, g_sensor, sensorFault, now);
    if (sensorFault != Fault::NONE) g_activeFault = sensorFault;
    else if (g_activeFault != Fault::NVS_ERROR) g_activeFault = Fault::NONE;
  }

#ifdef SNOWBERRY_MEASUREMENT_MODE
  measurement::loop();
#else
  fbsync::loop(now);
  g_time.synced = fbsync::timeSynced(g_time.epoch_ms, g_time.hour);
  char cmdId[64] = "";
  if (fbsync::pollCommand(g_manual, cmdId, sizeof(cmdId))) {
    strncpy(g_pendingCommandId, cmdId, sizeof(g_pendingCommandId) - 1);
    g_pendingCommandId[sizeof(g_pendingCommandId) - 1] = '\0';
    g_pendingCommandAck = true;
  }

  if (now - g_lastControl >= timing::CONTROL_INTERVAL_MS) {
    g_lastControl = now;
    Fault controlFault = Fault::NONE;
    control::step(g_thresholds, g_sensor, g_manual, g_time, now, controlFault);
    if (g_pendingCommandAck) {
      const bool rejectedSafety = controlFault == Fault::COMMAND_REJECTED_SAFETY;
      const bool expired = controlFault == Fault::COMMAND_EXPIRED;
      fbsync::publishAck(
        g_pendingCommandId,
        rejectedSafety ? "REJECTED_SAFETY" : expired ? "EXPIRED" : "APPLIED",
        rejectedSafety ? "Perintah pompa ditolak karena sensor media belum dikalibrasi." :
          expired ? "Perintah manual sudah kedaluwarsa." :
          g_manual.mode == Mode::AUTO ? "Alat kembali otomatis." : "Perintah manual diterapkan.");
      if (rejectedSafety || expired) g_manual.valid = false;
      g_pendingCommandAck = false;
    }
    if (controlFault != Fault::NONE) g_activeFault = controlFault;
  }
#endif

  if (now - g_lastReport >= 5000) {
    g_lastReport = now;
    logStatus(now);
#ifndef SNOWBERRY_MEASUREMENT_MODE
    fbsync::updateLiveSensors(g_sensor, g_activeFault, now);
#endif
  }

  if (now-g_lastHeartbeat>=timing::HEARTBEAT_INTERVAL_MS) {
    g_lastHeartbeat=now;
    digitalWrite(LED_BUILTIN,!digitalRead(LED_BUILTIN));
  }


  const uint32_t elapsed=micros()-loopStart;
  if (elapsed>g_maxLoopUs) g_maxLoopUs=elapsed;
  const uint32_t heap=ESP.getFreeHeap();
  if (heap<g_minHeap) g_minHeap=heap;
}

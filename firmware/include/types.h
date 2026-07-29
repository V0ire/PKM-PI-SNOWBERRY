#pragma once
#include <stdint.h>

// Fault codes MVP (jujur soal apa yang benar-benar diketahui firmware).
enum class Fault : uint8_t {
  NONE = 0,
  WIFI_OFFLINE,
  FIREBASE_OFFLINE,
  TIME_NOT_SYNCED,
  SHT30_ERROR,
  BH1750_ERROR,
  I2C_BUS_STUCK,
  SOIL_SENSOR_ERROR,
  SOIL_CALIBRATION_MISSING,
  PSU_VOLTAGE_LOW,
  CONFIG_INVALID,
  NVS_ERROR,
  COMMAND_EXPIRED,
  COMMAND_REJECTED_SAFETY,
  PUMP_NO_EFFECT,
  PUMP_MAX_CYCLE_REACHED,
};

const char* faultCode(Fault f);      // string kode, mis. "PUMP_NO_EFFECT"
const char* faultMessage(Fault f);   // pesan Bahasa Indonesia untuk petani

enum class ActuatorKey : uint8_t {
  GROWLIGHT = 0, PUMP, MIST, FAN, MIST_2, FAN_2, COUNT
};
enum class Mode : uint8_t { AUTO = 0, MANUAL };

// Alasan aktuator ON/OFF, dipetakan ke field `reason` di Firestore.
enum class Reason : uint8_t {
  SOIL_OK = 0, SOIL_LOW,
  HUMIDITY_OK, HUMIDITY_LOW, HUMIDITY_HIGH,
  TEMP_HIGH, TEMP_RH_OK,
  LUX_OK, LUX_LOW,
  MANUAL_OVERRIDE,
  SENSOR_INVALID,
  CONFIG_INVALID_REASON,
  PHOTOPERIOD_LIMIT,
  SAFETY_OFF,
};
const char* reasonStr(Reason r);

// Threshold + kalibrasi. Divalidasi sebelum dipakai/disimpan ke NVS.
struct Thresholds {
  float temp_low = 16.0f;
  float temp_high = 28.0f;
  float rh_low = 65.0f;
  float rh_high = 85.0f;   // Ciwidey dingin-lembap: fan buang lembap lebih sering
  float soil_low = 30.0f;
  float soil_high = 60.0f;
  float lux_low = 2000.0f;
  float lux_high = 5000.0f;
  uint32_t pump_pulse_ms = 10000;
  uint32_t soak_period_ms = 600000;
  uint16_t pump_start_limit = 2;
  uint32_t pump_window_ms = 18000000;
  uint8_t light_window_start = 6;      // jam 06:00 boleh growlight
  uint8_t light_window_end = 18;       // sampai 18:00
  float max_light_hours_per_day = 14;  // batas DLI kasar untuk stroberi

  // Kalibrasi soil (raw ADC), disimpan per unit.
  uint16_t soil_adc_dry = 0;
  uint16_t soil_adc_wet = 0;
};

struct SensorReading {
  float temperature_c = 0;
  float humidity_pct = 0;
  float lux = 0;
  uint16_t soil_raw_adc = 0;
  float soil_pct = 0;
  float psu_voltage = 0;

  bool temp_valid = false;
  bool rh_valid = false;
  bool lux_valid = false;
  bool soil_valid = false;   // false jika belum kalibrasi atau ADC pinned
  bool psu_valid = false;

  uint32_t temp_updated_ms = 0;
  uint32_t rh_updated_ms = 0;
  uint32_t lux_updated_ms = 0;
  uint32_t soil_updated_ms = 0;
};

struct ActuatorState {
  bool on = false;
  Mode mode = Mode::AUTO;
  uint32_t manual_until_ms = 0;  // basis millis() untuk fallback tanpa NTP
  int64_t manual_until_epoch = 0;
  Reason reason = Reason::SAFETY_OFF;
  uint32_t last_changed_ms = 0;
};

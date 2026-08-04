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
  GROWLIGHT = 0,
  PUMP,
  HUMIDIFIER,
  COUNT
};
enum class Mode : uint8_t { AUTO = 0, MANUAL };
enum class HumidifierPriority : uint8_t { RH = 0, TEMPERATURE };
enum class TemperatureFailureFallback : uint8_t { OFF = 0, RH_ONLY };
enum class CalibrationSource : uint8_t { FACTORY_DEFAULT = 0, CALIBRATED };

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
  char config_id[65] = "local-default";
  float temp_low = 16.0f;
  float temp_high = 28.0f;
  float rh_low = 65.0f;
  float rh_high = 85.0f;
  bool temperature_influence = false;
  HumidifierPriority humidifier_priority = HumidifierPriority::RH;
  TemperatureFailureFallback temperature_failure_fallback = TemperatureFailureFallback::OFF;
  float soil_low = 30.0f;
  float soil_high = 60.0f;
  float lux_low = 2000.0f;
  float lux_high = 5000.0f;
  bool light_schedule_enabled = false;
  uint8_t light_schedule_start_hour = 6;
  uint8_t light_schedule_end_hour = 18;
  uint32_t pump_pulse_ms = 45000;
  uint32_t soak_period_ms = 900000;
  uint8_t pump_start_limit = 2;
  uint32_t pump_window_ms = 18000000;

  // Kalibrasi soil (raw ADC), disimpan per unit.
  uint16_t soil_adc_dry = 3500;
  uint16_t soil_adc_wet = 1500;
  CalibrationSource calibration_source = CalibrationSource::FACTORY_DEFAULT;
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
  uint32_t temp_rh_at_ms = 0;
  uint32_t lux_at_ms = 0;
  uint32_t soil_at_ms = 0;
};

struct ActuatorState {
  bool on = false;
  Mode mode = Mode::AUTO;
  uint32_t manual_until_ms = 0;  // basis millis() untuk fallback tanpa NTP
  int64_t manual_until_epoch = 0;
  Reason reason = Reason::SAFETY_OFF;
  uint32_t last_changed_ms = 0;
};

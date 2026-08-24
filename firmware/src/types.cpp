#include "types.h"

const char* faultCode(Fault f) {
  switch (f) {
    case Fault::NONE: return "NONE";
    case Fault::WIFI_OFFLINE: return "WIFI_OFFLINE";
    case Fault::FIREBASE_OFFLINE: return "FIREBASE_OFFLINE";
    case Fault::TIME_NOT_SYNCED: return "TIME_NOT_SYNCED";
    case Fault::SHT30_ERROR: return "SHT30_ERROR";
    case Fault::BH1750_ERROR: return "BH1750_ERROR";
    case Fault::I2C_BUS_STUCK: return "I2C_BUS_STUCK";
    case Fault::SOIL_SENSOR_ERROR: return "SOIL_SENSOR_ERROR";
    case Fault::SOIL_CALIBRATION_MISSING: return "SOIL_CALIBRATION_MISSING";
    case Fault::PSU_VOLTAGE_LOW: return "PSU_VOLTAGE_LOW";
    case Fault::CONFIG_INVALID: return "CONFIG_INVALID";
    case Fault::NVS_ERROR: return "NVS_ERROR";
    case Fault::COMMAND_EXPIRED: return "COMMAND_EXPIRED";
    case Fault::COMMAND_REJECTED_SAFETY: return "COMMAND_REJECTED_SAFETY";
    case Fault::PUMP_NO_EFFECT: return "PUMP_NO_EFFECT";
    case Fault::PUMP_MAX_CYCLE_REACHED: return "PUMP_MAX_CYCLE_REACHED";
  }
  return "UNKNOWN";
}

const char* faultMessage(Fault f) {
  switch (f) {
    case Fault::NONE: return "";
    case Fault::WIFI_OFFLINE: return "WiFi terputus. Alat tetap bekerja otomatis.";
    case Fault::FIREBASE_OFFLINE: return "Server terputus. Alat tetap bekerja otomatis.";
    case Fault::TIME_NOT_SYNCED: return "Jam belum sinkron. Lampu tanam dibatasi sementara.";
    case Fault::SHT30_ERROR: return "Sensor suhu/kelembapan bermasalah.";
    case Fault::BH1750_ERROR: return "Sensor cahaya bermasalah.";
    case Fault::I2C_BUS_STUCK: return "Jalur sensor macet, sedang dipulihkan.";
    case Fault::SOIL_SENSOR_ERROR: return "Sensor kelembapan media bermasalah.";
    case Fault::SOIL_CALIBRATION_MISSING: return "Sensor media belum dikalibrasi. Pompa otomatis dimatikan.";
    case Fault::PSU_VOLTAGE_LOW: return "Tegangan listrik alat turun. Periksa adaptor 12V.";
    case Fault::CONFIG_INVALID: return "Pengaturan batas tidak valid. Memakai pengaturan terakhir.";
    case Fault::NVS_ERROR: return "Penyimpanan pengaturan bermasalah. Memakai nilai aman.";
    case Fault::COMMAND_EXPIRED: return "Perintah manual sudah kedaluwarsa.";
    case Fault::COMMAND_REJECTED_SAFETY: return "Perintah manual ditolak demi keamanan.";
    case Fault::PUMP_NO_EFFECT: return "Pompa menyiram tapi media tidak lembap. Periksa air, selang, atau sensor.";
    case Fault::PUMP_MAX_CYCLE_REACHED: return "Batas penyiraman per jam tercapai. Pompa diistirahatkan.";
  }
  return "";
}

const char* reasonStr(Reason r) {
  switch (r) {
    case Reason::SOIL_OK: return "soil_ok";
    case Reason::SOIL_LOW: return "soil_low";
    case Reason::HUMIDITY_OK: return "humidity_ok";
    case Reason::HUMIDITY_LOW: return "humidity_low";
    case Reason::HUMIDITY_HIGH: return "humidity_high";
    case Reason::TEMP_HIGH: return "temp_high";
    case Reason::TEMP_RH_OK: return "temp_rh_ok";
    case Reason::LUX_OK: return "lux_ok";
    case Reason::LUX_LOW: return "lux_low";
    case Reason::MANUAL_OVERRIDE: return "manual_override";
    case Reason::SENSOR_INVALID: return "sensor_invalid";
    case Reason::CONFIG_INVALID_REASON: return "config_invalid";
    case Reason::PHOTOPERIOD_LIMIT: return "photoperiod_limit";
    case Reason::WATER_WINDOW_WAIT: return "water_window_wait";
    case Reason::SAFETY_OFF: return "safety_off";
  }
  return "unknown";
}

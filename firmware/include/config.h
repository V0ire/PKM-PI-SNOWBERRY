#pragma once
#include <stdint.h>

// ============================================================================
// Rev B pin contract. All actuator outputs are active HIGH.
// ============================================================================
namespace pins {
constexpr uint8_t I2C_SDA = 21;
constexpr uint8_t I2C_SCL = 22;

constexpr uint8_t SOIL_ADC = 34;        // ADC1_CH6, input-only
constexpr uint8_t GROWLIGHT = 16;
constexpr uint8_t PUMP = 17;            // Relay pump, ACTIVE HIGH
constexpr uint8_t MIST = 18;            // Humidifier mist 1, ACTIVE HIGH
constexpr uint8_t FAN = 19;             // Humidifier fan 1, ACTIVE HIGH
constexpr uint8_t MIST_2 = 23;
constexpr uint8_t FAN_2 = 32;
constexpr uint8_t SPARE_SSR = 25;       // SSR ch2, ACTIVE HIGH, tanpa beban
constexpr uint8_t BUTTON = 33;          // INPUT_PULLUP, tekan = LOW
}  // namespace pins

// ---------------------------------------------------------------------------
// Polaritas aktuator. OFF-state wajib untuk boot safe-state.
// ---------------------------------------------------------------------------
namespace polarity {
constexpr uint8_t ACTIVE_HIGH_ON = 1;
constexpr uint8_t ACTIVE_HIGH_OFF = 0;
constexpr uint8_t ACTIVE_LOW_ON = 0;
constexpr uint8_t ACTIVE_LOW_OFF = 1;
}  // namespace polarity

// ---------------------------------------------------------------------------
// I2C addresses (wiring §A.5)
// ---------------------------------------------------------------------------
namespace i2c_addr {
constexpr uint8_t SHT30 = 0x44;
constexpr uint8_t BH1750 = 0x23;
}  // namespace i2c_addr


// ---------------------------------------------------------------------------
// Jendela otomatis harian (WIB, jam lokal NTP UTC+7).
// Keputusan produk 2026-08-24: siram otomatis hanya sore, lampu hanya malam.
// ---------------------------------------------------------------------------
namespace schedule {
constexpr uint8_t WATER_WINDOW_START_HOUR = 15;  // 15:00 sore
constexpr uint8_t WATER_WINDOW_END_HOUR = 18;    // 18:00 maghrib
}  // namespace schedule

// ---------------------------------------------------------------------------
// Timing loop (ms)
// ---------------------------------------------------------------------------
namespace timing {
constexpr uint32_t CONTROL_INTERVAL_MS = 1000;
constexpr uint32_t SENSOR_INTERVAL_MS = 2000;
constexpr uint32_t SENSOR_STALE_MS = 15000;       // data lebih tua = invalid
constexpr uint8_t SENSOR_FAIL_THRESHOLD = 3;      // gagal berturut sebelum fault
constexpr uint32_t MANUAL_MAX_MS = 30UL * 60UL * 1000UL;  // 30 menit
constexpr uint8_t DIAG_PIN = 27;
constexpr uint32_t DIAG_INTERVAL_MS = 500;
constexpr uint32_t CALIBRATION_STAGE_TIMEOUT_MS = 120000;
constexpr uint32_t STATUS_PUBLISH_INTERVAL_MS = 60000;    // api-contract §4
constexpr uint32_t COMMAND_POLL_INTERVAL_MS = 2000;       // manual mode responsif
constexpr uint32_t TELEMETRY_FLUSH_INTERVAL_MS = 60000;   // api-contract §5
}  // namespace timing

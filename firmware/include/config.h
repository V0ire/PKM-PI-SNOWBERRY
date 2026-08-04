#pragma once
#include <stdint.h>

// ============================================================================
// Snowberry final — tiga output aktif-HIGH.
// ============================================================================
namespace pins {
constexpr uint8_t I2C_SDA = 21;
constexpr uint8_t I2C_SCL = 22;

constexpr uint8_t SOIL_ADC = 34;        // ADC1_CH6, input-only

constexpr uint8_t GROWLIGHT = 16;       // SSR ch1, ACTIVE HIGH
constexpr uint8_t PUMP = 17;            // Pompa, ACTIVE HIGH
constexpr uint8_t HUMIDIFIER = 18;       // Pelembap gabungan, ACTIVE HIGH

constexpr uint8_t BUTTON = 33;          // INPUT_PULLUP, tekan = LOW (Rev B)
}  // namespace pins

// ---------------------------------------------------------------------------
// Semua output active-HIGH: LOW=OFF, HIGH=ON.
// ---------------------------------------------------------------------------
namespace polarity {
constexpr uint8_t SSR_ON = 1;      // active HIGH
constexpr uint8_t SSR_OFF = 0;
constexpr uint8_t RELAY_ON = 1;    // active HIGH (Rev B)
constexpr uint8_t RELAY_OFF = 0;   // active HIGH (Rev B)
}  // namespace polarity

// ---------------------------------------------------------------------------
// I2C addresses (wiring §A.5)
// ---------------------------------------------------------------------------
namespace i2c_addr {
constexpr uint8_t SHT30 = 0x44;
constexpr uint8_t BH1750 = 0x23;
}  // namespace i2c_addr

// ---------------------------------------------------------------------------
// Timing loop (ms)
// ---------------------------------------------------------------------------
namespace timing {
constexpr uint32_t CONTROL_INTERVAL_MS = 1000;
constexpr uint32_t SENSOR_INTERVAL_MS = 2000;
constexpr uint32_t SENSOR_STALE_MS = 15000;       // data lebih tua = invalid
constexpr uint8_t SENSOR_FAIL_THRESHOLD = 3;      // gagal berturut sebelum fault
constexpr uint32_t MANUAL_MAX_MS = 30UL * 60UL * 1000UL;  // 30 menit
}  // namespace timing

#pragma once
#include <stdint.h>

// ============================================================================
// Snowberry — Pin map (sumber: docs/03-technical/wiring-schematic.md §A.1)
// Jangan ubah tanpa memperbarui wiring-schematic.md.
// ============================================================================
namespace pins {
constexpr uint8_t I2C_SDA = 21;
constexpr uint8_t I2C_SCL = 22;

constexpr uint8_t SOIL_ADC = 34;        // ADC1_CH6, input-only
constexpr uint8_t VOLTAGE_ADC = 35;     // ADC1_CH7, 30k+10k divider di rail 12V

constexpr uint8_t GROWLIGHT = 16;       // SSR ch1, ACTIVE HIGH
constexpr uint8_t PUMP = 17;            // Relay ch1, ACTIVE LOW
constexpr uint8_t MIST = 18;            // Relay ch2, ACTIVE LOW (disc 24V)
constexpr uint8_t FAN = 19;             // Relay 1ch, ACTIVE LOW (fan 12V)
constexpr uint8_t SPARE_SSR = 25;       // SSR ch2, ACTIVE HIGH, tanpa beban
constexpr uint8_t BUTTON = 4;           // INPUT_PULLUP, tekan = LOW
}  // namespace pins

// ---------------------------------------------------------------------------
// Polaritas aktuator. OFF-state wajib untuk boot safe-state.
// ---------------------------------------------------------------------------
namespace polarity {
constexpr uint8_t SSR_ON = 1;      // active HIGH
constexpr uint8_t SSR_OFF = 0;
constexpr uint8_t RELAY_ON = 0;    // active LOW
constexpr uint8_t RELAY_OFF = 1;
}  // namespace polarity

// ---------------------------------------------------------------------------
// I2C addresses (wiring §A.5)
// ---------------------------------------------------------------------------
namespace i2c_addr {
constexpr uint8_t SHT30 = 0x44;
constexpr uint8_t BH1750 = 0x23;
}  // namespace i2c_addr

// ---------------------------------------------------------------------------
// Voltage divider 12V rail: V_adc = V_rail * 10k / 40k (wiring §C.4)
// adc_raw < ~3100 (12-bit) => rail < 10.0V => PSU low.
// ---------------------------------------------------------------------------
namespace psu {
constexpr float DIVIDER_RATIO = 40.0f / 10.0f;   // V_rail = V_adc * 4
constexpr float ADC_REF_V = 3.3f;
constexpr uint16_t ADC_MAX = 4095;
constexpr float RAIL_LOW_V = 10.0f;              // di bawah ini = fault
constexpr float RAIL_NOMINAL_V = 12.0f;
}  // namespace psu

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

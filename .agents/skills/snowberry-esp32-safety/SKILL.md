---
name: snowberry-esp32-safety
description: Use when editing Snowberry ESP32 firmware, GPIO mapping, relay/SSR control, sensors, WiFi, NVS, fail-safe behavior, or Firebase sync.
---

# Snowberry ESP32 Safety Skill

Always read:
- `docs/03-technical/wiring-schematic.md`
- `docs/01-product/overview.md`

## Pin Rules

Known mapping:
- GPIO 21: I2C SDA
- GPIO 22: I2C SCL
- GPIO 34: Soil ADC
- GPIO 35: Voltage divider ADC
- GPIO 16: SSR growlight, active HIGH
- GPIO 17: Pump relay, active LOW
- GPIO 18: Mist relay, active LOW
- GPIO 19: Fan relay, active LOW
- GPIO 4: Button
- GPIO 25: SSR spare, active HIGH

Do not use flash pins:
- GPIO 6, 7, 8, 9, 10, 11

Avoid strapping pins:
- GPIO 0, 2, 5, 12, 15

## Fail-safe

First action in setup:
- Set SSR pins LOW.
- Set relay pins HIGH.
- Confirm all actuators OFF before WiFi, Firebase, or sensors.

## Control Philosophy

- Use bang-bang control with hysteresis.
- Do not use PID for relay/SSR ON/OFF actuators.
- Pump must use pulsed watering plus soak period.
- If sensor data is invalid for too long, related actuator goes OFF.
- Local ESP32 control must keep working without WiFi.
- Store thresholds and calibration in NVS.
- Do not log long-term telemetry into ESP32 flash.

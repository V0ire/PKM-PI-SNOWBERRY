---
name: snowberry-firebase-contract
description: Use when implementing Firebase Auth, Firestore reads/writes, realtime listeners, thresholds, commands, telemetry, seed data, or security rules for Snowberry.
---

# Snowberry Firebase Contract Skill

Always read:
- `docs/03-technical/api-contract.md`

## Valid Paths

Use:
- `devices/{deviceId}/status/realtime`
- `devices/{deviceId}/config/thresholds`
- `devices/{deviceId}/config/commands`
- `devices/{deviceId}/telemetry/{YYYY-MM-DD}`
- `users/{uid}`

Do not use:
- `sensorLog`
- random flat sensor collections
- one document per sensor per minute

## Realtime Dashboard

Read:
- `devices/{deviceId}/status/realtime`

Expected fields:
- `sensors.temperature_c`
- `sensors.humidity_pct`
- `sensors.lux`
- `sensors.soil_pct`
- `sensors.psu_voltage`
- `actuators.growlight`
- `actuators.pump`
- `actuators.mist`
- `actuators.fan`
- `device.online`
- `fault.active_code`
- `fault.active_message`
- `last_seen`

## Threshold Validation

Validate:
- `temp_low < temp_high`
- `rh_low < rh_high`
- `soil_low < soil_high`
- `lux_low < lux_high`
- `pump_pulse_ms <= soak_period_ms`

## Manual Command Payload

Write to:
- `devices/{deviceId}/config/commands`

Payload:
- `actuator`
- `mode`
- `state`
- `manual_until`
- `issued_at`
- `issued_by`

Manual mode expires after 30 minutes.

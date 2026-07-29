# Snowberry Rev B Hardware–Firmware Contract

**Status:** Audit candidate; current firmware does not yet satisfy this contract.

## 1. Physical and Logical Model

### Logical systems exposed to control/UI

```text
GROWLIGHT
PUMP
HUMIDIFIER
```

### Physical outputs

```text
GPIO16 -> SSR1 growlight
GPIO25 -> SSR2 spare, always OFF
GPIO17 -> pump relay
GPIO18 -> mist 1 relay
GPIO19 -> fan 1 relay
GPIO23 -> mist 2 relay
GPIO32 -> fan 2 relay
```

Every physical output is active-HIGH: LOW=OFF, HIGH=ON.

`HUMIDIFIER ON` means all four pins 18, 19, 23, and 32 are HIGH. `HUMIDIFIER OFF` means all four are LOW. Mixed states are never requested by normal firmware.

## 2. Boot Contract

Before Wi-Fi, Firebase, NTP, NVS, or sensors initialize:

1. Write LOW to GPIO16, 25, 17, 18, 19, 23, and 32.
2. Then configure each as OUTPUT.
3. Initialize internal physical state as OFF.
4. Keep SSR2/GPIO25 LOW for the complete runtime.
5. Do not resume an AUTO output until its required sensor data is valid.

Host boot tests must verify `digitalWrite(LOW)` occurs before `pinMode(OUTPUT)` for all seven outputs.

Hardware provides a 10 kΩ pulldown on every output.

## 3. Input Contract

| Input | GPIO | Validity requirement |
|---|---:|---|
| SHT30 RH/T | SDA21/SCL22 | RH valid and fresh for humidifier |
| BH1750 lux | SDA21/SCL22 | lux valid and fresh for growlight |
| Soil AOUT | 34 | calibrated, not pinned/out of range, fresh for pump |
| Calibration button | 33 | active-LOW, internal pullup |
| GPIO35 | — | unused in Rev B; no PSU diagnosis |

## 4. Default Parameters

The final defaults are:

```text
rh_low             = existing approved value 65%
rh_high            = existing approved value 85%
soil_low            = 30%
soil_high           = 60%
pump_pulse_ms       = 10,000 ms
soak_period_ms      = 600,000 ms
pump_start_limit    = 2 starts
pump_window_ms      = 18,000,000 ms (5 hours)
lux_low             = 2,000 lux
lux_high            = 5,000 lux
light_window_start  = 06:00 Asia/Jakarta
light_window_end    = 18:00 Asia/Jakarta
manual_max_ms       = 1,800,000 ms (30 minutes)
```

Soil dry/wet ADC defaults must be zero/unconfigured in production. Firmware must not force `1700/3500` or write demo values on every boot.

## 5. Pump Contract

### AUTO

- If soil invalid or calibration missing: pump OFF.
- Start one pulse when soil `<=30%`, if safety budget allows.
- Pulse lasts exactly 10 seconds.
- Pump remains OFF for at least 10 minutes after a pulse.
- If soil reaches `>=60%`, cancel further pulses.
- Maximum two starts in any rolling five-hour window.
- A third requested start is rejected/blocked and reported without energizing the relay.

### Persistence

A reboot must not erase the safety budget in a way that permits immediate extra watering. The implementation must either:

1. persist pulse-start timestamps/remaining lockout safely, or
2. conservatively lock automatic/manual starts after reboot until a five-hour safe period has elapsed.

The exact persistence strategy requires audit for flash wear and clock-unavailable behavior.

### Manual

Manual pump ON means one 10-second pulse, not a timed continuous override. It consumes the same two-start/five-hour budget and obeys soil-validity checks. There is no farmer command that holds the pump continuously ON.

## 6. Humidifier Contract

The humidifier is RH-only. Temperature never activates fan or mist in Rev B.

- RH `<=rh_low`: turn all four outputs ON.
- RH `>=rh_high`: turn all four outputs OFF.
- Between thresholds: retain combined previous state.
- SHT30/RH invalid or stale: all four OFF.
- Manual ON/OFF acts on all four outputs together.
- Manual mode expires after at most 30 minutes, then returns to AUTO.
- High RH does not run fans independently in this build.

## 7. Growlight Contract

- BH1750 invalid or stale: OFF.
- Time not synchronized: OFF in Rev B conservative mode.
- Outside 06:00–18:00 local time: OFF.
- In window and lux `<=lux_low`: ON.
- Lux `>=lux_high`: OFF.
- Between thresholds: retain prior state.
- Manual mode expires after at most 30 minutes and cannot energize when a hard safety condition forbids it.
- SSR2 remains OFF regardless of command/config payload.

## 8. Fail-Safe Contract

| Failure | Firmware result |
|---|---|
| SHT30 invalid/stale | humidifier physical pins all LOW |
| BH1750 invalid/stale | GPIO16 LOW |
| Soil invalid/uncalibrated | GPIO17 LOW; manual pulse rejected |
| Wi-Fi/Firebase unavailable | local AUTO continues using last valid NVS config |
| NVS config invalid | pump OFF; safe validated defaults for other systems |
| Reboot | all seven outputs LOW before initialization |
| Manual command expired | logical system returns AUTO |
| GPIO35 absent | no `PSU_VOLTAGE_LOW` assertion from floating data |

Firmware reports commanded output state only. It must not claim adapter, relay, motor, airflow, mist output, or lamp feedback without sensors that provide such evidence.

## 9. Firebase/UI Contract

Farmer-facing systems remain `growlight`, `pump`, and `humidifier`.

- `humidifier.state` is the combined command state.
- Optional physical fields may show `mist_1`, `fan_1`, `mist_2`, and `fan_2`, but they remain commanded states.
- Pump manual command type is a single safe pulse.
- Humidifier and growlight manual durations are capped at 30 minutes.
- Controls disable or report unavailable when authenticated Firebase communication is unavailable.
- One farmer account and one separate device account are used; no public Firestore access.

## 10. Current-Code Gaps

At audit-packet creation, these files contradict Rev B:

- `firmware/include/config.h`: only GPIO17/18/19, active-LOW, button GPIO4, GPIO35 PSU monitor.
- `firmware/include/types.h`: four actuator keys, demo soil ADC values, old pump defaults.
- `firmware/src/actuators.cpp`: four physical channels.
- `firmware/src/control.cpp`: temperature influences fan/mist; high RH can run fan alone; one-hour pump budget.
- `firmware/src/main.cpp`: temporary demo calibration/NVS writes.
- `firmware/src/firebase_sync.cpp`: incomplete secure device-auth/config/telemetry behavior.

No hardware should be connected under the assumption that these gaps are already fixed.

## 11. Required Tests

### Host tests

- Seven-pin boot order.
- Combined four-output humidifier fanout.
- RH-only truth table and invalid-SHT30 OFF.
- Pump 30/60 thresholds, 10 s pulse, 10 min soak, two starts/five hours.
- Manual pump consumes budget.
- Reboot/persistence safety.
- Growlight synchronized-time window and unsynchronized OFF.
- SSR2 always OFF.
- GPIO35 does not generate a Rev B PSU fault.

### Hardware tests

- 20 power/reset cycles: no click/indicator activation.
- 100 transitions on every mechanical relay with contacts unloaded.
- Exactly one relay changes per actuator-test command.
- All four humidifier outputs change together.
- Sensor disconnect drives related physical output LOW.
- Network loss does not delay local control.

## 12. Acceptance

This contract is accepted only when:

```text
bash firmware/test/run_host_tests.sh
pio run -d firmware -e esp32dev
pio run -d firmware -e actuator-test
pio run -d firmware -e measurement
npm --prefix web-app run build
```

all pass, and the physical tests above have recorded evidence.

# Snowberry Progress and AI Handoff

Last audited: 2026-07-21

## Purpose

This is the current implementation and hardware handoff for Snowberry. Read
this file before changing firmware, Firebase integration, dashboard behavior,
or actuator wiring.

Project objective for the current prototype:

```text
Sensors -> ESP32 local decisions -> GPIO -> driver -> relay/SSR -> actuator
                    |
                    +-> Firestore -> hosted phone dashboard
```

Local ESP32 control is the source of truth. Firebase is for monitoring,
configuration, and temporary manual-command overlay. Loss of WiFi or Firebase
must not stop automatic local control.

## Executive Status

| Area | Status | Evidence / Limitation |
| --- | --- | --- |
| SHT30 temperature/humidity | Working on bench | Serial values observed and changed with environment |
| BH1750 light | Working on bench | Lux changes observed; growlight state followed thresholds |
| Soil ADC | Reads raw values | Demo calibration is forced to wet `1700`, dry `3500`; field calibration still required |
| Growlight logic | Working in firmware | Observed `GL=1` in darkness, `GL=0` after bright light, then `GL=1` when dark |
| Pump logic | Implemented | 5 s pulse + 30 s soak; real pump load not yet validated |
| Mist/fan logic | Implemented | Both ON for high temperature or low RH; extreme high RH keeps fan ON and mist OFF |
| Mechanical relay interface | Blocked pending driver | Modules were bench-identified as 5 V HIGH-trigger; 3.3 V input chatters |
| SSR control input | Partially verified | GPIO/indicator can be tested; SSR AC output not bench-verified with a load |
| Firestore status publishing | Working when network works | Repeated serial `code=200` observed |
| Dashboard realtime schema | Implemented | Firmware publishes sensors, actuators, device, fault, ack, epoch `last_seen` |
| Manual command round trip | Implemented, not fully re-verified | Parser and ack fixed; repeat complete phone-to-device test after relay polarity work |
| Hosted PWA | Deployed | `https://snowberry-f589b.web.app` returns HTTP 200 |
| APK | Not created | Hosted PWA is available; Capacitor APK packaging deferred |
| Firebase security | Prototype-only / unsafe for unattended use | Authentication and restrictive rules intentionally deferred by user |

## Current Pin Map

Source of truth remains `docs/03-technical/wiring-schematic.md`, except for the
bench-discovered mechanical relay input behavior described below.

| Function | GPIO | Current firmware polarity |
| --- | ---: | --- |
| Growlight SSR | 16 | active HIGH |
| Pump relay | 17 | active LOW, must change after driver installation |
| Mist-maker relay | 18 | active LOW, must change after driver installation |
| Fan relay | 19 | active LOW, must change after driver installation |
| Soil ADC | 34 | input |
| PSU monitor ADC | 35 | input, currently floating/unwired |
| I2C SDA | 21 | SHT30 + BH1750 |
| I2C SCL | 22 | SHT30 + BH1750 |
| Soil calibration button | 4 | active LOW with `INPUT_PULLUP` |

## Critical Hardware Finding

Bench testing established this behavior for the available mechanical relay
modules:

```text
Relay S/IN = 0 V   -> relay OFF -> COM-NC continuity
Relay S/IN = 5 V   -> relay ON  -> COM-NO continuity
Relay S/IN = 3.3 V -> unstable / LED flicker / repeated clicking
```

Therefore:

- Do not connect GPIO 17, 18, or 19 directly to these relay inputs.
- Do not attach real loads while relay input chatter exists.
- Install a non-inverting 3.3 V to 5 V driver first.
- Preferred driver: one `74HCT125` or `74AHCT125` for all three channels.
- Fallback: one BC547 NPN + one BC557 PNP pair per relay channel.
- Full wiring is documented in
  `docs/03-technical/actuator-driver-wiring.md`.

After either documented driver is installed, required relay logic becomes:

```text
GPIO LOW  -> driver output 0 V -> relay OFF
GPIO HIGH -> driver output 5 V -> relay ON
```

The production firmware and `actuator-test` firmware currently still treat
GPIO 17-19 as active LOW. **Change both to active HIGH before connecting the
new drivers.** Safe boot must drive GPIO 17-19 LOW after that change.

The growlight SSR remains active HIGH on GPIO 16. It does not click because it
is solid-state. Continuity/diode mode is not a valid output test for a TRIAC
SSR. Test its input LED/GPIO first; test AC output only with proper fused,
insulated mains wiring outside the breadboard.

## Power and Load Information

Latest user-provided supply/load information:

```text
Pump supply: 12 V, 8 A adapter/rating reported
Mist maker:  24 V, 1 A adapter/rating reported
Fan:         24 V, 650 mA reported
Relay coil/control modules: 5 V
```

Confirm whether 12 V 8 A and 24 V 1 A are adapter capacities or actual load
currents before choosing final fuses and wire gauges.

Bench control-side power arrangement:

```text
Laptop USB -> ESP32 + sensors
12 V adapter -> LM2596 set to 5.0 V -> relay modules + logic driver
ESP32 GND <-> LM2596 OUT- <-> relay/driver GND
```

Do not connect LM2596 `OUT+` to ESP32 `VIN/5V` while laptop USB powers the
ESP32. Capacitors connect in parallel across 5 V/GND, never in series.

Do not route pump, fan, mist-maker, or AC current through a solderless
breadboard. Use fused branches, terminal blocks, and appropriately rated wire.

## Current Automatic Logic

Defaults in `firmware/include/types.h` and current implementation:

### Growlight

```text
Lux <= 2000 -> growlight requested ON
Lux >= 5000 -> growlight requested OFF
Between thresholds -> hold previous state (hysteresis)
Allowed window after NTP sync: 06:00-18:00 local time
Demo minimum ON/OFF hold: 5 seconds
```

Bench evidence showed the expected sequence: low lux `GL=1`, bright lux
`GL=0`, then low lux `GL=1`.

### Pump

```text
Demo soil calibration: wet=1700, dry=3500 raw ADC
Soil <= 50% -> start watering cycle
Pump ON for 5 seconds
Pump OFF for 30-second soak
Repeat while still dry and below safety limits
Soil >= 70% -> stop watering cycle
Maximum cycles/hour and maximum total ON time/hour remain enabled
```

Important: `firmware/src/main.cpp` currently forces `1700/3500` and the 5 s
pulse into NVS on every boot. This is temporary demo behavior, overrides
persisted field calibration after every reboot, and adds an unnecessary NVS
write each boot. Remove it after real Ciwidey calibration is available.

### Mist Maker and Fan

Current `controlFanMist()` behavior:

```text
Temperature >= 28 C OR RH <= 65% -> mist and fan requested ON together
Temperature <= 27.5 C and RH >= 67% -> eligible to turn both OFF
RH >= 85% -> fan ON, mist OFF to remove excess humidity
```

There is an unresolved requirement nuance: the user asked mist and fan to run
together for high temperature or low humidity. Current code intentionally
runs fan alone for extreme high humidity. Confirm before changing this branch.

### Fail-Safe Behavior

- Actuator pins enter safe state before WiFi, Firebase, or sensors initialize.
- Invalid related sensor forces its actuator OFF.
- Pump uses pulse/soak and hourly limits.
- Cloud failure does not stop local control.
- Manual pump ON is rejected when soil data is invalid.

## Sensor and Fault State

### Soil

Observed raw readings ranged roughly from `2057` to `3297`. Large jumps should
be checked for sensor placement, media contact, connector quality, and actual
moisture changes. Do not trust the forced demo calibration as field calibration.

### PSU Monitor

GPIO 35 is currently floating because the 12 V divider is not connected.
Observed random `PSU` values created false `PSU_VOLTAGE_LOW` faults.

Do not diagnose the adapter from current GPIO 35 readings. Either:

1. wire the documented 30 kOhm / 10 kOhm divider and filter safely, or
2. explicitly disable PSU faulting in a separate demo configuration.

Do not hide the fault globally without a clear hardware mode.

## Firebase and Protocol

The integration is bidirectional Firestore over HTTPS REST:

```text
ESP32 PATCHes devices/snowberry-001/status/realtime
Dashboard listens with Firestore onSnapshot

Dashboard writes devices/snowberry-001/config/commands
ESP32 GETs the command document every 5 seconds
ESP32 applies/rejects it locally
ESP32 PATCHes command_ack and actuator status
Dashboard receives ack and exits loading state
```

Implemented firmware fixes:

- NTP gate before TLS requests.
- Valid Google Trust Services GTS Root R1 certificate.
- Correct Unix epoch milliseconds for `last_seen`.
- Full status schema: sensors, actuators, device, fault, command ack.
- Firestore typed REST value parser for `stringValue`, `booleanValue`, and
  `integerValue`.
- Manual duration and expiry support.
- Acknowledgement fields including `ack_at`.
- HTTP response body logging for non-2xx status responses.
- 1.5-second connect/read timeouts.
- Shared 30-second cloud retry cooldown after network failure.

Known limitations:

- Firestore access is currently unauthenticated/public for the prototype.
- ESP32 ID-token login and refresh are not implemented.
- `fetchThresholds()`, telemetry append, and generic status functions remain
  stubs; only live status and commands are active.
- Manual command round trip needs one final end-to-end test on the latest
  firmware after network and relay-driver work stabilizes.
- The old corrupt placeholder certificate remains inside a disabled `#if 0`
  block in `firebase_sync.cpp`; active code uses the valid certificate.

Credentials are stored in ignored local files. Do not print or commit them:

```text
firmware/include/firebase_config.local.h
web-app/.env.local
```

Credentials appeared during earlier troubleshooting and should be rotated
before any unattended or public field deployment.

## Dashboard and Hosting

Frontend stack:

```text
React 19 + TypeScript + Vite + Firebase Web SDK
```

Current behavior:

- Reads `devices/{deviceId}/status/realtime` via `onSnapshot`.
- Normalizes missing Firestore fields so actuator cards still render safely.
- Writes manual commands to `devices/{deviceId}/config/commands`.
- Waits for matching `command_ack` instead of assuming success.
- Uses epoch `last_seen` to determine Online/Stale/Offline.
- Includes a PWA manifest and service worker.

Deployment:

```text
Firebase project: snowberry-f589b
Hosted URL: https://snowberry-f589b.web.app
Hosting config: firebase.json
Project config: .firebaserc
```

Verified:

- `npm run build` passes.
- `npm audit --omit=dev` reports zero vulnerabilities.
- Hosted root URL returns HTTP 200.
- Manifest and service worker previously returned HTTP 200 over HTTPS.
- Hosting security headers are configured.

Not verified in automation:

- Full browser runtime smoke test, because Chrome was unavailable in the agent
  environment.
- Install prompt behavior on the farmer's physical Android phone.
- Remote manual command from mobile data after the latest firmware changes.

No APK exists. Current recommended demo delivery is the installed PWA from the
hosted URL. Capacitor APK packaging remains optional after the hosted flow is
fully verified.

## Serial Actuator Test Firmware

Files:

```text
firmware/src/actuator_test.cpp
firmware/platformio.ini -> env:actuator-test
```

Commands:

```text
1 = toggle GPIO 16 / growlight SSR
2 = toggle GPIO 17 / pump relay
3 = toggle GPIO 18 / mist relay
4 = toggle GPIO 19 / fan relay
0 = force all OFF
? = print menu
```

Build and upload:

```bash
cd firmware
pio run -e actuator-test
pio run -e actuator-test -t upload --upload-port /dev/ttyUSB0
pio device monitor --port /dev/ttyUSB0 -b 115200
```

Restore normal firmware:

```bash
pio run -e esp32dev -t upload --upload-port /dev/ttyUSB0
```

Important: this test firmware still encodes GPIO 17-19 as active LOW. Update it
to active HIGH at the same time as production firmware before testing through
the documented 74HCT125 or transistor drivers.

## Verification Results From This Audit

```text
platformio run -e esp32dev      PASS
platformio run -e actuator-test PASS
npm run build                   PASS
npm audit --omit=dev            PASS, 0 vulnerabilities
https://snowberry-f589b.web.app HTTP 200
```

The two PlatformIO environments were once launched in parallel and produced a
temporary `.pio/build` cleanup warning. Both final builds completed
successfully. Run PlatformIO environments sequentially if the warning recurs.

## Repository State

The worktree is dirty and contains many existing modified/untracked files from
the user and prior work. Do not revert unrelated changes.

Important current files include:

```text
progress.md
docs/03-technical/actuator-driver-wiring.md
firmware/src/firebase_sync.cpp
firmware/src/actuator_test.cpp
firmware/src/control.cpp
firmware/src/actuators.cpp
firmware/src/main.cpp
firmware/include/types.h
firmware/platformio.ini
web-app/src/services/firebaseDataSource.ts
web-app/public/manifest.webmanifest
web-app/public/service-worker.js
firebase.json
.firebaserc
```

`.firebase/` is an untracked local Hosting cache. Do not treat it as source.
No commit was created in this session.

## Exact Next Actions

1. Acquire and install one non-inverting relay driver option from
   `docs/03-technical/actuator-driver-wiring.md`.
2. Change GPIO 17-19 production and actuator-test polarity to active HIGH.
3. Change safe boot for GPIO 17-19 to LOW and verify every output remains OFF
   during reset and startup.
4. Keep COM/NO/NC unloaded and run at least ten ON/OFF cycles per channel.
5. Confirm relay OFF is COM-NC and relay ON is COM-NO, with one click per
   transition and no chatter.
6. Wire or intentionally disable the PSU monitor for the demo configuration.
7. Perform real soil calibration in the actual Ciwidey growing medium and
   remove forced `1700/3500` boot values/NVS write.
8. Verify automatic logic with unloaded relay contacts:
   growlight lux hysteresis, pump pulse/soak, and mist/fan behavior.
9. Verify full manual command round trip from the hosted app using mobile data.
10. Add one real low-voltage load at a time with correct fuses, wire, terminal
    blocks, and load-specific suppression.
11. Connect and test AC growlight last, outside the breadboard and under
    qualified mains supervision.
12. Rotate exposed credentials and add Firebase Auth/security rules before
    unattended deployment.

## Do Not Do

- Do not connect 5 V relay inputs directly to ESP32 GPIO.
- Do not connect real loads while relays chatter.
- Do not route actuator current or AC mains through a solderless breadboard.
- Do not test SSR output using only continuity or diode mode.
- Do not trust floating GPIO 35 PSU readings.
- Do not treat forced demo soil calibration as final field calibration.
- Do not assume APK packaging fixes Firebase or manual-command failures.
- Do not revert unrelated dirty-worktree changes.

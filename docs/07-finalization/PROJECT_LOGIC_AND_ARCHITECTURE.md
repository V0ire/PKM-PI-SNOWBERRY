# Snowberry Rev B — Complete Project Logic and Architecture

**Status:** Final target architecture for implementation and audit  
**Hardware revision:** Rev B, matrix-board prototype  
**Project:** PKM-PI Snowberry Smart Greenhouse  
**Location:** Ciwidey, Indonesia

> This document describes the intended final system. The current firmware still contains Rev A behavior and must be updated before connecting the Rev B active-HIGH relays.

---

## 1. Project Goal

Snowberry is a local-first automatic greenhouse controller for white strawberries. It monitors environmental conditions, controls greenhouse equipment automatically, and presents simple information to a non-technical farmer.

The final system controls three farmer-facing systems:

1. **Watering** — one 12 V pump.
2. **Humidifier** — two 24 V mist makers and two 24 V fans operating as one combined system.
3. **Growlight** — all growlights on one AC SSR channel.

The farmer can:

- Read live sensor conditions remotely.
- See whether each system is commanded ON or OFF and why.
- Temporarily control the humidifier or growlight for up to 30 minutes.
- Request one safe watering pulse.

The ESP32 remains responsible for every automatic and safety decision. Firebase and the web app cannot directly bypass local safety rules.

---

## 2. Core Design Principle

```text
Sensors
   ↓
ESP32 validates readings
   ↓
Local control state machines
   ↓
Safety checks
   ↓
GPIO outputs
   ↓
Relay/SSR control inputs
   ↓
Independent actuator power circuits
   ↓
Pump, humidifiers, and growlights
```

Cloud communication is a parallel monitoring and command channel:

```text
ESP32 local control ───────────────→ physical outputs
       │
       ├── status ──→ Firebase ──→ hosted farmer PWA
       │
       └── commands ← Firebase ←── farmer PWA
                          │
                          └── commands still pass ESP32 safety checks
```

If Wi-Fi or Firebase fails:

```text
Local sensing and AUTO control continue.
Remote readings become stale.
Remote commands become unavailable.
```

---

## 3. System Layers

Snowberry has five practical layers:

| Layer | Responsibility |
|---|---|
| Sensors | Measure temperature, RH, light, and media moisture |
| ESP32 firmware | Validate data, make local decisions, enforce safety and timing |
| Output hardware | Convert GPIO commands into relay/SSR switching |
| Actuator power | Independently power pump, mist makers, fans, and growlights |
| Firebase/PWA | Remote monitoring, authenticated temporary commands, farmer guidance |

No cloud component is allowed to become the primary automatic controller.

---

## 4. Physical Hardware Architecture

### 4.1 Controller

- ESP32 DevKitC V4 / ESP32-WROOM-32D-class controller.
- 80×120 mm soldered matrix board.
- LM2596 step-down regulator.
- Sensor connectors.
- Output pulldown resistors.
- Relay and SSR control connectors.
- Calibration button.

### 4.2 Sensors

| Sensor | Measurement | Interface |
|---|---|---|
| SHT30 | Air temperature and relative humidity | I²C |
| BH1750 | Ambient light intensity in lux | I²C |
| Capacitive soil sensor | Relative media-moisture signal | ESP32 ADC |

### 4.3 Switching hardware

| Module | Assignment |
|---|---|
| One 1-channel mechanical relay | Pump |
| Two-channel mechanical relay A | Mist 1 and fan 1 |
| Two-channel mechanical relay B | Mist 2 and fan 2 |
| Two-channel AC SSR | Growlight on channel 1; channel 2 spare |

Both two-channel mechanical modules must be configured for HIGH-trigger operation.

### 4.4 Power supplies

| Supply | Purpose |
|---|---|
| 12 V / 1 A adapter | Logic supply through LM2596 |
| 12 V / 8 A adapter rating | Pump supply |
| 24 V adapter 1 | Mist maker 1 |
| 24 V adapter 2 | Mist maker 2 |
| 24 V adapter 3 | Fan 1 |
| 24 V adapter 4 | Fan 2 |
| AC mains | Growlights through SSR channel 1 |

The 8 A pump-adapter label is its capacity. It is not an assertion that the pump draws 8 A, and it does not determine the final fuse value.

---

## 5. GPIO Architecture

### 5.1 Final proposed mapping

| GPIO | Function | Physical output |
|---:|---|---|
| 16 | Growlight control | SSR channel 1 |
| 25 | Spare SSR control | SSR channel 2, always OFF |
| 17 | Pump control | One-channel relay |
| 18 | Mist maker 1 | Relay module A, channel 1 |
| 19 | Fan 1 | Relay module A, channel 2 |
| 23 | Mist maker 2 | Relay module B, channel 1 |
| 32 | Fan 2 | Relay module B, channel 2 |
| 21 | I²C SDA | SHT30 and BH1750 |
| 22 | I²C SCL | SHT30 and BH1750 |
| 34 | Soil ADC | Capacitive soil sensor |
| 33 | Calibration button | Button to logic GND |
| 35 | Unused in Rev B | No PSU-monitor input |

### 5.2 Output polarity

All seven control outputs use the same meaning:

```text
GPIO LOW  = OFF
GPIO HIGH = ON
```

Install one `10 kΩ` pulldown from each output GPIO to logic GND:

```text
GPIO16 ──10k── GND
GPIO25 ──10k── GND
GPIO17 ──10k── GND
GPIO18 ──10k── GND
GPIO19 ──10k── GND
GPIO23 ──10k── GND
GPIO32 ──10k── GND
```

The pulldowns keep the relay/SSR inputs OFF when the ESP32 is booting, resetting, disconnected, or temporarily high-impedance.

Direct 3.3 V GPIO control remains conditional on the final physical test:

```text
0 V input   = reliably OFF
3.3 V input = reliably ON
No chatter with the 10 kΩ pulldown installed
```

If any exact relay module fails this test, add a verified non-inverting 3.3 V-to-5 V driver for that interface.

---

## 6. Power-Domain Architecture

### 6.1 Logic domain

```text
12 V / 1 A logic adapter
   ↓
Logic fuse, value selected after current measurement
   ↓
LM2596 adjusted to 5.00 V
   ↓
+5V_LOGIC
   ├── ESP32 VIN through removable power jumper
   ├── One-channel relay control/coil supply
   ├── Relay module A control/coil supply
   ├── Relay module B control/coil supply
   └── SSR control supply if required by the exact module
```

Logic ground connects:

```text
LM2596 OUT-
ESP32 GND
Sensor GND
Mechanical relay control-side GND
SSR control-side GND
```

### 6.2 Actuator domains

Each actuator uses its own adapter loop through isolated relay contacts:

```text
Adapter positive
   ↓
Branch fuse
   ↓
Relay COM
   ↓
Relay NO
   ↓
Actuator positive

Actuator negative
   ↓
Same adapter negative
```

Relay `NC` is unused.

The pump, mist, and fan adapter negatives are not deliberately joined to ESP32 logic GND. Their relay contacts are used as isolated dry contacts.

### 6.3 AC growlight domain

The complete SSR module should live in a separate commercial electrical junction box rather than the PLA+ low-voltage controller.

```text
Verified AC Live
   ↓
AC branch fuse
   ↓
SSR channel 1
   ↓
Growlight Live

AC Neutral ─────────→ Growlight Neutral
Protective Earth ───→ Load/Earth where required
```

SSR channel 2 remains disconnected, covered, and commanded OFF.

SSR OFF is not treated as electrical isolation. An accessible disconnect is used before service.

---

## 7. Stabilization and Protection Components

### 7.1 Logic-output stabilization

Required:

- Seven `10 kΩ` GPIO pulldowns.

### 7.2 Logic-rail stabilization

At the LM2596 5 V output:

```text
+5 V ── 470 µF / 25 V electrolytic ── GND
+5 V ── 100 nF ceramic ────────────── GND
```

At ESP32 VIN:

```text
VIN ── 100 nF ceramic ── GND
```

The bulk capacitor supports relay-coil and Wi-Fi current transients. The ceramic capacitors suppress faster electrical noise.

### 7.3 Soil ADC filter

```text
Soil AOUT ──1 kΩ──┬── GPIO34
                  │
                100 nF
                  │
                 GND
```

The filter reduces fast noise from long wiring and relay switching. Its behavior must be compared with unfiltered readings before permanent installation.

### 7.4 I²C pullups

SDA and SCL require pullups to 3.3 V, but many breakout modules already contain them.

Target topology:

```text
SDA ──4.7 kΩ── 3V3
SCL ──4.7 kΩ── 3V3
```

External pullups remain unpopulated until resistance on the final SHT30/BH1750 modules is measured. Do not duplicate strong parallel pullups blindly.

### 7.5 Relay-coil suppression

- Both two-channel relay modules visibly appear to include suppression diodes. Confirm that each diode actually protects a relay coil/driver before relying on it.
- The one-channel pump relay has no visible suppression diode. Trace its driver circuit first.
- If the one-channel relay coil truly has no suppression, install a diode directly across the relay coil:

```text
Diode stripe/cathode → relay coil positive
Diode anode          → switched coil-negative side
```

Do not install a diode blindly across module `VCC` and `GND`.

### 7.6 Pump-load suppression

Relay-coil suppression does not suppress the pump motor.

If the pump is confirmed as a polarity-fixed brushed DC motor, install a suitably rated diode directly across the pump terminals:

```text
Diode stripe/cathode → pump positive
Diode anode          → pump negative
```

The diode rating is selected from measured pump current. Do not install it until pump type and polarity are confirmed.

### 7.7 Fans, mist makers, and SSR

- Do not place generic flyback diodes across brushless fans.
- Do not place generic flyback diodes across ultrasonic mist makers.
- Do not place a flyback diode across an AC SSR output.
- Add load-specific suppression only when the exact device documentation or observed switching problem requires it.

---

## 8. Firmware Architecture

The firmware is divided conceptually into seven responsibilities:

```text
main.cpp
├── boot sequence and scheduler
├── sensor acquisition
├── input validation/freshness
├── local control state machines
├── physical output driver
├── NVS configuration/safety state
└── Firebase synchronization
```

### 8.1 Boot sequence

The first hardware action must establish safe outputs:

```text
Power/reset
   ↓
Write LOW to GPIO16, 25, 17, 18, 19, 23, 32
   ↓
Configure those pins as OUTPUT
   ↓
Keep all physical outputs OFF
   ↓
Load and validate NVS configuration
   ↓
Initialize sensors
   ↓
Wait for valid sensor data
   ↓
Begin local AUTO control
   ↓
Initialize Wi-Fi, time, and Firebase independently
```

No relay or SSR may depend on Wi-Fi, Firebase, or sensor initialization to reach its boot-safe state.

### 8.2 Scheduler priorities

Each loop follows this priority:

1. Enforce physical safety deadlines.
2. Read/update sensors when due.
3. Mark invalid or stale sensors.
4. Run local control state machines.
5. Drive physical outputs.
6. Process bounded cloud work only when it cannot delay an active pump deadline.
7. Publish status and acknowledgements.

The pump must turn OFF from local monotonic timing even when DNS, TLS, HTTP, Wi-Fi, or Firebase is unavailable.

---

## 9. Sensor Validity Logic

A numeric value is not automatically valid. Each sensor has:

- Latest successful value.
- Latest-success timestamp.
- Consecutive failure count.
- Physical plausibility checks.
- Maximum age.

### 9.1 SHT30

Valid when:

- I²C transaction succeeds.
- Temperature/RH are physically plausible.
- Reading is newer than the configured stale limit.

Invalid/stale effect:

```text
Humidifier OFF immediately.
Manual humidifier request rejected or cancelled.
```

### 9.2 BH1750

Valid when:

- I²C transaction succeeds.
- Reading is plausible.
- Reading is fresh.

Invalid/stale effect:

```text
Growlight OFF.
Manual growlight request cannot bypass this hard safety.
```

### 9.3 Soil sensor

Valid when:

- Dry and wet calibration exist and are structurally valid.
- ADC is not pinned at an extreme.
- Reading is fresh.
- Reading remains within a plausible calibrated/electrical range.

Invalid or uncalibrated effect:

```text
Pump OFF.
Manual watering pulse rejected.
```

Calibration values are measured in the actual greenhouse substrate. Production firmware must not write demo values such as `1700/3500` during normal boot.

---

## 10. Pump Control Logic

### 10.1 Parameters

```text
Start threshold:       soil <= 30%
Satisfied threshold:   soil >= 60%
Pulse duration:        10 seconds
Soak duration:         10 minutes
Maximum starts:        2
Safety window:         rolling 5 hours
```

### 10.2 AUTO state machine

```text
IDLE
 │
 ├── soil invalid ─────────────→ LOCKED_OFF
 │
 ├── soil >30% ────────────────→ remain IDLE
 │
 └── soil <=30%
       │
       ├── start budget blocked → BUDGET_LOCKED
       │
       └── budget available
             ↓
       persist start reservation
             ↓
           PULSE_ON
             │  pump ON for 10 s maximum
             ↓
           SOAK_OFF
             │  pump OFF for 10 min minimum
             ↓
       read valid soil again
             │
             ├── soil >=60% ───→ IDLE/SATISFIED
             ├── budget empty ─→ BUDGET_LOCKED
             └── still <=30% ──→ next permitted pulse
```

### 10.3 Five-hour budget

Every pump start, whether AUTO or manual, consumes one of two starts in the same rolling five-hour window.

The start reservation is stored before energizing the pump. A reboot must not restore the full budget.

Minimum practical policy:

- Persist pump-start history in NVS.
- If history or trustworthy time is unavailable after reboot, keep the pump locked until time synchronizes and the saved history can be evaluated safely.
- Invalid/corrupt pump history fails OFF.

With at most a few writes per day, this safety record is not a meaningful flash-wear problem.

### 10.4 Manual pump command

The farmer cannot hold the pump ON.

```text
Manual “Siram” request
   ↓
Validate command and soil sensor
   ↓
Check soak and five-hour budget
   ↓
Run one normal 10-second pulse
   ↓
Return to AUTO
```

### 10.5 Physical tuning

Before unattended operation, measure how much water one 10-second pulse delivers under the real hose/head conditions. Reduce pulse duration if the delivered volume is excessive.

---

## 11. Humidifier Control Logic

The humidifier is one logical system with four physical outputs:

```text
Mist 1
Fan 1
Mist 2
Fan 2
```

### 11.1 Parameters

Existing approved RH thresholds:

```text
RH low:  65%
RH high: 85%
```

These remain configurable within safe validation bounds.

### 11.2 AUTO state machine

```text
SHT30 invalid/stale
   ↓
All four outputs OFF

RH <=65%
   ↓
All four outputs ON

65% < RH < 85%
   ↓
Hold previous combined state

RH >=85%
   ↓
All four outputs OFF
```

Temperature is displayed to the farmer but does not control these fans. The current fans only distribute humidified air; they are not treated as a cooling or dehumidification system.

### 11.3 Physical fanout

Firmware retains four GPIOs for easy channel testing:

```text
GPIO18 → Mist 1
GPIO19 → Fan 1
GPIO23 → Mist 2
GPIO32 → Fan 2
```

One logical humidifier command writes all four outputs together.

Every safety shutdown unconditionally writes all four GPIOs LOW, even if cached software state already says OFF.

### 11.4 Manual control

```text
Manual humidifier ON/OFF
   ↓
Apply to all four outputs
   ↓
Maximum duration 30 minutes
   ↓
Expiry returns combined system to AUTO
```

Invalid/stale SHT30 cancels or rejects manual humidifier operation.

---

## 12. Growlight Control Logic

### 12.1 Parameters

```text
Lux ON threshold:   <=2,000 lux
Lux OFF threshold:  >=5,000 lux
AUTO time window:   06:00–18:00 Asia/Jakarta
```

### 12.2 AUTO state machine

```text
BH1750 invalid/stale OR time invalid
   ↓
Growlight OFF

Outside 06:00–18:00
   ↓
Growlight OFF

Inside time window:
   lux <=2,000  → ON
   lux >=5,000  → OFF
   between      → hold previous state
```

Time must be valid. Unsynchronized time fails OFF rather than guessing daytime.

### 12.3 Manual control

Manual growlight control lasts no longer than 30 minutes and then returns to AUTO.

Manual mode does not override:

- Invalid/stale BH1750.
- Invalid time.
- Electrical hard-off conditions.

### 12.4 Spare SSR

GPIO25 and SSR channel 2 remain LOW/OFF for the full runtime. No command or configuration may activate the spare channel.

---

## 13. Command Priority

The decision order for every logical system is:

```text
1. Boot and physical hard-OFF
2. Invalid hardware/configuration safety OFF
3. Invalid/stale related sensor OFF
4. Pump timing/budget and other local safety limits
5. Valid temporary manual command
6. Local AUTO state machine
7. Default OFF
```

Manual commands have higher priority than AUTO preferences but lower priority than safety.

---

## 14. Firebase Architecture

### 14.1 Identities

- One farmer Firebase Authentication email/password account.
- One separate ESP32 device account.
- No anonymous/public Firestore access.

### 14.2 Least-privilege behavior

Farmer account:

- Reads status and telemetry for `snowberry-001`.
- Writes commands and permitted configuration for `snowberry-001`.
- Cannot write device status.

Device account:

- Writes status and telemetry for `snowberry-001`.
- Reads commands and configuration for `snowberry-001`.
- Cannot issue farmer commands or change ownership.

### 14.3 Paths

```text
devices/snowberry-001/status/realtime
devices/snowberry-001/config/thresholds
devices/snowberry-001/config/commands
devices/snowberry-001/telemetry/{YYYY-MM-DD}
```

### 14.4 Command structure

A command includes:

- Unique command ID.
- Device ID/path context.
- Logical system.
- Mode or safe pulse type.
- Desired state where relevant.
- Issued time.
- Expiry/duration.
- Issuing farmer identity.

The ESP32 strictly rejects:

- Unknown logical systems.
- Unknown modes.
- Missing or wrong-typed fields.
- Expired commands.
- Commands for another device.
- Duplicate command IDs.
- Unsafe pump requests.

The last processed command ID is persisted before or atomically with actuation so a reboot does not replay an old command.

### 14.5 Token lifecycle

The ESP32:

1. Authenticates as the device account.
2. Stores tokens only in local ignored configuration/NVS.
3. Adds its token to Firestore REST requests.
4. Refreshes before expiry.
5. Continues local AUTO during authentication or network failure.

---

## 15. Status Model

The PWA reports what the system actually knows.

### Known directly

- Sensor values and validity.
- ESP32 connectivity and last update.
- Commanded GPIO/logical state.
- AUTO or temporary manual mode.
- Reason for the command state.
- Command acknowledgement.
- Local fault state.

### Not directly known

Without feedback sensors, the system cannot prove:

- Relay contacts physically moved.
- Adapter is delivering power.
- Pump moved water.
- Fan rotated.
- Mist was produced.
- Growlight illuminated.

Therefore, UI state means **commanded ON/OFF**, not physically verified operation.

Farmer fault guidance uses honest language such as:

```text
“Periksa adaptor, kabel, dan alat.”
```

It does not falsely diagnose a relay or actuator.

---

## 16. Farmer PWA Architecture

### 16.1 Required screens/functions

The final deadline focuses on:

1. Live sensor readings.
2. Automatic actuator states and reasons.
3. Temporary manual control.

Deferred features include extensive history, notifications, MQTT, DLI, pairing, and multi-user administration.

### 16.2 Farmer-facing systems

The PWA exposes only:

```text
Pompa Air
Pelembap Udara
Lampu Tanam
```

It does not show four independent humidifier controls.

### 16.3 Connection behavior

When authenticated Firebase communication is healthy:

- Live status updates.
- Controls are available.
- Command acknowledgement is displayed.

When unavailable:

- Last-known sensor values may remain visible as stale.
- Controls are disabled.
- A clear connection warning appears.
- ESP32 local AUTO continues independently.

---

## 17. Physical Packaging Architecture

### 17.1 PLA+ low-voltage controller enclosure

Contains:

- 80×120 mm matrix board on spacers.
- ESP32.
- LM2596 and logic capacitors.
- Mechanical relay modules on a relay tray.
- Low-voltage control and actuator contact wiring.
- Sensor and actuator connectors.

Design requirements:

- Screw-fastened lid.
- Downward cable entries.
- Strain relief.
- Drip loops outside the enclosure.
- ESP32 antenna against a plastic wall with clear space.
- Accessible fuses and terminal screws.
- No six adapters packed inside.
- Protected from direct sun and direct mist.

### 17.2 Separate AC junction box

Contains:

- Complete two-channel SSR module.
- AC fuse and terminals.
- Live/Neutral/Earth routing.
- Touch-safe covers and cable restraint.

Only low-voltage control wires run between the PLA+ controller and SSR box:

```text
+5V_LOGIC, if the exact SSR module requires it
LOGIC_GND
GPIO16 growlight command
GPIO25 spare command
```

### 17.3 Adapter box

A separate covered, ventilated, dry box holds:

- Six adapters.
- Power distribution strip.

It requires:

- Downward cable exits.
- Air space around adapters.
- No direct drip path.
- Strain relief.
- Independent access from the ESP32 box.

### 17.4 Greenhouse mounting

- One rigid backplate spans two bamboo members.
- Controller, adapter box, and AC box mount securely to the backplate.
- Wide straps/clamps accommodate irregular bamboo.
- Boxes cannot rotate or slide.
- Sensor and actuator cables are labeled at both ends.

---

## 18. Failure Behavior

| Failure | Required response |
|---|---|
| ESP32 logic power loss | Hardware pulldowns and normally-open contacts leave outputs OFF |
| ESP32 reset | All seven outputs LOW immediately |
| Wi-Fi loss | Local AUTO continues; remote status becomes stale |
| Firebase/auth failure | Local AUTO continues; remote control unavailable |
| SHT30 invalid/stale | Four humidifier outputs OFF |
| BH1750 invalid/stale | Growlight OFF |
| Soil invalid/uncalibrated | Pump OFF; manual pulse rejected |
| NVS configuration invalid | Pump OFF; validated safe defaults only where appropriate |
| Manual command expires | Return logical system to AUTO |
| Duplicate cloud command | No second actuation |
| Pump history unavailable | Pump remains locked until history/time is safely resolved |
| One actuator adapter fails | No automatic diagnosis; related commanded state may remain ON but UI tells farmer to inspect hardware |
| Relay/SSR hardware fails | Not detectable without feedback; physical fuses, isolation, and limited pump consequence reduce risk |

---

## 19. Build and Validation Sequence

### Phase 1 — Firmware-safe outputs

- Implement Rev B GPIO map.
- Implement seven active-HIGH physical outputs.
- Verify LOW-before-OUTPUT boot sequence.
- Create Rev B actuator-test firmware.

### Phase 2 — Breadboard control-side testing

For every mechanical relay and both SSR inputs:

- 0 V=OFF.
- 3.3 V=ON.
- Test with `10 kΩ` pulldown installed.
- No chatter.
- Correct COM/NO behavior.
- OFF with ESP32 disconnected.
- 100 transitions.
- 20 boot/reset cycles.

### Phase 3 — Sensor and state-machine testing

- SHT30/BH1750 I²C validation.
- Soil ADC/filter comparison.
- Production substrate calibration.
- Pump 10-second pulse and 10-minute soak.
- Two-start/five-hour budget and reboot persistence.
- Combined humidifier RH truth table.
- Growlight time/lux truth table.

### Phase 4 — Actual DC loads

Connect one at a time:

1. Fan 1.
2. Fan 2.
3. Mist 1.
4. Mist 2.
5. Pump.
6. All four humidifier outputs together.

Measure pump water volume from one 10-second pulse.

### Phase 5 — Matrix board

- Transfer only the validated breadboard circuit.
- Inspect both sides.
- Continuity-test before power.
- Repeat boot and channel tests after soldering.

### Phase 6 — Firebase/PWA

- Implement farmer and device authentication.
- Deploy restrictive Firestore rules.
- Test token refresh.
- Test strict commands, expiry, acknowledgement, and duplicate rejection.

### Phase 7 — Enclosures and soak

- Install low-voltage controller, separate AC box, and adapter box.
- Run a minimum six-hour integrated soak.
- Test router loss, sensor faults, reboot, manual expiry, and pump limits.

### Phase 8 — Greenhouse deployment

1. Mount all boxes and route cables.
2. Start in monitor-only mode.
3. Calibrate soil sensor in the real substrate.
4. Verify remote readings from mobile data.
5. Enable combined humidifier.
6. Enable growlight.
7. Enable pump last.
8. Observe one complete pump pulse and soak.

---

## 20. Deployment Gates

| Gate | Required evidence |
|---|---|
| Breadboard | Correct polarity, pulldowns, no chatter, safe boot |
| Matrix board | Breadboard passed; continuity, rails, and repeated boot tests pass |
| Low-voltage loads | Individual and combined load tests pass without reset/noise failure |
| AC growlight | SSR in separate electrical box; correct terminals and protection verified |
| Firebase | No public access; farmer/device auth, token refresh, and replay prevention pass |
| Monitor-only field mode | Sensors, network, enclosure, and PWA work at greenhouse |
| Unattended AUTO | Pump safeguards, sensor fail-safes, reboot safety, and soak test pass |

If pump safety, boot-safe outputs, or secure Firebase fails, the unit remains monitor-only.

---

## 21. Explicit Non-Goals for Rev B

Rev B does not include:

- MQTT migration.
- Custom fabricated PCB.
- PID control.
- Temperature cooling.
- DLI integration.
- Independent farmer controls for four humidifier outputs.
- Per-adapter voltage monitoring.
- Relay-contact feedback.
- Pump flow sensor.
- Fan tachometer.
- Mist-output detector.
- Growlight-current feedback.
- Comprehensive automatic hardware-failure diagnosis.

These are deferred until field data demonstrates a real need.

---

## 22. Final Architecture Summary

```text
                         ┌───────────────────────────────┐
                         │ Hosted farmer PWA             │
                         │ - live readings               │
                         │ - commanded states/reasons    │
                         │ - temporary manual controls   │
                         └──────────────┬────────────────┘
                                        │ authenticated Firebase
                                        ▼
┌───────────────────────────────────────────────────────────────────┐
│ ESP32 LOCAL-FIRST CONTROLLER                                      │
│                                                                   │
│ SHT30 ──┐                                                         │
│ BH1750 ─┼─→ validate/freshness → local state machines → safety    │
│ Soil ───┘                                      │                  │
│                                                 ▼                  │
│                              GPIO17 pump                           │
│                              GPIO18 mist 1                         │
│                              GPIO19 fan 1                          │
│                              GPIO23 mist 2                         │
│                              GPIO32 fan 2                          │
│                              GPIO16 growlight                      │
│                              GPIO25 spare OFF                      │
└───────────────────────────────┬───────────────────────────────────┘
                                │ active-HIGH control
               ┌────────────────┴─────────────────┐
               ▼                                  ▼
┌──────────────────────────┐        ┌────────────────────────────┐
│ Mechanical relay tray    │        │ Separate AC SSR box        │
│ Pump + 2 mist + 2 fan    │        │ Growlight + spare channel  │
└─────────────┬────────────┘        └─────────────┬──────────────┘
              │ isolated COM/NO loops                           │ AC
              ▼                                                  ▼
┌──────────────────────────┐                       ┌────────────────┐
│ Dedicated DC adapters    │                       │ Growlights     │
│ and DC actuators         │                       │ <100 W total   │
└──────────────────────────┘                       └────────────────┘
```

The architecture stays intentionally simple:

- Local bang-bang control with hysteresis.
- Independent actuator power supplies.
- Safe active-HIGH outputs with hardware pulldowns.
- Sensor-failure OFF behavior.
- Time-limited manual control.
- Secure cloud monitoring without cloud authority over safety.
- Honest commanded-state reporting.

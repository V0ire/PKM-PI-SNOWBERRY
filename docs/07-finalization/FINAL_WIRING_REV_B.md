# Snowberry Final Wiring — Rev B Audit Candidate

**Status:** `AUDIT CANDIDATE — NOT YET AS-BUILT`  
**Revision:** B0  
**Target:** ESP32 DevKitC V4, 80×120 mm matrix board, one 1-channel relay module, two 2-channel relay modules, and one 2-channel AC SSR module  
**Supersedes for Rev B:** actuator count, GPIO assignment, polarity, adapter topology, and GPIO35 claims in `docs/03-technical/wiring-schematic.md` and `docs/05-hardware/*`

This document becomes `AS-BUILT` only after every item marked `VERIFY PHYSICALLY` is completed and recorded in `PHYSICAL_VERIFICATION_RECORD.md`.

## 1. Evidence Vocabulary

- **DECIDED:** accepted project requirement.
- **OBSERVED:** reported bench behavior, still repeat before soldering.
- **PROPOSED:** engineering choice awaiting independent audit.
- **VERIFY PHYSICALLY:** cannot be established from repository text.
- **TBD:** do not wire or energize until resolved.

## 2. System Boundary

### 2.1 Logical systems

| Logical system | Physical outputs | Control rule |
|---|---|---|
| Pump | One mechanical relay | Moisture-triggered pulse/soak |
| Humidifier | Mist 1 + fan 1 + mist 2 + fan 2 on four mechanical relays | All four outputs switch together from RH only |
| Growlight | SSR channel 1 | Lux hysteresis, 06:00–18:00 local window |
| Spare | SSR channel 2 | Always OFF; no load and no UI control |

### 2.2 Required output polarity

**DECIDED:** all seven ESP32 outputs use the same firmware meaning:

```text
GPIO LOW  = output OFF
GPIO HIGH = output ON
```

**OBSERVED/owner-confirmed:** the final mechanical relay inputs switch cleanly from ESP32 3.3 V and are active-HIGH. Both selectable two-channel modules must have both channels set to HIGH-trigger mode.

**VERIFY PHYSICALLY:** repeat `0 V=OFF`, `3.3 V=ON` on every final channel before connecting COM/NO/NC.

## 3. Rev B GPIO Map

| GPIO | Net | Destination | Hardware default | Status |
|---:|---|---|---|---|
| 16 | `CTRL_GROWLIGHT` | SSR `IN1` | 10 kΩ pulldown | PROPOSED |
| 25 | `CTRL_SSR_SPARE` | SSR `IN2` | 10 kΩ pulldown; firmware always LOW | PROPOSED |
| 17 | `CTRL_PUMP` | Fixed active-HIGH relay `IN` | 10 kΩ pulldown | PROPOSED |
| 18 | `CTRL_MIST_1` | Two-channel relay module A `IN1` | 10 kΩ pulldown | PROPOSED |
| 19 | `CTRL_FAN_1` | Two-channel relay module A `IN2` | 10 kΩ pulldown | PROPOSED |
| 23 | `CTRL_MIST_2` | Two-channel relay module B `IN1` | 10 kΩ pulldown | PROPOSED |
| 32 | `CTRL_FAN_2` | Two-channel relay module B `IN2` | 10 kΩ pulldown | PROPOSED |
| 21 | `I2C_SDA` | SHT30 SDA + BH1750 SDA | I²C pullup | DECIDED |
| 22 | `I2C_SCL` | SHT30 SCL + BH1750 SCL | I²C pullup | DECIDED |
| 34 | `SOIL_ADC` | Soil sensor AOUT | input only | DECIDED |
| 33 | `CAL_BUTTON` | Normally-open button to logic GND | `INPUT_PULLUP` | PROPOSED |
| 35 | `UNUSED_REV_B` | no connection | input only | DECIDED |

### 3.1 Pin exclusions

Do not use these for Rev B actuators:

- GPIO 6–11: internal flash.
- GPIO 1/3: UART programming/logging.
- GPIO 0, 2, 4, 5, 12, 15: boot-strapping or boot-behavior risk.
- GPIO 34–39: input-only; GPIO34 remains the soil ADC.

**Correction:** Rev A used GPIO4 for calibration. Rev B proposes GPIO33 because GPIO4 is a strapping pin and a held button during reset can affect boot.

### 3.2 Output pulldowns

Install one `10 kΩ` resistor from each output pin to `LOGIC_GND`:

```text
GPIO16, GPIO25, GPIO17, GPIO18, GPIO19, GPIO23, GPIO32
    each -> 10 kΩ -> LOGIC_GND
```

Before soldering all seven pulldowns, verify one relay and one SSR input still reach their guaranteed HIGH threshold with the pulldown installed.

## 4. Power Domains

### 4.1 Declared supplies

The following are adapter labels/ratings supplied by the owner. They are not measured load currents.

| ID | Adapter label/context | Intended load |
|---|---|---|
| `ADP_LOGIC` | 12 V, 1 A | LM2596 → 5 V logic |
| `ADP_PUMP` | 12 V, 8 A adapter rating | pump |
| `ADP_M1` | 24 V, 650 mA | mist maker 1 |
| `ADP_M2` | 24 V, 650 mA | mist maker 2 |
| `ADP_F1` | 24 V, 1 A | fan 1 |
| `ADP_F2` | 24 V, 1 A | fan 2 |
| `AC_IN` | mains | growlights, measured below 100 W total |

**VERIFY PHYSICALLY:** polarity, connector pinout, actual output under load, actuator label, and actuator running/start current.

### 4.2 Logic ground

Join only these low-voltage control nodes:

```text
LM2596 OUT-
ESP32 GND
SHT30 GND
BH1750 GND
soil sensor GND
mechanical relay control-side GND
SSR control-side GND
```

### 4.3 Isolated actuator loops

Do not join the five actuator-adapter negatives to `LOGIC_GND` merely for control. Each dry-contact loop remains isolated:

```text
adapter + -> fuse -> relay COM -> relay NO -> actuator +
actuator - -> same adapter -
relay NC -> unconnected
```

**VERIFY PHYSICALLY:** relay modules must provide genuinely isolated dry COM/NO/NC contacts. If a module internally ties contact power to control ground, stop and redesign.

Never connect DC ground to AC Neutral. Protective Earth follows the load/enclosure requirement and is not logic GND.

## 5. Logic Supply

### 5.1 Input and conversion

```text
ADP_LOGIC + -> F_LOGIC -> LM2596 IN+
ADP_LOGIC - -----------> LM2596 IN-
LM2596 OUT+ = +5V_LOGIC
LM2596 OUT- = LOGIC_GND
```

`F_LOGIC` is **TBD** pending all-relays-on current measurement and wire/connector rating. The adapter’s 1 A label is an upper supply limit, not an automatic fuse selection.

Before connecting loads:

1. Identify barrel-jack center, sleeve, and switched pin with a meter.
2. Power LM2596 alone.
3. Adjust output to `5.00 V`.
4. Accept only `4.8–5.1 V` under the tested control-side load.
5. Record all-relays-on current and 5 V minimum voltage.

### 5.2 5 V distribution

Connect `+5V_LOGIC` to:

- ESP32 `VIN/5V` through removable `JP_ESP_PWR`.
- Fixed pump relay control/coil supply according to its printed header.
- Two-channel relay modules A and B control/coil supplies according to their printed headers.
- SSR control VCC only if required by the exact module.

Connect all matching control grounds to `LOGIC_GND`.

If either two-channel relay has separate `JD-VCC` and `VCC`, its exact jumper/supply arrangement is **TBD** until the module schematic or physical labels are recorded. Do not guess.

### 5.3 Decoupling

At LM2596 output:

```text
470 µF / 25 V electrolytic: + to +5V_LOGIC, - to LOGIC_GND
100 nF ceramic:             across +5V_LOGIC and LOGIC_GND
```

At ESP32 VIN: `100 nF` between VIN and GND close to the header.

Add local `100 nF` at a relay/SSR control connector only where the module wiring is long and the module does not already provide suitable local decoupling.

### 5.4 USB/external power isolation

```text
+5V_LOGIC -> JP_ESP_PWR -> ESP32 VIN/5V
```

- Standalone: jumper installed.
- USB-only programming: jumper removed.

Do not assume USB 5 V and external 5 V can be tied safely on every DevKit clone.

## 6. Sensor Wiring

### 6.1 SHT30

| Pin | Rev B connection |
|---|---|
| VCC | ESP32 3V3 |
| GND | LOGIC_GND |
| SDA | GPIO21 |
| SCL | GPIO22 |

### 6.2 BH1750

| Pin | Rev B connection |
|---|---|
| VCC | ESP32 3V3 |
| GND | LOGIC_GND |
| SDA | GPIO21 |
| SCL | GPIO22 |
| ADDR | module default/GND for `0x23`, verify exact board |

### 6.3 I²C pullups

Target one effective pullup per bus line to 3.3 V:

```text
SDA -> 4.7 kΩ -> 3V3
SCL -> 4.7 kΩ -> 3V3
```

Mark external matrix-board pullups `DNP` until powered-off resistance on both sensor modules is measured. Many breakout boards already include pullups; parallel pullups may become too strong.

### 6.4 Soil sensor

```text
soil VCC  -> 3V3
soil GND  -> LOGIC_GND
soil AOUT -> 1 kΩ -> GPIO34
GPIO34 node -> 100 nF -> LOGIC_GND
```

The `1 kΩ + 100 nF` filter is **PROPOSED**. Verify settling and stability against direct readings before making it permanent.

Never connect AOUT before measuring its maximum voltage while powered at 3.3 V. Calibrate in the actual substrate; do not immerse the electronics section of the probe.

### 6.5 Calibration button

```text
GPIO33 -> normally-open button -> LOGIC_GND
```

Firmware uses `INPUT_PULLUP`: released HIGH, pressed LOW. Hardware debounce capacitor is optional; start with software debounce unless measured bounce causes a problem.

## 7. Mechanical Relay Control Wiring

### 7.1 Fixed pump relay

```text
relay control VCC -> +5V_LOGIC
relay control GND -> LOGIC_GND
relay IN          -> GPIO17
GPIO17            -> 10 kΩ -> LOGIC_GND
```

### 7.2 Two two-channel humidifier relay modules

Set both channels on both modules to HIGH-trigger mode.

```text
MODULE A control/coil supply -> exact verified 5 V header arrangement
MODULE A control GND         -> LOGIC_GND
MODULE A IN1 <- GPIO18 = mist 1
MODULE A IN2 <- GPIO19 = fan 1

MODULE B control/coil supply -> exact verified 5 V header arrangement
MODULE B control GND         -> LOGIC_GND
MODULE B IN1 <- GPIO23 = mist 2
MODULE B IN2 <- GPIO32 = fan 2
```

**VERIFY PHYSICALLY for each channel:**

```text
0 V input   -> relay OFF -> COM-NC continuity
3.3 V input -> relay ON  -> COM-NO continuity
```

No external level shifter is specified because clean 3.3 V activation was owner-confirmed. If any final channel chatters, fails to meet input thresholds, or changes behavior with the 10 kΩ pulldown, stop. Add a verified non-inverting level driver rather than relying on marginal operation.

## 8. SSR Control Wiring

```text
SSR control VCC -> +5V_LOGIC only if required by exact module
SSR control GND -> LOGIC_GND
SSR IN1         -> GPIO16
SSR IN2         -> GPIO25
GPIO16, GPIO25  -> separate 10 kΩ pulldowns -> LOGIC_GND
```

- Channel 1: growlight.
- Channel 2: no load, terminals covered, firmware always LOW.

Do not add a series resistor until the exact SSR-module input circuit is identified. A generic resistor can make 3.3 V triggering marginal.

**VERIFY PHYSICALLY:** input header order, VCC requirement, 0/3.3 V behavior, AC terminal pairing, module part number, and heat/derating at the actual growlight load.

## 9. DC Contact Wiring

### 9.1 General rule

For every DC load:

```text
adapter + -> correctly selected branch fuse -> relay COM
relay NO  -> actuator +
actuator - -> same adapter -
relay NC  -> no connection
```

Switch the positive conductor. Keep the adapter negative and actuator negative as a direct paired return.

### 9.2 Channel assignment

| Relay | Adapter | Contact path | Load |
|---|---|---|---|
| Pump | `ADP_PUMP` | fuse → COM; NO → load + | pump |
| Module A channel 1 | `ADP_M1` | fuse → COM1; NO1 → load + | mist 1 |
| Module A channel 2 | `ADP_F1` | fuse → COM2; NO2 → load + | fan 1 |
| Module B channel 1 | `ADP_M2` | fuse → COM1; NO1 → load + | mist 2 |
| Module B channel 2 | `ADP_F2` | fuse → COM2; NO2 → load + | fan 2 |

### 9.3 Fuse status

Final fuse values are **TBD**. Select them from:

1. Measured normal and startup current.
2. Load manufacturer rating.
3. Relay DC-contact rating for that load type.
4. Connector rating.
5. Cable ampacity and run length.
6. Adapter short-circuit capability.

Adapter labels alone are insufficient.

### 9.4 Suppression status

- Two two-channel relay modules: owner reports visible suppression diode(s). Verify each diode is actually across its relay coil/driver circuit and record marking/orientation. Do not add duplicate coil diodes if confirmed.
- One-channel pump relay module: no suppression diode is visibly identified. Do not place a diode blindly across module VCC/GND. Trace the coil-driver circuit first; if the coil truly lacks suppression, add a diode directly across the relay coil with stripe/cathode to coil positive and anode to the switched coil-negative side.
- Pump load flyback diode: separate from relay-coil suppression. Install only after confirming a brushed DC motor and its polarity. If used, place across the pump terminals, cathode/stripe to positive and anode to negative. Device rating remains **TBD** from measured current.
- Brushless 24 V fans: do not add a generic diode without manufacturer guidance.
- Ultrasonic mist makers: do not add a generic flyback diode.
- AC SSR: no flyback diode is used on its AC output. The SSR is not a DC relay coil; AC-side protection is selected from the exact SSR and growlight load.

## 10. AC Growlight Wiring

**Audit-critical section.** Exact SSR module and terminal labels must be attached to the review packet before implementation.

Conceptual channel-1 topology:

```text
AC Live -> correctly selected AC fuse -> SSR channel 1 terminal A
SSR channel 1 terminal B -> growlight Live
AC Neutral ----------------------------> growlight Neutral
Protective Earth ----------------------> load/enclosure Earth where required
```

Requirements:

- Switch Live, not Neutral.
- Growlight total measured below 100 W, but exact current/load type remains to be recorded.
- Fuse value is TBD from actual current, cable, connector, and SSR rating.
- Use mains-rated cable and insulated terminals.
- No AC on the solderless breadboard or 80×120 mm logic matrix board.
- SSR AC area requires a physical cover/partition and downward cable entry.
- SSR channel 2 remains unloaded and covered.
- PLA+ enclosure is a prototype environmental shell, not a certified flame-rated mains enclosure. Independent auditor must explicitly evaluate whether the AC section should move to a separate rated box.

## 11. Matrix Board Boundary

The 80×120 mm matrix board contains:

- ESP32 socket/header.
- LM2596 and logic input.
- 5 V/3.3 V logic distribution.
- Output pulldowns.
- Sensor connectors and proposed soil filter.
- Relay/SSR control connectors.
- Test points.

It does not carry:

- Pump/fan/mist load current.
- Five actuator adapter positives or negatives beyond low-current connector metadata, if any.
- AC Live/Neutral/Earth.

Use point-to-point rated wire and terminal hardware on the relay tray for load current.

## 12. Suggested Connector Map

### Matrix board

| ID | Label | Pins |
|---|---|---|
| J1 | `12V LOGIC IN` | `+12V`, `0V` |
| J2 | `SHT30` | `3V3`, `GND`, `SDA`, `SCL` |
| J3 | `BH1750` | `3V3`, `GND`, `SDA`, `SCL` |
| J4 | `SOIL` | `3V3`, `GND`, `AOUT` |
| J5 | `RELAY CTRL` | `5V`, `GND`, `PUMP`, `M1`, `F1`, `M2`, `F2` |
| J6 | `SSR CTRL` | `5V?`, `GND`, `GL`, `SPARE` |
| JP1 | `ESP POWER` | external 5 V isolation jumper |

### Relay/SSR tray

Provide separately labeled adapter input and load output connectors for pump, mist 1, fan 1, mist 2, and fan 2. Mark polarity on both connector and enclosure.

## 13. Firmware/Hardware Synchronization Blocker

Current firmware is not compatible with Rev B. It still has:

- Four logical/physical channels only.
- Active-LOW mechanical relay polarity.
- One mist and one fan output.
- GPIO4 calibration button.
- GPIO35 PSU-fault assumptions.
- Old pump thresholds/timing and demo soil values.

Do not connect final active-HIGH relay inputs until `HARDWARE_FIRMWARE_CONTRACT.md` is implemented and its boot tests pass.

## 14. Required Physical Evidence Before `AS-BUILT`

1. Front/back photos of the fixed one-channel relay, both two-channel relay modules, and the two-channel SSR.
2. Readable header and contact labels.
3. Relay part-number, DC-contact rating, and visible coil-suppression-diode photos/markings.
4. Trigger-selector orientation photo.
5. 0 V and 3.3 V behavior for all five channels.
6. SSR input behavior for both channels.
7. Barrel-jack polarity for all six adapters.
8. Actual actuator labels and measured normal/start currents.
9. Selected fuse and wire rationale per branch.
10. Pump motor type and suppression choice.
11. Growlight cable/plug/Earth arrangement and SSR heat test.
12. Twenty boot/reset cycles with no output activation.
13. Matrix-board continuity and rail measurements.

Until these exist, this document is an audit design—not permission to energize the complete system.

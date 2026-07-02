# Snowberry Smart Greenhouse — Wiring & Pinout Schematic

**Document Status:** Production-Ready — all values verified against datasheets and design.md  
**Hardware Revision:** Rev A (Breadboard Prototype)  
**MCU:** ESP32 DevKitC V4 (WROOM-32D), 38-pin  
**Date:** 2026-07-02  
**Related Documents:** [design (1).md](file:///home/caradhina/Project/PKM/Perencanaan/design%20(1).md), [pinout_mapping.md](file:///home/caradhina/Project/PKM/Perencanaan/pinout_mapping.md), [analysis_pemilihan_komponen.md](file:///home/caradhina/Project/PKM/Perencanaan/analysis_pemilihan_komponen.md)

---

## Section A: GPIO Pin Assignment

### A.1 — Master Pin Assignment Table

| GPIO | Function | Component | Direction | Logic Level | Signal Type | Justification |
|------|----------|-----------|-----------|-------------|-------------|---------------|
| **21** | I2C SDA | SHT30-D + BH1750FVI | Bidirectional | 3.3V | Digital (I2C) | Default hardware I2C SDA on ESP32. Shared bus, both sensors on same SDA line. No conflict with any strapping or flash pin. |
| **22** | I2C SCL | SHT30-D + BH1750FVI | Bidirectional | 3.3V | Digital (I2C) | Default hardware I2C SCL on ESP32. Shared bus, both sensors on same SCL line. No conflict with any strapping or flash pin. |
| **34** | Soil Moisture Analog | Capacitive Soil Moisture V2.0 | Input Only | 0–3.3V | Analog (ADC1_CH6) | **ADC1 channel — mandatory.** ADC2 is completely disabled when WiFi is active. GPIO 34 is input-only (no internal pull-up/down), which eliminates any risk of accidental output drive corrupting the analog reading. |
| **35** | Voltage Divider Monitor | 30kΩ+10kΩ divider on 12V rail | Input Only | 0–3.0V | Analog (ADC1_CH7) | ADC1 channel, input-only. Dedicated rail health monitoring. See Section C.4 for divider correction details. |
| **16** | SSR Channel 1 — Growlight | SSR G3MB-202P 2ch, IN1 pin | Output | 3.3V | Digital | **Active HIGH** — GPIO HIGH = SSR ON = growlight ON. No strapping function. At boot, ESP32 GPIOs default to input/floating, which cannot source current into the SSR optocoupler — SSR remains OFF until firmware explicitly drives HIGH. Safe. |
| **17** | Relay 2ch Channel 1 — Pump | Relay Hi-Lo Opto 2ch, IN1 pin | Output | 3.3V | Digital | **Active LOW** — GPIO LOW = relay ON = pump ON. No strapping function. At boot, GPIO is floating/high-impedance. Relay module has an onboard pull-up resistor on IN1 to VCC, so a floating input reads as HIGH = relay OFF. Safe. |
| **18** | Relay 2ch Channel 2 — Mist Disc | Relay Hi-Lo Opto 2ch, IN2 pin | Output | 3.3V | Digital | **Active LOW** — GPIO LOW = relay ON = mist disc ON. No strapping function. Same pull-up safety as GPIO 17. Mist disc is on the 24V rail (separate adapter). |
| **19** | Relay 1ch — Humidifier Fan | Relay Hi-Lo Opto 1ch, IN pin | Output | 3.3V | Digital | **Active LOW** — GPIO LOW = relay ON = fan ON. No strapping function. Dedicated single-channel relay module for the 12V fan, keeping it independent from the 2ch module (fan and mist disc are on different voltage rails and must not share a channel). |
| **4** | Tactile Button | Momentary push-button (normally open) | Input | 3.3V | Digital | General-purpose GPIO, no strapping conflict. Used for soil calibration trigger and WiFi credential reset (long-press). Internal pull-up enabled in firmware (`INPUT_PULLUP`), button press connects pin to GND = reads LOW. External 100nF ceramic cap across button terminals for hardware debounce. |
| **23** | Reserved / Expansion | — | — | — | — | Clean GPIO with no strapping function, no flash conflict, full output/input capability. Reserved for future use: second soil sensor, buzzer, status LED, or additional relay channel. |
| **25** | SSR Channel 2 — Spare | SSR G3MB-202P 2ch, IN2 pin | Output | 3.3V | Digital | **Active HIGH.** Spare SSR channel, wired to the module but not connected to any AC load. Available for a second growlight zone or UV sterilization lamp if the project expands. At boot, GPIO floating = SSR OFF. Safe. |

**Total active GPIOs used:** 10 (8 active + 1 button + 1 reserved)  
**Total GPIOs remaining on ESP32-WROOM-32D 38-pin:** 13 usable (GPIO 13, 14, 26, 27, 32, 33, 36, 39 + strapping pins if carefully managed)

### A.2 — Forbidden Pins (Never Use)

These pins are hardwired to the ESP32's internal flash memory SPI bus or USB-UART bridge. Using them for any external purpose will crash the chip or prevent programming.

| GPIO | Internal Function | Consequence of External Use |
|------|-------------------|----------------------------|
| **6** | Flash SPI CLK (SCK) | ESP32 will not boot. Fatal crash. |
| **7** | Flash SPI D0 (SD0) | ESP32 will not boot. Fatal crash. |
| **8** | Flash SPI D1 (SD1) | ESP32 will not boot. Fatal crash. |
| **9** | Flash SPI D2 (SD2) | ESP32 will not boot. Fatal crash. |
| **10** | Flash SPI D3 (SD3) | ESP32 will not boot. Fatal crash. |
| **11** | Flash SPI CMD (CS) | ESP32 will not boot. Fatal crash. |
| **1** | UART0 TX (USB debug) | Breaks Serial Monitor output. Conflicts with USB-UART bridge during programming. |
| **3** | UART0 RX (USB debug) | Breaks Serial Monitor input. Conflicts with USB-UART bridge during programming. |

### A.3 — Strapping Pins (Explicitly Avoided)

These pins have special functions during the ESP32 boot sequence. Their voltage level at the moment of power-on or reset determines boot behavior. All five are deliberately excluded from the pin assignment above.

| GPIO | Strapping Function | Boot Requirement | Why Avoided |
|------|-------------------|------------------|-------------|
| **0** | Boot Mode Select | Must be HIGH (floating via internal pull-up) for normal SPI boot. If pulled LOW at reset, ESP32 enters UART download mode (firmware flash mode). | Any external load that might pull this pin LOW during power-on — such as a relay module input with a pull-down, or a sensor with a low-impedance output — would prevent normal boot. Too risky for actuator or sensor duty. |
| **2** | Boot Mode Select (secondary) | Must be LOW or floating during programming via UART. Also connected to the onboard blue LED on many DevKitC V4 boards. | Conflict with onboard LED. Connecting external loads may interfere with firmware upload. Some boards will fail to enter programming mode if GPIO 2 is pulled HIGH externally. |
| **5** | VSPI CS0 / SDIO timing | Outputs a brief PWM signal during boot (part of the debug log initialization). After boot, it is free to use, but the transient PWM pulse at startup could momentarily trigger an actuator. | The boot-time PWM glitch is unacceptable for actuator control. A relay or SSR connected here could switch ON for a fraction of a second during every power-on or reset — a safety hazard for AC loads. |
| **12** | MTDI — Flash Voltage Select | Determines the operating voltage of the VDD_SDIO internal regulator. If GPIO 12 is HIGH at boot on a board with a 3.3V flash chip (which is the case for WROOM-32D), the regulator is set to 1.8V, and the flash chip fails to communicate. The ESP32 will not boot. | Fatal boot failure if pulled HIGH by an external device. Absolutely unsuitable for any connection that might present a HIGH level at power-on. |
| **15** | MTDO — Debug Log Output | Controls whether the ROM bootloader prints debug logs to UART0 during boot. If pulled LOW, debug output is silenced. | Less dangerous than GPIO 12, but still affects boot diagnostics. The debug log suppression can mask hardware faults during development. Avoiding it keeps boot diagnostics clean and eliminates one more variable during troubleshooting. |

### A.4 — I2C Device Address Map

Both I2C sensors share GPIO 21 (SDA) and GPIO 22 (SCL) on a single bus. They are distinguished by their 7-bit I2C addresses.

| Device | I2C Address (7-bit) | Address (hex) | ADDR Pin Config | Bus Speed | VCC |
|--------|---------------------|---------------|-----------------|-----------|-----|
| SHT30-D (Temperature & Humidity) | 1000100 | **0x44** | ADDR pin connected to GND (or left floating, default LOW on the breakout module) | 100 kHz (Standard Mode) | 3.3V from ESP32 3V3 pin |
| BH1750FVI / GY-302 (Ambient Light) | 0100011 | **0x23** | ADDR pin connected to GND (LOW state selects address 0x23; HIGH would select 0x5C) | 100 kHz (Standard Mode) | 3.3V from ESP32 3V3 pin |

No address collision exists. The two devices can coexist on the same bus without any bus multiplexer or address translator.

### A.5 — Fail-Safe Boot Sequence

The firmware `setup()` function must execute the following **before any sensor read or control logic runs:**

```
Power-On / Reset
       │
       ▼
ESP32 ROM Bootloader runs (GPIOs are high-impedance / input mode)
       │  ┌─ SSR module: floating GPIO = no drive current into opto = SSR OFF ✓
       │  ├─ Relay 2ch: onboard pull-up holds IN HIGH = relay OFF ✓
       │  └─ Relay 1ch: onboard pull-up holds IN HIGH = relay OFF ✓
       │
       ▼
Arduino setup() begins
       │
       ▼
initFailSafe() — FIRST call in setup(), before WiFi, sensors, or anything else:
       │
       ├─ pinMode(16, OUTPUT); digitalWrite(16, LOW);   // SSR ch1 → OFF (Active HIGH, LOW=OFF)
       ├─ pinMode(25, OUTPUT); digitalWrite(25, LOW);   // SSR ch2 → OFF (Active HIGH, LOW=OFF)
       ├─ pinMode(17, OUTPUT); digitalWrite(17, HIGH);  // Relay 2ch IN1 (pump) → OFF (Active LOW, HIGH=OFF)
       ├─ pinMode(18, OUTPUT); digitalWrite(18, HIGH);  // Relay 2ch IN2 (mist) → OFF (Active LOW, HIGH=OFF)
       └─ pinMode(19, OUTPUT); digitalWrite(19, HIGH);  // Relay 1ch IN (fan) → OFF (Active LOW, HIGH=OFF)
       │
       ▼
All actuators confirmed OFF — safe to proceed with sensor init, WiFi, control loop
```

**Double-layered safety:** The hardware layer (pull-ups on relay modules, no drive current for SSR) guarantees actuators remain OFF during the ~300ms between power-on and `setup()` execution. The software layer (`initFailSafe()`) then explicitly asserts the safe state before any other code runs.

---

## Section B: Cascaded Power Distribution Architecture

### B.0 — System Power Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        SNOWBERRY POWER DISTRIBUTION                        │
│                                                                            │
│  ┌─────────────┐         ┌─────────────┐                                   │
│  │ ADAPTER 24V │         │ ADAPTER 12V │                                   │
│  │    1A DC    │         │    8A DC    │                                   │
│  └──────┬──────┘         └──────┬──────┘                                   │
│         │                       │                                          │
│    DC Socket #1            DC Socket #2                                    │
│         │                       │                                          │
│   ┌─────┴─────┐          ┌─────┴─────┐                                    │
│   │ FUSE 1A   │          │ FUSE 7A   │                                    │
│   │ (24V mist)│          │(12V main) │                                    │
│   └─────┬─────┘          └─────┬─────┘                                    │
│         │                      │                                           │
│    24V RAIL               12V RAIL                                         │
│         │               ┌──────┼──────────┐                                │
│         │               │      │          │                                │
│   Relay 2ch CH2    Relay 2ch  Relay 1ch  LM2596                           │
│         │           CH1         │       Step-Down                          │
│         │            │          │          │                                │
│   Mist Disc       Pump        Fan     5V RAIL                             │
│    (24V)         (12V)       (12V)        │                                │
│                                     ┌─────┼──────────────┐                 │
│                                     │     │              │                 │
│                                   ESP32  Relay         SSR                 │
│                                   VIN   Modules       Module               │
│                                     │   VCC pins      VCC                  │
│                                     │                                      │
│                                  3V3 RAIL (onboard regulator)              │
│                                     │                                      │
│                               ┌─────┼──────┐                               │
│                               │     │      │                               │
│                            SHT30  BH1750  Soil                             │
│                              -D    FVI   Sensor                            │
│                                                                            │
│  ═══════════════════ COMMON GND BUS ═══════════════════                    │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### B.1 — 24V Rail (Ultrasonic Mist Disc — Dedicated Adapter)

**Source:** 24V DC 1A Adapter (wall-mount, barrel jack, center-positive)

**Full signal path:**

```
24V Adapter barrel jack
       │
       ▼
DC Female Socket #1 (3-pin PCB mount: +24V on center pin, GND on sleeve)
       │
       ├─ (+24V) ──→ Terminal Screw Block #1, position A
       │                    │
       │              Fuse Holder #1 (5×20mm glass fuse, 1A rating)
       │                    │
       │              Terminal Screw Block #1, position B ──→ wire to Relay 2ch COM2
       │
       │  Relay 2ch, Channel 2:
       │       COM2 ←── fused +24V
       │       NO2  ──→ Terminal Screw Block #2, position A ──→ Ultrasonic Mist Disc (+)
       │       NC2  ──→ not connected (leave empty)
       │
       └─ (GND) ──→ COMMON GND BUS
                           │
                     Terminal Screw Block #2, position B ←── Ultrasonic Mist Disc (−)
```

**Fuse sizing justification:** The ultrasonic mist disc draws approximately 500–800mA at 24V. A 1A fuse provides sufficient margin for normal operation while protecting against a shorted disc or pinched cable. A 2A fuse would be too large to protect the 1A-rated adapter from overload.

**Why a dedicated 24V adapter:** The ultrasonic mist disc requires 24V DC — it cannot operate on 12V. Running a second LM2596 from the 12V adapter to step *up* to 24V is not possible (LM2596 is a step-down only converter). A dedicated 24V adapter is the only correct solution.

### B.2 — 12V Rail (Pump, Fan, and LM2596 Input)

**Source:** 12V DC 8A Adapter (wall-mount, barrel jack, center-positive)

**Full signal path:**

```
12V Adapter barrel jack
       │
       ▼
DC Female Socket #2 (3-pin PCB mount: +12V on center pin, GND on sleeve)
       │
       ├─ (+12V) ──→ Terminal Screw Block #3, position A
       │                    │
       │              Fuse Holder #2 (5×20mm glass fuse, 7A rating)
       │                    │
       │              Terminal Screw Block #3, position B ──→ 12V DISTRIBUTION NODE
       │
       │  12V DISTRIBUTION NODE splits three ways:
       │       │
       │       ├─── Path 1: Relay 2ch, Channel 1 (Pump)
       │       │         COM1 ←── +12V fused
       │       │         NO1  ──→ Terminal Screw Block #4, pos A ──→ Pump motor (+)
       │       │         NC1  ──→ not connected
       │       │                  Terminal Screw Block #4, pos B ←── Pump motor (−)
       │       │                                                         │
       │       │                  10A10 flyback diode across pump terminals
       │       │                  (anode at pos B / motor −, cathode at pos A / motor +)
       │       │                  See Section C.1 for full detail.
       │       │
       │       ├─── Path 2: Relay 1ch (Humidifier Fan)
       │       │         COM ←── +12V fused
       │       │         NO  ──→ Terminal Screw Block #5, pos A ──→ Fan motor (+)
       │       │         NC  ──→ not connected
       │       │                 Terminal Screw Block #5, pos B ←── Fan motor (−)
       │       │                                                        │
       │       │                 (Flyback diode optional for brushless fan;
       │       │                  if brushed DC fan, install 1N4148 across terminals:
       │       │                  anode to motor −, cathode to motor +)
       │       │
       │       └─── Path 3: LM2596 Step-Down Module
       │                 VIN+ ←── +12V fused
       │                 VIN− ──→ COMMON GND BUS
       │                 │
       │                 (see Section B.3 for LM2596 output)
       │
       └─ (GND) ──→ COMMON GND BUS
```

**Fuse sizing justification:** The 12V adapter is rated 8A. Maximum simultaneous load: pump motor ~3A (steady state, inrush 3–5A), fan ~0.5A, LM2596 input ~0.5A = ~4A typical, ~5.5A peak. A 7A fuse protects against wiring faults and dead-short conditions while allowing the pump inrush transient to pass without nuisance trips. The fuse must be a slow-blow (time-delay) type to tolerate the pump's inrush spike.

**12V Distribution Node wiring:** This node is a physical junction where one fused +12V wire splits into three paths. On the breadboard, this is a shared row on the power rail. On a PCB, this would be a copper pour or a thick trace (minimum 2mm width for 5A). Use a terminal screw block or solder junction — do not rely on breadboard spring contacts for currents above 1A.

### B.3 — 5V Rail (LM2596 Output — ESP32 and Logic)

**Source:** LM2596 DC-DC Step-Down Module (adjustable output, set to 5.00V via onboard potentiometer, verified on the built-in voltmeter display)

**Critical: Set LM2596 output BEFORE connecting any load.** Connect only the 12V input, turn the potentiometer until the voltmeter reads 5.00V, then connect loads. Connecting an ESP32 to an unadjusted LM2596 (which may default to 12V output) will destroy the board.

```
LM2596 Module:
       VIN+ ←── +12V fused (from Section B.2, Path 3)
       VIN− ──→ COMMON GND BUS
       │
       │  [Heatsink 9×9×5mm attached to LM2596 IC via 3M thermal adhesive pad]
       │  [See Section B.6 for heatsink installation detail]
       │
       VOUT+ ──→ 5V DISTRIBUTION NODE
       VOUT− ──→ COMMON GND BUS
       │
       │  ┌─ ELCO 470µF/25V across VOUT+ and VOUT− (see Section B.5)
       │  └─ Ceramic 100nF across VOUT+ and VOUT− (see Section B.5)
       │
       5V DISTRIBUTION NODE splits four ways:
              │
              ├─── ESP32 DevKitC V4 — VIN pin (NOT the 3V3 pin, NOT the 5V/USB pin)
              │         The VIN pin feeds the ESP32's onboard AMS1117-3.3 LDO regulator,
              │         which steps 5V down to 3.3V for the WROOM module.
              │         The AMS1117 requires a minimum 4.5V input and drops ~1.1V,
              │         so 5.0V input produces ~3.9V headroom — sufficient.
              │
              │    ┌─ Ceramic 100nF between VIN pin and adjacent GND pin on ESP32
              │    │  (place physically close to the ESP32 board, within 10mm)
              │    │
              │    └─ ESP32 GND pin ──→ COMMON GND BUS
              │
              ├─── Relay Hi-Lo Opto 2ch Module — VCC pin
              │         Powers the relay coils (through onboard BC547 transistor driver)
              │         and the optocoupler output side (collector supply).
              │         Module GND pin ──→ COMMON GND BUS
              │
              ├─── Relay Hi-Lo Opto 1ch Module — VCC pin
              │         Same function as above, for the dedicated fan relay.
              │         Module GND pin ──→ COMMON GND BUS
              │
              └─── SSR G3MB-202P 2ch Module — VCC pin (DC control side header)
                        Powers the onboard indicator LEDs.
                        The SSR internal optocoupler trigger current flows through
                        the INx pin from the GPIO, not from VCC — but VCC is needed
                        for the status LED circuit on the module.
                        Module GND pin ──→ COMMON GND BUS
```

**5V rail current budget:**

| Consumer | Typical Current | Peak Current | Notes |
|----------|----------------|--------------|-------|
| ESP32 WROOM-32D (WiFi active) | 120 mA | 240 mA | Peak during WiFi TX burst |
| Relay 2ch module (both coils energized) | 70 mA | 80 mA | Each relay coil ~35mA |
| Relay 1ch module (coil energized) | 35 mA | 40 mA | Single relay coil |
| SSR 2ch module (indicator LEDs) | 10 mA | 15 mA | LEDs only; SSR opto driven by GPIO |
| **Total** | **235 mA** | **375 mA** | Well within LM2596's 3A max output |

LM2596 thermal load at worst case: P = (12V − 5V) × 0.375A = 2.6W. The LM2596 is a switching regulator (not linear), so actual dissipation is much lower — approximately (1 − efficiency) × P_out = (1 − 0.85) × 1.875W ≈ 0.28W. The 9×9×5mm heatsink is adequate but still warranted as a reliability margin for continuous operation in an enclosed greenhouse.

### B.4 — 3.3V Rail (ESP32 Onboard Regulator — Sensors)

**Source:** ESP32 DevKitC V4 onboard AMS1117-3.3 LDO regulator. Input: 5V from VIN pin. Output: 3.3V on the **3V3 pin** of the DevKitC header.

This rail is NOT user-adjustable. It is generated internally by the ESP32 development board.

```
ESP32 3V3 pin ──→ 3.3V DISTRIBUTION (sensor bus)
       │
       ├─── SHT30-D module — VCC pin
       │         Sensor operating voltage: 2.15V–5.5V. Powered at 3.3V for
       │         direct I2C logic level compatibility with ESP32 (no level shifter needed).
       │         Heater draws ~33mW extra when activated via I2C command (~10mA at 3.3V).
       │         Module GND ──→ COMMON GND BUS
       │
       ├─── BH1750FVI / GY-302 module — VCC pin
       │         Sensor operating voltage: 2.4V–3.6V. MUST be 3.3V.
       │         Powering at 5V will exceed the BH1750's absolute maximum rating and
       │         damage the sensor permanently.
       │         Module GND ──→ COMMON GND BUS
       │
       ├─── Capacitive Soil Moisture V2.0 — VCC pin
       │         Sensor operating voltage: 3.3V–5.5V. Powered at 3.3V so that
       │         the analog output voltage range (approximately 1.2V–2.8V at 3.3V supply)
       │         never exceeds the ESP32 ADC maximum input of 3.3V.
       │         Module GND ──→ COMMON GND BUS
       │
       ├─── I2C Pull-Up Resistors (2× 4.7kΩ) — tied to 3.3V
       │         See Section E for full detail.
       │
       └─── Voltage Divider — 1N4148 clamp diode cathode tied to 3.3V
                See Section C.4 for full detail.
```

**3.3V rail current budget:**

| Consumer | Typical Current | Peak Current | Notes |
|----------|----------------|--------------|-------|
| SHT30-D (measuring, heater OFF) | 0.6 mA | 1.5 mA | Heater OFF during normal reads |
| SHT30-D heater (when activated) | +10 mA | +15 mA | Periodic pulse only, not continuous |
| BH1750FVI (measuring) | 0.12 mA | 0.19 mA | Continuous H-resolution mode |
| Soil Moisture V2.0 | 5 mA | 8 mA | Onboard 555 timer oscillator |
| I2C pull-ups (2× 4.7kΩ) | 1.4 mA | 1.4 mA | 3.3V / 4.7kΩ × 2 lines |
| **Total (heater OFF)** | **7.1 mA** | **11.1 mA** | AMS1117 rated 800mA. Massive headroom. |
| **Total (heater ON)** | **17.1 mA** | **26.1 mA** | Still negligible vs. 800mA capacity. |

### B.5 — Capacitor Placement Map

| Capacitor | Value | Voltage Rating | Placement Location | Purpose |
|-----------|-------|----------------|-------------------|---------|
| **C1** — Electrolytic | 470µF | 25V | Across LM2596 VOUT+ and VOUT−, physically soldered or inserted within 15mm of the module's output screw terminals. **Observe polarity:** stripe/minus leg to VOUT− (GND). | Bulk energy reservoir for the 5V rail. Absorbs current transients when relay coils energize or the ESP32 WiFi transmitter fires a burst. Prevents the 5V rail from sagging below the AMS1117's minimum input dropout threshold (4.5V). The 25V voltage rating provides a 5× safety factor. |
| **C2** — Ceramic (MLCC) | 100nF | 50V (typical) | Across LM2596 VOUT+ and VOUT−, directly adjacent to C1. No polarity. | High-frequency decoupling. Electrolytic capacitors have high ESR and poor high-frequency response. The 100nF ceramic handles fast switching transients that the 470µF cannot. The two capacitors form a complementary pair: the electrolytic handles low-frequency bulk current, the ceramic handles high-frequency noise. |
| **C3** — Ceramic (MLCC) | 100nF | 50V (typical) | Between ESP32 VIN pin and the nearest GND pin on the DevKitC header. Keep lead length under 10mm. | Local decoupling for the ESP32's onboard AMS1117 regulator input. Suppresses high-frequency noise on the 5V supply wire before it reaches the regulator, reducing the chance of conducted EMI causing erratic ADC readings or WiFi instability. |
| **C4** — Ceramic (MLCC) | 100nF | 50V (typical) | Across the lower resistor of the voltage divider (between ADC input GPIO 35 and GND). | Anti-aliasing / noise filter for the ADC voltage divider. The resistive divider has high source impedance (10kΩ lower leg), which makes it susceptible to coupled noise from the relay switching transients. The 100nF cap forms a low-pass filter with the divider impedance: f_c = 1 / (2π × 10kΩ × 100nF) ≈ 159 Hz. This passes the DC rail voltage while rejecting relay-induced spikes. |
| **C5** — Ceramic (MLCC) | 100nF | 50V (typical) | Across the tactile button terminals (between GPIO 4 and GND). | Hardware debounce. Combined with the GPIO's internal pull-up resistor (~45kΩ), forms an RC filter with τ = 45kΩ × 100nF ≈ 4.5ms — sufficient to suppress contact bounce without slowing down intentional press detection. |

### B.6 — Heatsink Installation on LM2596

The LM2596 IC on the step-down module is a TO-263 (D2PAK) surface-mount package. Under worst-case thermal conditions (continuous operation in a greenhouse at 35°C ambient, enclosed housing with limited airflow), the IC can reach its thermal shutdown threshold without a heatsink.

**Installation procedure:**

1. Identify the LM2596 IC on the module — it is the largest component, a black rectangular package with a metal tab on one side.
2. Clean the top surface of the IC with isopropyl alcohol. Remove any residual flux or dust.
3. Cut the 3M thermal adhesive pad to 9×9mm (matching the heatsink footprint).
4. Peel one side of the thermal pad, apply to the heatsink base.
5. Peel the other side, press the heatsink firmly onto the IC top surface.
6. Verify the heatsink does not short any adjacent components or traces on the module.
7. The heatsink fins should face upward (away from the PCB) for natural convection.

---

## Section C: Actuator Protection Connections

### C.1 — 10A10 Flyback Diode at Pump Motor Terminals

**What:** The water pump motor is an inductive DC load. When the relay switches OFF and current flow is interrupted, the collapsing magnetic field in the motor windings generates a voltage spike (back-EMF / flyback) that can reach hundreds of volts. This spike travels backward through the relay contacts, potentially arcing the contacts, damaging the relay driver transistor, or propagating through the power rail to the ESP32.

**Why 10A10 and not 1N4007:** The pump motor has a stall/inrush current of 3–5A. The flyback diode must handle the full motor current for the brief duration of the flyback pulse (typically 1–10ms). The 1N4007 is rated for only 1A average / 30A surge (single half-cycle, 8.3ms). While it might survive a few events, it operates at its absolute maximum limit with no margin. The 10A10 is rated for 10A average / 150A surge — providing a comfortable safety factor of 2–3× over the worst-case pump current. This is a reliability upgrade, not an overcautious one.

**Exact orientation and wiring:**

```
            Terminal Screw Block #4
            ┌─────────┬─────────┐
            │  pos A  │  pos B  │
            │ (+12V   │ (GND    │
            │  from   │  to     │
            │ relay   │ common  │
            │  NO1)   │ GND bus)│
            └────┬────┴────┬────┘
                 │         │
    Pump Motor + │         │ Pump Motor −
                 │         │
                 │    ┌────┘
                 │    │
               ┌─┴────┴─┐
               │  PUMP   │
               │  MOTOR  │
               └─┬────┬──┘
                 │    │
            ┌────┘    └────┐
            │              │
     ───────┤   10A10      ├───────
            │   DIODE      │
     Cathode│  ◄── band    │Anode
     (pos A │   on diode   │(pos B
      +12V  │   body)      │ GND
      side) │              │side)
            └──────────────┘

  Cathode (band/stripe) ──→ connects to pos A (+12V / pump motor + terminal)
  Anode   (no band)     ──→ connects to pos B (GND / pump motor − terminal)
```

**In words:** The 10A10 diode is wired **in reverse** across the pump motor terminals — meaning in normal operation, the diode is reverse-biased (blocking) and carries zero current. When the relay opens and the motor's magnetic field collapses, the flyback voltage forward-biases the diode, and the flyback energy is safely dissipated through the diode and the motor's own winding resistance rather than arcing across the relay contacts.

**Physical placement:** Mount the 10A10 directly at the terminal screw block, with leads as short as possible. Long leads add inductance and reduce the diode's ability to clamp the voltage spike. The 10A10 is an axial through-hole package (R-6 case), approximately 5mm diameter × 10mm long — it fits easily between the two terminal block screws.

### C.2 — Relay Module Optocoupler Connections

Both the 2-channel and 1-channel relay modules used in this project are **opto-isolated relay modules** with the full driver circuit built in. No external transistors, resistors, or optocouplers are needed.

**Onboard circuit inside each relay module:**

```
  External Connection          Module Onboard Circuit
  ──────────────────          ─────────────────────────────────────────

                                    VCC (5V)
                                      │
                                      ├──→ Relay Coil (+)
                                      │
                              ┌───────┴───────┐
                              │    BC547      │
                              │   (onboard)   │
                              │    C          │
                              │    │          │
                              │    B ←─ R ←── PC817 collector
                              │    │          │         │
                              │    E ──→ GND  │    PC817 emitter ──→ GND
                              │               │
                              └───────────────┘
                                                   PC817 anode ←── R ←── VCC
                                                   PC817 cathode ──→ IN pin
                                                                       ▲
  GPIO pin (ESP32) ─────────────────────────────────────────────────────┘
```

**Signal path explained step by step:**

1. **GPIO drives LOW (0V):** Current flows from VCC, through the onboard current-limiting resistor, through the PC817 optocoupler's internal LED (anode to cathode), out through the IN pin, and sinks into the GPIO pin at 0V. The LED illuminates. The PC817's phototransistor conducts, driving current into the BC547 base. The BC547 saturates, pulling the relay coil's ground side LOW, energizing the coil. **Relay clicks ON.**

2. **GPIO drives HIGH (3.3V):** The voltage across the PC817 LED is nearly zero (VCC and IN pin are both high, no potential difference to drive current). The LED is dark. The PC817 phototransistor is open. The BC547 has no base drive and is OFF. The relay coil is de-energized. **Relay is OFF.**

This is why the relay is **Active LOW / Low-level trigger:** GPIO LOW = relay ON, GPIO HIGH = relay OFF.

**JD-VCC jumper (present on 2-channel module):**

The 2-channel relay module has a jumper labeled **JD-VCC** next to the VCC pin header:

- **Jumper INSTALLED (default):** JD-VCC is shorted to VCC. The relay coils and the optocoupler logic both share the same 5V supply. This is the simplest configuration and is appropriate for this project because all modules share a common ground with the ESP32 anyway — full galvanic isolation is not required.

- **Jumper REMOVED:** JD-VCC must be powered separately from VCC. The relay coils are powered by the JD-VCC supply, and the optocoupler logic side is powered by VCC. This provides true galvanic isolation between the ESP32 logic domain and the relay coil power domain. Useful in industrial environments with high-voltage relay coils (24V/48V coils), but unnecessary here since we use 5V coils on the same ground plane.

**Recommendation for this project:** Keep the JD-VCC jumper **installed**. Connect VCC to the 5V rail from the LM2596. Connect GND to the common ground bus. Connect IN1/IN2 directly to ESP32 GPIOs.

**Wiring summary for relay modules:**

| Pin on Module | 2ch Relay Module Connection | 1ch Relay Module Connection |
|---------------|-----------------------------|-----------------------------|
| VCC | +5V from LM2596 output | +5V from LM2596 output |
| GND | Common GND bus | Common GND bus |
| IN1 | GPIO 17 (pump) | — |
| IN2 | GPIO 18 (mist disc) | — |
| IN | — | GPIO 19 (fan) |
| JD-VCC | Jumpered to VCC (default) | N/A (1ch modules typically lack this jumper) |
| COM1 | +12V fused (pump power) | — |
| NO1 | Pump motor (+) terminal | — |
| NC1 | Not connected | — |
| COM2 | +24V fused (mist disc power) | — |
| NO2 | Ultrasonic mist disc (+) terminal | — |
| NC2 | Not connected | — |
| COM | — | +12V fused (fan power) |
| NO | — | Fan motor (+) terminal |
| NC | — | Not connected |

### C.3 — SSR G3MB-202P 2-Channel Module Connections

The SSR G3MB-202P module uses solid-state relays (opto-isolated TRIAC output) for zero-cross AC switching. Each channel has a DC control side and an AC load side.

**DC Control Side (low-voltage, safe to touch):**

| Pin on Module | Connection |
|---------------|------------|
| VCC | +5V from LM2596 output (powers indicator LEDs on module) |
| GND | Common GND bus |
| IN1 | GPIO 16 (growlight — Active HIGH: GPIO HIGH = SSR ON = AC flows to growlight) |
| IN2 | GPIO 25 (spare — Active HIGH: not connected to any load currently) |

**AC Load Side (LETHAL VOLTAGE — handle with extreme care):**

The AC load side of each SSR channel has two screw terminals. These carry 220V AC mains voltage when the SSR is conducting.

```
  MAINS 220V AC ────┐
  (Live wire)       │
                    │
              SSR Ch1 Terminal 1 (AC input)
                    │
              [G3MB-202P SSR — internal opto-TRIAC]
              [Zero-cross switching — turns ON only at AC zero crossing]
              [Turns OFF when current naturally drops to zero]
                    │
              SSR Ch1 Terminal 2 (AC output)
                    │
              ──────┴──→ Growlight Bulb (+)
                              │
              Growlight Bulb (−) ──→ Neutral wire back to mains
```

**SSR operating characteristics:**

| Parameter | Value | Notes |
|-----------|-------|-------|
| Control voltage | 3–32V DC | ESP32 GPIO at 3.3V HIGH provides ~7.5mA through the SSR input opto-LED (assuming 220Ω internal resistor). This exceeds the minimum trigger current of ~5mA. |
| Load voltage | 100–240V AC | Designed for AC mains only. Cannot switch DC — the TRIAC will latch ON permanently because DC never crosses zero. |
| Max load current | 2A per channel | Our growlight load: 100W / 220V = 0.45A. Headroom: 2A / 0.45A = 4.4×. Safe. |
| Switching type | Zero-cross | SSR waits for the AC waveform to cross 0V before turning ON or OFF. Eliminates EMI from mid-cycle switching and reduces inrush stress on resistive loads. |

**Mandatory clearance rule:** Maintain a minimum of **6mm clearance** between any AC trace/wire (SSR load side) and any DC trace/wire (control side, sensor lines, I2C bus). On a breadboard, this means at least 3 empty rows between any AC wire and the nearest DC wire. On a PCB, this translates to a 6mm keepout zone between AC copper and DC copper, with a routed slot if possible. This is a basic electrical safety requirement for 220V AC systems per IEC 60950-1 / IEC 62368-1 creepage distance tables.

**AC wiring warning:** The NYA 0.5mm² cable specified in the BOM is rated for low-voltage signal wiring only. For the AC mains wiring between the SSR load terminals and the growlight, use a properly rated mains cable (minimum 0.75mm² / 18AWG, with appropriate insulation for 300V+ rating). The AC adapter's power cord and plug must have a proper strain relief.

### C.4 — Voltage Divider Rail Monitoring

**Purpose:** Monitor the 12V rail voltage via an ESP32 ADC pin. If the 12V adapter is disconnected, the pump and fan lose power, but the ESP32 (on the 5V rail from LM2596) may remain powered by residual energy in the capacitors. The voltage divider allows firmware to detect the 12V rail dropping below a threshold and raise an alert before the capacitors deplete entirely.

**Critical Design Error in Original BOM — CORRECTED:**

The original BOM specifies a 20kΩ + 10kΩ voltage divider on the 12V rail:

```
V_out = 12V × 10kΩ / (20kΩ + 10kΩ) = 12V × 0.333 = 4.0V  ← EXCEEDS 3.3V ADC MAX!
```

Feeding 4.0V into an ESP32 ADC pin (which has an absolute maximum input of 3.3V referenced to VDD) will clip the reading at maximum and, depending on the GPIO's internal ESD protection diode, may stress the input protection structure. This must be corrected.

**Corrected Design — 30kΩ + 10kΩ Divider with Clamp Diode:**

Use the available stock resistors to construct a 30kΩ upper leg: solder (or series-connect on breadboard) one 20kΩ resistor and one 10kΩ resistor **in series** to form 30kΩ. Use a single 10kΩ resistor for the lower leg.

```
  +12V Rail (fused) ──────┐
                          │
                    ┌─────┴─────┐
                    │  R_upper  │
                    │  20kΩ     │
                    └─────┬─────┘
                          │  (series connection, solder or breadboard)
                    ┌─────┴─────┐
                    │  R_upper2 │
                    │  10kΩ     │
                    └─────┬─────┘
                          │
                          ├──────────────── V_ADC ──→ GPIO 35 (ADC1_CH7)
                          │                   │
                          │             ┌─────┴─────┐
                          │             │  1N4148   │
                          │             │  Clamp    │
                          │             │  Diode    │
                          │             │ Anode=ADC │
                          │             │ Cathode=  │
                          │             │   3.3V    │
                          │             └─────┬─────┘
                          │                   │
                          │              ESP32 3V3 pin
                          │
                    ┌─────┴─────┐
                    │  R_lower  │
                    │  10kΩ     │
                    └─────┬─────┘
                          │
                    ┌─────┴─────┐
                    │  C4       │
                    │  100nF    │
                    │  ceramic  │
                    └─────┬─────┘
                          │
                     COMMON GND BUS
```

**Corrected voltage calculation:**

| Condition | V_12V Rail | V_ADC Output | Status |
|-----------|-----------|--------------|--------|
| Normal operation | 12.0V | 12.0 × 10/(30+10) = **3.00V** | Within 3.3V ADC range. Safe. |
| Adapter slightly high (no load) | 12.5V | 12.5 × 10/40 = **3.13V** | Still within range. Safe. |
| Adapter at absolute max (+10%) | 13.2V | 13.2 × 10/40 = **3.30V** | Exactly at limit — 1N4148 clamp diode provides safety margin. |
| Adapter at +15% (out of spec) | 13.8V | 13.8 × 10/40 = 3.45V → **clamped to 3.3V + 0.3V = 3.6V** by 1N4148 | Diode clamps. ESP32 ADC reads full-scale. No damage. |
| Adapter disconnected | 0V | **0.00V** | Firmware detects fault. |
| Adapter sagging (overloaded) | 10.0V | 10.0 × 10/40 = **2.50V** | Firmware detects low voltage warning. |

**1N4148 clamp diode function:** The diode is wired with its anode on the ADC voltage divider output (GPIO 35 node) and its cathode on the 3.3V rail. In normal operation, the ADC voltage is below 3.3V, so the diode is reverse-biased and invisible to the circuit (leakage current ~25nA, negligible). If the divider output ever exceeds 3.3V + V_f (approximately 3.3V + 0.3V = 3.6V), the diode forward-conducts and clamps the ADC pin voltage to 3.6V, which is within the ESP32 GPIO's absolute maximum rating of 3.6V (per Espressif datasheet, Section 5.2). This provides hardware overvoltage protection that does not depend on firmware.

**Divider impedance and ADC accuracy:** The ESP32's SAR ADC has an internal sample-and-hold capacitor of approximately 7pF. The source impedance seen by the ADC is R_upper ∥ R_lower = 30kΩ ∥ 10kΩ = 7.5kΩ. The RC settling time is τ = 7.5kΩ × 7pF = 52.5ns. At the default 12-bit ADC conversion rate, the sampling window is approximately 1.5µs — more than 28 time constants. The S/H capacitor fully settles. No accuracy concern. The 100nF capacitor C4 across the lower resistor further reduces source impedance at the ADC input frequency, improving reading stability.

**Firmware threshold logic:**

```
ADC Attenuation: ADC_ATTEN_DB_11 (full-scale range 0–3.3V, 12-bit = 0–4095 counts)

Conversion formula:
  V_rail_12V = (adc_raw / 4095.0) × 3.3 × (30.0 + 10.0) / 10.0
             = (adc_raw / 4095.0) × 3.3 × 4.0
             = adc_raw × 0.003223  (volts)

Threshold table:
  adc_raw ≈ 3723  →  V_rail = 12.0V  →  NORMAL
  adc_raw < 3100  →  V_rail < 10.0V  →  WARNING: 12V rail sagging (overload or adapter weak)
  adc_raw < 1550  →  V_rail <  5.0V  →  CRITICAL: Adapter likely disconnected or failed
  adc_raw < 310   →  V_rail <  1.0V  →  FAULT: 12V adapter confirmed disconnected

Action on FAULT:
  Force all DC actuators OFF (pump, mist disc, fan) via failsafe.
  Log event to RAM buffer.
  Push notification via FCM when WiFi is available.
  Continue monitoring — if rail recovers (adapter reconnected), clear fault after 10 stable readings.
```

**Current draw through divider (parasitic load on 12V rail):** I = 12V / (30kΩ + 10kΩ) = 0.3mA. Negligible. This is a monitoring circuit, not a power circuit.

---

## Section D: Common Grounding Rules

### D.1 — Single-Point Ground Bus Architecture

All component grounds in the system must connect to a **single common ground bus**. This bus is the 0V reference for every voltage rail (24V, 12V, 5V, 3.3V) and every signal (I2C, ADC, GPIO).

On the breadboard, the ground bus is the blue (−) power rail strip running along the edge of the board. On a future PCB, this would be a continuous copper ground plane or a thick ground trace.

**Ground bus connection list — every component that ties to GND:**

| # | Component | Ground Pin/Terminal | Wire to GND Bus |
|---|-----------|--------------------|----|
| 1 | ESP32 DevKitC V4 | GND pin (any of the 3 GND pins on the header) | Direct to bus |
| 2 | 24V DC Adapter | Barrel jack sleeve (−) via DC Socket #1 | Direct to bus |
| 3 | 12V DC Adapter | Barrel jack sleeve (−) via DC Socket #2 | Direct to bus |
| 4 | LM2596 Module | VIN− and VOUT− (both tied internally on the module, but connect both to GND bus for redundancy) | Direct to bus |
| 5 | SSR G3MB-202P 2ch Module | GND pin (DC control side header) | Direct to bus |
| 6 | Relay Hi-Lo Opto 2ch Module | GND pin | Direct to bus |
| 7 | Relay Hi-Lo Opto 1ch Module | GND pin | Direct to bus |
| 8 | SHT30-D Module | GND pin | Direct to bus |
| 9 | BH1750FVI / GY-302 Module | GND pin | Direct to bus |
| 10 | Capacitive Soil Moisture V2.0 | GND pin | Direct to bus |
| 11 | Pump Motor (−) terminal | Via Terminal Screw Block #4, pos B | Direct to bus |
| 12 | Fan Motor (−) terminal | Via Terminal Screw Block #5, pos B | Direct to bus |
| 13 | Ultrasonic Mist Disc (−) terminal | Via Terminal Screw Block #2, pos B | Direct to bus |
| 14 | ELCO 470µF/25V (C1) | Negative (stripe) leg | Direct to bus |
| 15 | All ceramic 100nF caps (C2–C5) | One leg each | Direct to bus |
| 16 | Voltage divider lower resistor (R_lower, 10kΩ) | Bottom leg (through C4 to GND) | Direct to bus |
| 17 | Tactile button | One terminal (other terminal to GPIO 4) | Direct to bus |
| 18 | I2C pull-up resistors | Not connected to GND (they pull to 3.3V) | N/A — listed for clarity |

### D.2 — Wire Gauge Rules

| Wire Use | Minimum Gauge | Maximum Current | Cable Type |
|----------|---------------|-----------------|------------|
| **Signal wiring** — GPIO to relay IN pins, I2C SDA/SCL, soil sensor analog, button, voltage divider | NYA 0.5mm² (20 AWG equivalent) | < 100mA | NYA solid copper, red for signal/VCC, black for GND |
| **5V power distribution** — LM2596 output to ESP32 VIN, relay VCC, SSR VCC | 0.5mm² minimum, 0.75mm² preferred | < 500mA | NYA or stranded, keep runs short (< 20cm) |
| **12V actuator lines** — 12V rail to pump motor, fan motor (through relay COM/NO) | **0.75mm² (18 AWG) minimum, 1.0mm² (17 AWG) preferred** | Up to 5A (pump inrush) | Stranded copper, NOT NYA 0.5mm. Source separately. |
| **24V actuator line** — 24V rail to mist disc (through relay COM/NO) | 0.5mm² (20 AWG) minimum | < 1A | NYA 0.5mm² is acceptable here due to low current |
| **AC mains wiring** — SSR load terminals to growlight | **0.75mm² (18 AWG) minimum, insulation rated ≥300V** | < 0.5A | Mains-rated cable only. NOT the NYA signal wire. |

**The NYA 0.5mm² cable in the BOM is for signal wiring only.** It must not be used for the 12V pump line (which can carry 3–5A inrush). At 5A, a 0.5mm² conductor dissipates I²R heat that can melt the insulation and cause a fire. Source 0.75–1.0mm² stranded wire separately for the 12V actuator runs.

### D.3 — Ground Loop Prevention

All ground wires must converge to a single physical point (star topology) rather than forming loops. On the breadboard, this is naturally achieved because the ground bus strip is a single conductor. On a PCB, route all ground returns to one area of the ground plane near the LM2596 module (the central power distribution point).

Do NOT run separate ground wires from each adapter to each load independently — this creates ground loops that can cause voltage offsets between the ADC reference and sensor grounds, leading to inaccurate soil moisture and voltage divider readings.

---

## Section E: I2C Bus Architecture

### E.1 — Bus Topology

```
                          3.3V (ESP32 3V3 pin)
                            │           │
                         ┌──┴──┐     ┌──┴──┐
                         │4.7kΩ│     │4.7kΩ│
                         │ R1  │     │ R2  │
                         └──┬──┘     └──┬──┘
                            │           │
  ESP32 GPIO 21 (SDA) ─────┤           ├───── ESP32 GPIO 22 (SCL)
                            │           │
                      ┌─────┼─────┐     │
                      │     │     │     │
                 ┌────┴──┐  │  ┌──┴─────┴──┐
                 │SHT30-D│  │  │BH1750FVI  │
                 │ SDA   │  │  │  SDA  SCL │
                 │ SCL ──┼──┘  │           │
                 │       │     │           │
                 │ VCC   │     │   VCC     │
                 │  │    │     │    │      │
                 │ 3.3V  │     │  3.3V     │
                 │       │     │           │
                 │ GND   │     │   GND     │
                 │  │    │     │    │      │
                 └──┼────┘     └────┼──────┘
                    │               │
               COMMON GND BUS ─────┘
```

Both sensors share the same two-wire I2C bus. The SDA and SCL lines connect in parallel to all devices. Each device responds only when its unique I2C address is called by the master (ESP32).

### E.2 — Pull-Up Resistors

| Parameter | Value | Justification |
|-----------|-------|---------------|
| Pull-up resistance | **4.7kΩ** | Standard value for 100kHz I2C at 3.3V. The pull-up current at logic LOW is I = 3.3V / 4.7kΩ = 0.70mA per line — within the SHT30-D sink capability (datasheet max: 4mA on SDA) and BH1750 sink capability (datasheet max: 3mA). |
| Pull-up voltage | **3.3V** (from ESP32 3V3 pin) | Must match the I2C logic level. Both sensors and the ESP32 operate at 3.3V I2C. Do NOT pull up to 5V — this would exceed the ESP32 GPIO input maximum of 3.3V and damage the pin. |
| Number of resistors | **2** (one on SDA, one on SCL) | Each line needs its own pull-up. The bus is open-drain: devices can only pull the line LOW; the pull-up resistor returns the line to HIGH when released. Without pull-ups, the bus floats and communication fails. |
| Physical placement | As close to the ESP32 as possible, within 20mm of GPIO 21 and GPIO 22. | Minimizes stub length. Long stubs act as antennas that pick up interference from the SSR switching and relay coil activation. |

**Do not use the ESP32's internal pull-ups for I2C.** The internal pull-ups are approximately 45kΩ — far too weak for reliable I2C communication, especially on bus runs longer than 10cm (which is common in a greenhouse where sensors may be placed away from the controller board). The 4.7kΩ external pull-ups are mandatory.

### E.3 — Bus Speed Configuration

| Parameter | Setting | Reason |
|-----------|---------|--------|
| Bus clock frequency | **100 kHz** (Standard Mode) | The I2C bus in this system may run 30–80cm of wire between the ESP32 and the sensors (greenhouse layout). At 400kHz (Fast Mode), the higher edge rates are more susceptible to ringing, crosstalk, and reflections on long unshielded wires. 100kHz is conservative and completely adequate for the data rates involved: SHT30-D measurement takes ~15ms regardless of bus speed, and BH1750 high-resolution mode takes ~120ms. The bus clock is not the bottleneck. |
| Bus capacitance limit | < 400pF (I2C spec) | Typical capacitance: ~100pF per meter of ribbon cable + ~10pF per device input. With 0.8m of wire and 2 devices: ~100pF. Well within spec. |

### E.4 — I2C Bus Recovery Routine

In high-humidity greenhouse environments, I2C sensors can enter a stuck state where the SDA line is held LOW indefinitely. This typically occurs when a sensor is interrupted mid-transaction (e.g., by a power glitch from relay switching) and its state machine freezes with the SDA line asserted LOW, blocking all further bus communication.

**Recovery procedure (executed at startup and on bus fault detection):**

```
function i2c_bus_recovery():
    // Release SDA and SCL from I2C peripheral control
    // Configure both as GPIO outputs temporarily

    pinMode(SDA_PIN, INPUT);          // Release SDA — let it float
    pinMode(SCL_PIN, OUTPUT);         // Take manual control of SCL

    // Clock SCL up to 9 times to force the stuck device to release SDA
    // (I2C spec: a device must release SDA after 9 clocks if it lost sync)
    for (int i = 0; i < 9; i++):
        digitalWrite(SCL_PIN, HIGH);
        delayMicroseconds(5);         // Half-period of ~100kHz
        digitalWrite(SCL_PIN, LOW);
        delayMicroseconds(5);

    // Generate a STOP condition to reset all devices' state machines
    pinMode(SDA_PIN, OUTPUT);
    digitalWrite(SDA_PIN, LOW);       // SDA LOW while SCL is LOW
    delayMicroseconds(5);
    digitalWrite(SCL_PIN, HIGH);      // SCL goes HIGH
    delayMicroseconds(5);
    digitalWrite(SDA_PIN, HIGH);      // SDA goes HIGH while SCL is HIGH = STOP condition

    // Re-initialize the I2C peripheral
    Wire.begin(SDA_PIN, SCL_PIN);
    Wire.setClock(100000);            // 100kHz
```

**When to invoke:**
1. At the very beginning of `setup()`, before any I2C device communication.
2. Whenever a sensor read function returns a NACK or timeout error 3 consecutive times.
3. After a watchdog reset (the TWDT may have fired because a sensor call blocked).

### E.5 — Sensor Addressing and Conflict Avoidance

| Parameter | SHT30-D | BH1750FVI |
|-----------|---------|-----------|
| I2C Address | 0x44 | 0x23 |
| Alternative Address | 0x45 (ADDR pin to VCC) | 0x5C (ADDR pin to VCC) |
| Conflict with other address? | No — 0x44 and 0x23 do not overlap | No |
| ADDR pin wiring | GND (or floating, module default) | GND (solder bridge on GY-302 module, verify marking) |
| Maximum bus devices at these addresses | 1 SHT30 at 0x44 + 1 SHT30 at 0x45 = 2 max per bus | 1 BH1750 at 0x23 + 1 BH1750 at 0x5C = 2 max per bus |

If a second sensor of the same type is ever needed (e.g., two SHT30 modules for inside/outside temperature), change the second module's ADDR pin to VCC to select the alternate address.

### E.6 — SHT30-D Built-In Heater Notes

The SHT30-D contains an on-chip resistive heater element controllable via I2C commands. This heater is designed to burn off condensation from the sensor's MEMS humidity element in extremely humid environments — exactly the condition inside a greenhouse growing strawberries.

| Parameter | Value |
|-----------|-------|
| Heater power dissipation | ~33mW (at 3.3V supply) |
| Heater activation | I2C command: write `0x30 0x6D` to address `0x44` to enable heater |
| Heater deactivation | I2C command: write `0x30 0x66` to address `0x44` to disable heater |
| Recommended duty cycle | 10% — e.g., ON for 60 seconds, OFF for 540 seconds (10-minute cycle) |
| Effect on temperature reading | Heater elevates the sensor's local temperature by approximately 1–3°C while active. **Do not read temperature during heater-on periods.** Read humidity only, or skip readings entirely during the heater pulse and use the last known temperature value. |
| Current draw from 3.3V rail | ~10mA additional when heater is ON, ~0mA when OFF |

---

## Appendix: Terminal Screw Block Allocation

The BOM includes 6× Terminal Screw Block 8.5mm (2-pin). Their assignments:

| Block # | Position A | Position B | Wire Gauge | Section Ref |
|---------|-----------|-----------|------------|-------------|
| **#1** | 24V fused input (from Fuse Holder #1) | 24V to Relay 2ch COM2 | 0.5mm² NYA (< 1A) | B.1 |
| **#2** | Mist disc (+) from Relay 2ch NO2 | Mist disc (−) to GND bus | 0.5mm² NYA (< 1A) | B.1 |
| **#3** | 12V post-adapter (to Fuse Holder #2 input) / 12V fused output | 12V to distribution node | 0.75mm² min (up to 8A) | B.2 |
| **#4** | Pump (+) from Relay 2ch NO1 | Pump (−) to GND bus. **10A10 diode across these two positions.** | 0.75mm² min (up to 5A) | B.2, C.1 |
| **#5** | Fan (+) from Relay 1ch NO | Fan (−) to GND bus | 0.5mm² NYA (< 1A) | B.2 |
| **#6** | Spare / expansion (e.g., second soil sensor power, external LED indicator) | — | — | — |

---

## Appendix: DC Female Socket Pin Assignment

The BOM includes 3× DC Female Socket 3P (PCB-mount barrel jack connectors).

| Socket # | Connected Adapter | Center Pin (+) | Sleeve (−) | Third Pin |
|----------|-------------------|----------------|------------|-----------|
| **#1** | 24V DC 1A Adapter | +24V → Terminal Block #1 → Fuse #1 | GND → Common GND Bus | Internally tied to sleeve (GND) on most 3P sockets. Verify with multimeter before powering on. |
| **#2** | 12V DC 8A Adapter | +12V → Terminal Block #3 → Fuse #2 | GND → Common GND Bus | Same as above. |
| **#3** | Spare / expansion | Not connected | Not connected | — |

---

## Appendix: Complete Wire Color Code Convention

| Wire Color | Function | Examples |
|------------|----------|---------|
| **Red** NYA 0.5mm² | Positive voltage signal/control lines | GPIO to relay IN, GPIO to SSR IN, VCC sensor feeds, I2C SDA, I2C SCL, button signal |
| **Black** NYA 0.5mm² | Ground signal/control lines | Sensor GND, module GND, button GND leg |
| **Red** 0.75mm²+ stranded | Positive voltage power lines | +12V to pump, +12V to fan, +24V to mist disc, +5V from LM2596 to ESP32 VIN |
| **Black** 0.75mm²+ stranded | Ground power lines | Pump GND, fan GND, mist disc GND, adapter GND returns |
| **Brown or Blue** mains-rated | AC live (L) and neutral (N) | SSR load terminals to growlight. Follow local wiring color code (Indonesia SNI: brown = L, blue = N). |
| **Green/Yellow** | Earth / protective ground | If the enclosure is metal, bond it to earth. Not applicable for plastic greenhouse housing. |

---

## Appendix: Pre-Power-On Verification Checklist

Complete this checklist **in order** before applying power to the system for the first time.

1. **LM2596 output pre-set:** Connect only the 12V adapter to the LM2596 input. With NO loads connected to the output, adjust the potentiometer until the onboard voltmeter reads **5.00V ± 0.05V**. Disconnect 12V.
2. **Wiring audit:** Trace every wire from source to destination. Verify no short circuits between +V and GND on any rail. Use a multimeter in continuity mode.
3. **Polarity check on all electrolytic capacitors:** Stripe (−) leg must face GND. A reversed ELCO will fail violently (vent/explode) when power is applied.
4. **Flyback diode orientation:** The 10A10's cathode band must face the +12V side (pump motor + terminal). Reversed = diode conducts in normal operation = dead short on 12V rail = blown fuse (at best) or fire (at worst).
5. **1N4148 clamp diode orientation:** Cathode band must face the 3.3V rail. Anode on the ADC GPIO 35 node. Reversed = clamps ADC to GND instead of 3.3V = no voltage monitoring.
6. **I2C pull-ups:** Verify 4.7kΩ resistors are connected between SDA and 3.3V, and between SCL and 3.3V. NOT to 5V.
7. **Voltage divider:** Verify the upper leg is 30kΩ (20k + 10k in series) and the lower leg is 10kΩ. Measure with a multimeter before inserting into circuit.
8. **Relay module JD-VCC jumper:** Confirm jumper is installed on the 2ch module.
9. **AC wiring clearance:** Confirm ≥6mm physical separation between any AC wire and any DC wire/component.
10. **Fuse values:** Confirm Fuse #1 = 1A (24V line), Fuse #2 = 7A slow-blow (12V line). Do not swap them.
11. **Soil sensor conformal coating:** Apply KokoCoat to the soil moisture sensor's PCB (the NE555 IC and SMD components area). Let it cure for 24 hours before deployment in soil.

**Power-on sequence:**
1. Connect 12V adapter first. Verify LM2596 output is 5.00V on the voltmeter.
2. Connect ESP32 to VIN. Verify serial output appears on the computer (USB connected for monitoring).
3. Run `initFailSafe()` — confirm serial log shows all actuators OFF.
4. Connect 24V adapter. Verify no relay activates.
5. Begin sensor initialization and control loop testing.

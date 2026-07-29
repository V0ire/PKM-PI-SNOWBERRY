# Snowberry Rev B — EasyEDA-Style Schematic Package

**Document status:** `CONCEPTUAL SCHEMATIC — AUDIT CANDIDATE`  
**Schematic revision:** B0  
**Image:** `hardware/schematic/SNOWBERRY_REV_B_EASYEDA.svg`  
**Raster preview:** `hardware/schematic/SNOWBERRY_REV_B_EASYEDA.png`

> CONCEPTUAL SCHEMATIC — Verify all component pinouts, electrical ratings, footprints, protection requirements, and physical wiring against manufacturer datasheets and physical measurements before fabrication or deployment.

## 1. Design Summary

### Block A — Logic input, regulation, and distribution

`J1` accepts the dedicated 12 V / 1 A logic adapter. `F1` is a source-side logic fuse whose final rating remains TBD. `U1` is the existing LM2596 step-down module, adjusted to 5.00 V before connecting loads. `C1` provides 470 µF bulk support and `C2` provides 100 nF high-frequency decoupling. `JP1` disconnects external 5 V from the ESP32 during USB-only programming. `C3` provides local 100 nF decoupling at ESP32 VIN.

Reverse-polarity protection and input surge protection are not silently invented: their topology and ratings remain `UNVERIFIED/TBD` because the exact jack, adapter, and available parts have not been identified.

### Block B — ESP32 controller and safe output bias

`U2` is an ESP32 DevKitC V4 / ESP32-WROOM-32D-class module block. Its physical header pin numbers are `UNVERIFIED`; GPIO names are the approved logical connections. Seven active-HIGH control outputs each have a 10 kΩ pulldown (`R1–R7`) so the receiving input defaults LOW/OFF while the ESP32 is high-impedance, resetting, or absent.

GPIO assignment:

- GPIO16: growlight SSR channel 1.
- GPIO25: spare SSR channel 2; firmware always LOW.
- GPIO17: pump relay.
- GPIO18/19: mist 1/fan 1 relay module A.
- GPIO23/32: mist 2/fan 2 relay module B.
- GPIO21/22: I²C SDA/SCL.
- GPIO34: soil ADC.
- GPIO33: calibration button.
- GPIO35: unused.

Firmware must write LOW before setting each control GPIO to OUTPUT.

### Block C — Sensors and local input

`J2` connects SHT30; `J3` connects BH1750. Both operate from 3.3 V and share GPIO21/GPIO22. `R8` and `R9` are 4.7 kΩ I²C pullups marked `DNP pending measurement`, because the breakout boards may already contain pullups.

`J4` connects the capacitive soil sensor. `R10` (1 kΩ) and `C4` (100 nF) form the approved ADC input filter. `SW1` is a normally-open calibration button from GPIO33 to logic ground.

### Block D — Mechanical relay control modules

`K1` is the fixed active-HIGH one-channel pump relay module. `K2` and `K3` are selectable two-channel relay modules configured HIGH-trigger. Exact header order, JD-VCC arrangement, relay contact ratings, and physical pin numbers remain `UNVERIFIED`.

- K1: pump.
- K2 channel 1: mist 1; channel 2: fan 1.
- K3 channel 1: mist 2; channel 2: fan 2.

The owner reports visible suppression diodes on K2/K3. Their actual connection across the relay coil/driver must be confirmed. K1 has no visible suppression diode; do not add a diode across module VCC/GND. If its coil truly lacks suppression, add a diode directly across the identified coil terminals.

### Block E — Independent high-current DC load domains

Each actuator adapter remains an isolated two-wire domain. Positive is switched through a branch fuse and relay COM/NO contact. Negative returns directly to the same adapter. NC contacts are unused. Actuator adapter negatives are not tied to logic ground.

`F2–F6` are branch fuses with values/types `TBD` after measuring load current and checking relay, connector, and conductor ratings. The 12 V / 8 A pump adapter rating is adapter capacity, not pump current or fuse value.

`D1` is a pump-load flyback diode marked `DNP/TBD`. It is fitted only if the pump is confirmed to be a fixed-polarity brushed DC motor; cathode to pump positive and anode to pump negative.

No generic flyback diode is placed across brushless fans or ultrasonic mist makers.

### Block F — SSR control and isolated AC box

`K4` is a two-channel AC SSR module located in a separate commercial electrical junction box. Its exact input header, internal SSR part, load-terminal pairing, current/thermal rating, and control VCC requirement are `UNVERIFIED`.

- GPIO16 commands SSR IN1.
- GPIO25 commands IN2 but firmware keeps it LOW and channel 2 remains unloaded.
- No flyback diode is used on the AC output.
- `F7` AC branch-fuse value/type remains TBD.
- Live is switched; Neutral and protective Earth pass directly where required.
- SSR OFF is not service isolation.

### Power flow

```text
12 V logic adapter → F1 → LM2596 → +5V_LOGIC → ESP32 + relay/SSR control sides
ESP32 3V3 → sensors and I²C pullups
Independent actuator adapters → F2–F6 → relay dry contacts → DC loads
AC Live → F7 → SSR channel 1 → growlight Live
```

### Signal and control flow

```text
SHT30/BH1750/soil → ESP32 validation → local state machines → safety priority
→ active-HIGH GPIOs → relay/SSR module inputs → independently powered loads
```

## 2. Assumption and Verification Table

| Item | Status | Required verification |
|---|---|---|
| ESP32 GPIO logical assignment | PROPOSED | Confirm exact DevKit module/board and exposed header labels |
| GPIO16/17/18/19/23/25/32 usable and non-strapping | VERIFIED for classic ESP32-WROOM-32D architecture; board still UNVERIFIED | Exact board photo and board-specific schematic |
| GPIO33 calibration button | PROPOSED | Confirm pin is exposed on exact board; boot/reset test |
| Seven 10 kΩ pulldowns | APPROVED | Measure each module input with pulldown, ESP32 present/absent |
| LM2596 input/output pin order | UNVERIFIED | Module label/photo and continuity/voltage measurement |
| LM2596 5 V current and thermal margin | UNVERIFIED | All-relays-on current, Wi-Fi transient, loaded voltage and temperature |
| Logic adapter 12 V / 1 A label | REPORTED | Label photo, polarity, no-load and loaded measurement |
| F1 logic fuse | UNVERIFIED/TBD | Current measurement, wire/connector limits, DC fuse datasheet |
| Reverse-polarity protection | UNVERIFIED/TBD | Select topology/part from actual input and available BOM |
| Input surge protection | UNVERIFIED/TBD | Determine environment and available protection component |
| C1 470 µF / 25 V | APPROVED | Verify polarity, ESR/condition, physical placement |
| C2/C3 100 nF | APPROVED | Verify placement and existing module decoupling |
| SHT30 connector pin order | UNVERIFIED | Exact breakout front/back photo and label |
| BH1750 connector pin order/ADDR | UNVERIFIED | Exact breakout front/back photo and resistance/continuity test |
| 4.7 kΩ I²C pullups R8/R9 | DNP PENDING MEASUREMENT | Powered-off SDA/SCL resistance to 3V3 with final modules |
| Soil sensor 3.3 V compatibility | UNVERIFIED | Exact board photo; measure maximum AOUT while powered at 3.3 V |
| Soil 1 kΩ + 100 nF filter | APPROVED/PROPOSED | Compare direct and filtered readings; verify settling |
| K1 one-channel relay header and coil circuit | UNVERIFIED | Front/back photo, labels, circuit trace, input-current measurement |
| K1 coil suppression | UNVERIFIED | Trace coil/driver; identify diode or add across coil only if absent |
| K2/K3 two-channel headers/JD-VCC | UNVERIFIED | Photos, labels, continuity, module documentation |
| K2/K3 visible diodes protect coils | UNVERIFIED | Identify marking/orientation and continuity to coil/driver |
| All mechanical inputs 0 V OFF / 3.3 V ON | REPORTED | Test all five channels with pulldowns, 100 transitions, no chatter |
| Mechanical contacts are isolated dry contacts | UNVERIFIED | Powered-off continuity between control and COM/NO/NC |
| Relay DC contact/terminal ratings | UNVERIFIED | Relay-can markings and module terminal/trace ratings |
| Pump adapter 12 V / 8 A label | REPORTED | Label/polarity/loaded voltage; this is not load current |
| Mist adapters 24 V / 650 mA context | REPORTED | Labels, polarity, load current, loaded voltage |
| Fan adapters 24 V / 1 A context | REPORTED | Labels, polarity, startup/current measurement |
| F2–F6 branch fuses | UNVERIFIED/TBD | Measured current, relay/contact, connector, wire, fuse curves |
| Pump D1 flyback diode | DNP/TBD | Confirm fixed-polarity brushed motor and measured current |
| Fan/mist suppression | UNVERIFIED | Load documentation or observed transient; no generic diode |
| K4 SSR exact module/internal part | UNVERIFIED | Front/back labels and manufacturer datasheet |
| K4 input VCC and 3.3 V compatibility | UNVERIFIED | Pin-label photo and 0/3.3 V input test |
| K4 AC terminal pairing | UNVERIFIED | Label photo and continuity/module datasheet |
| Growlight below 100 W | REPORTED | Measure actual RMS/startup current and load type |
| F7 AC fuse | UNVERIFIED/TBD | Actual current/inrush, SSR, wire, connector and fuse rating |
| Protective Earth requirement | UNVERIFIED | Growlight/equipment class and physical connector labels |
| USB/external 5 V isolation JP1 | PROPOSED | Exact DevKit power-path review and backfeed measurement |
| Controller is ready for fabrication/deployment | NOT VERIFIED | Complete physical verification record and independent review |

## 3. Connection Table

The table uses proposed harness pin numbers. Module-side physical pin numbers remain `UNVERIFIED`; named terminal functions must be mapped from physical labels before wiring.

| From | Pin | Net | To | Pin |
|---|---:|---|---|---:|
| J1 LOGIC IN | 1 | `+12V_LOGIC_RAW` | F1 | 1 |
| F1 | 2 | `+12V_LOGIC_FUSED` | U1 LM2596 | `IN+` UNVERIFIED |
| J1 LOGIC IN | 2 | `LOGIC_GND` | U1 LM2596 | `IN-` UNVERIFIED |
| U1 LM2596 | `OUT+` UNVERIFIED | `+5V_LOGIC` | C1 | `+` |
| U1 LM2596 | `OUT-` UNVERIFIED | `LOGIC_GND` | C1 | `-` |
| `+5V_LOGIC` | — | `+5V_LOGIC` | C2 | 1 |
| C2 | 2 | `LOGIC_GND` | logic ground | — |
| `+5V_LOGIC` | — | `+5V_LOGIC` | JP1 | 1 |
| JP1 | 2 | `ESP32_VIN` | U2 ESP32 | `VIN/5V` UNVERIFIED |
| U2 ESP32 | GND UNVERIFIED | `LOGIC_GND` | logic ground | — |
| `ESP32_VIN` | — | `ESP32_VIN` | C3 | 1 |
| C3 | 2 | `LOGIC_GND` | logic ground | — |
| U2 ESP32 | `3V3` UNVERIFIED | `+3V3` | J2 SHT30 | 1 |
| logic ground | — | `LOGIC_GND` | J2 SHT30 | 2 |
| U2 ESP32 | GPIO21 | `I2C_SDA` | J2 SHT30 | 3 |
| U2 ESP32 | GPIO22 | `I2C_SCL` | J2 SHT30 | 4 |
| `+3V3` | — | `+3V3` | J3 BH1750 | 1 |
| logic ground | — | `LOGIC_GND` | J3 BH1750 | 2 |
| U2 ESP32 | GPIO21 | `I2C_SDA` | J3 BH1750 | 3 |
| U2 ESP32 | GPIO22 | `I2C_SCL` | J3 BH1750 | 4 |
| `+3V3` | — | `+3V3` | R8 DNP | 1 |
| R8 DNP | 2 | `I2C_SDA` | U2 ESP32 | GPIO21 |
| `+3V3` | — | `+3V3` | R9 DNP | 1 |
| R9 DNP | 2 | `I2C_SCL` | U2 ESP32 | GPIO22 |
| `+3V3` | — | `+3V3` | J4 SOIL | 1 |
| logic ground | — | `LOGIC_GND` | J4 SOIL | 2 |
| J4 SOIL | 3 | `SOIL_AOUT_RAW` | R10 | 1 |
| R10 | 2 | `SOIL_ADC` | U2 ESP32 | GPIO34 |
| `SOIL_ADC` | — | `SOIL_ADC` | C4 | 1 |
| C4 | 2 | `LOGIC_GND` | logic ground | — |
| U2 ESP32 | GPIO33 | `CAL_BUTTON` | SW1 | 1 |
| SW1 | 2 | `LOGIC_GND` | logic ground | — |
| U2 ESP32 | GPIO16 | `CTRL_GROWLIGHT` | K4 SSR module | `IN1` UNVERIFIED |
| U2 ESP32 | GPIO16 | `CTRL_GROWLIGHT` | R1 | 1 |
| R1 | 2 | `LOGIC_GND` | logic ground | — |
| U2 ESP32 | GPIO25 | `CTRL_SSR_SPARE` | K4 SSR module | `IN2` UNVERIFIED |
| U2 ESP32 | GPIO25 | `CTRL_SSR_SPARE` | R2 | 1 |
| R2 | 2 | `LOGIC_GND` | logic ground | — |
| U2 ESP32 | GPIO17 | `CTRL_PUMP` | K1 pump relay | `IN` UNVERIFIED |
| U2 ESP32 | GPIO17 | `CTRL_PUMP` | R3 | 1 |
| R3 | 2 | `LOGIC_GND` | logic ground | — |
| U2 ESP32 | GPIO18 | `CTRL_MIST_1` | K2 relay A | `IN1` UNVERIFIED |
| U2 ESP32 | GPIO18 | `CTRL_MIST_1` | R4 | 1 |
| R4 | 2 | `LOGIC_GND` | logic ground | — |
| U2 ESP32 | GPIO19 | `CTRL_FAN_1` | K2 relay A | `IN2` UNVERIFIED |
| U2 ESP32 | GPIO19 | `CTRL_FAN_1` | R5 | 1 |
| R5 | 2 | `LOGIC_GND` | logic ground | — |
| U2 ESP32 | GPIO23 | `CTRL_MIST_2` | K3 relay B | `IN1` UNVERIFIED |
| U2 ESP32 | GPIO23 | `CTRL_MIST_2` | R6 | 1 |
| R6 | 2 | `LOGIC_GND` | logic ground | — |
| U2 ESP32 | GPIO32 | `CTRL_FAN_2` | K3 relay B | `IN2` UNVERIFIED |
| U2 ESP32 | GPIO32 | `CTRL_FAN_2` | R7 | 1 |
| R7 | 2 | `LOGIC_GND` | logic ground | — |
| `+5V_LOGIC` | — | `+5V_LOGIC` | K1 pump relay | `VCC` UNVERIFIED |
| `LOGIC_GND` | — | `LOGIC_GND` | K1 pump relay | `GND` UNVERIFIED |
| `+5V_LOGIC` | — | `+5V_LOGIC` | K2 relay A | supply header UNVERIFIED |
| `LOGIC_GND` | — | `LOGIC_GND` | K2 relay A | control GND UNVERIFIED |
| `+5V_LOGIC` | — | `+5V_LOGIC` | K3 relay B | supply header UNVERIFIED |
| `LOGIC_GND` | — | `LOGIC_GND` | K3 relay B | control GND UNVERIFIED |
| `+5V_LOGIC` | — | `SSR_CTRL_VCC?` | K4 SSR | VCC UNVERIFIED, if required |
| `LOGIC_GND` | — | `LOGIC_GND` | K4 SSR | GND UNVERIFIED |
| J10 PUMP ADAPTER | 1 | `PUMP_12V_POS` | F2 | 1 |
| F2 | 2 | `PUMP_12V_FUSED` | K1 | COM UNVERIFIED |
| K1 | NO UNVERIFIED | `PUMP_SW_POS` | J11 PUMP OUT | 1 |
| J10 PUMP ADAPTER | 2 | `PUMP_12V_NEG` | J11 PUMP OUT | 2 |
| J11 PUMP OUT | 1 | `PUMP_SW_POS` | D1 DNP/TBD | cathode, if fitted |
| J11 PUMP OUT | 2 | `PUMP_12V_NEG` | D1 DNP/TBD | anode, if fitted |
| J12 MIST1 ADAPTER | 1 | `MIST1_24V_POS` | F3 | 1 |
| F3 | 2 | `MIST1_24V_FUSED` | K2 channel 1 | COM1 UNVERIFIED |
| K2 channel 1 | NO1 UNVERIFIED | `MIST1_SW_POS` | J13 MIST1 OUT | 1 |
| J12 MIST1 ADAPTER | 2 | `MIST1_24V_NEG` | J13 MIST1 OUT | 2 |
| J14 FAN1 ADAPTER | 1 | `FAN1_24V_POS` | F4 | 1 |
| F4 | 2 | `FAN1_24V_FUSED` | K2 channel 2 | COM2 UNVERIFIED |
| K2 channel 2 | NO2 UNVERIFIED | `FAN1_SW_POS` | J15 FAN1 OUT | 1 |
| J14 FAN1 ADAPTER | 2 | `FAN1_24V_NEG` | J15 FAN1 OUT | 2 |
| J16 MIST2 ADAPTER | 1 | `MIST2_24V_POS` | F5 | 1 |
| F5 | 2 | `MIST2_24V_FUSED` | K3 channel 1 | COM1 UNVERIFIED |
| K3 channel 1 | NO1 UNVERIFIED | `MIST2_SW_POS` | J17 MIST2 OUT | 1 |
| J16 MIST2 ADAPTER | 2 | `MIST2_24V_NEG` | J17 MIST2 OUT | 2 |
| J18 FAN2 ADAPTER | 1 | `FAN2_24V_POS` | F6 | 1 |
| F6 | 2 | `FAN2_24V_FUSED` | K3 channel 2 | COM2 UNVERIFIED |
| K3 channel 2 | NO2 UNVERIFIED | `FAN2_SW_POS` | J19 FAN2 OUT | 1 |
| J18 FAN2 ADAPTER | 2 | `FAN2_24V_NEG` | J19 FAN2 OUT | 2 |
| J20 AC IN | L | `AC_LIVE_IN` | F7 | 1 |
| F7 | 2 | `AC_LIVE_FUSED` | K4 SSR channel 1 | load A UNVERIFIED |
| K4 SSR channel 1 | load B UNVERIFIED | `GROWLIGHT_LIVE_SW` | J21 GROWLIGHT OUT | L |
| J20 AC IN | N | `AC_NEUTRAL` | J21 GROWLIGHT OUT | N |
| J20 AC IN | PE | `PROTECTIVE_EARTH` | J21 GROWLIGHT OUT | PE |
| K4 SSR channel 2 | load A/B UNVERIFIED | `NC / COVERED` | no load | — |

## 4. Bill of Materials

| RefDes | Quantity | Component | Value / Part Number | Rating | Notes |
|---|---:|---|---|---|---|
| J1 | 1 | Logic input connector | 2-pin, exact part TBD | ≥12 V, ≥measured logic current | Pin 1 +12 V; pin 2 0 V |
| F1 | 1 | Logic branch fuse + holder | TBD | DC rated | Select after all-coils/Wi-Fi measurement |
| U1 | 1 | Step-down module | LM2596 adjustable module, exact board UNVERIFIED | 12 V input; 5.00 V output; current/thermal TBD | Verify pin order and loaded performance |
| C1 | 1 | Electrolytic capacitor | 470 µF | 25 V | + to +5V_LOGIC |
| C2 | 1 | Ceramic capacitor | 100 nF | ≥16 V | At LM2596 output |
| JP1 | 1 | Removable jumper/header | 2-pin | ≥5 V, logic current | External ESP32 power isolation |
| U2 | 1 | Development board | ESP32 DevKitC V4 / WROOM-32D-class, exact board UNVERIFIED | 3.3 V GPIO; VIN path UNVERIFIED | Physical header pin numbers TBD |
| C3 | 1 | Ceramic capacitor | 100 nF | ≥16 V | Near ESP32 VIN |
| R1–R7 | 7 | Resistor | 10 kΩ | 0.125 W or greater | Active-HIGH output pulldowns |
| J2 | 1 | SHT30 connector | 4-pin keyed connector, exact part TBD | 3.3 V | 1=3V3, 2=GND, 3=SDA, 4=SCL |
| J3 | 1 | BH1750 connector | 4-pin keyed connector, exact part TBD | 3.3 V | 1=3V3, 2=GND, 3=SDA, 4=SCL |
| R8–R9 | 2 | I²C pullup resistor | 4.7 kΩ | 0.125 W | DNP pending module resistance measurement |
| J4 | 1 | Soil-sensor connector | 3-pin keyed connector, exact part TBD | 3.3 V | 1=3V3, 2=GND, 3=AOUT |
| R10 | 1 | Resistor | 1 kΩ | 0.125 W | Soil ADC series filter |
| C4 | 1 | Ceramic capacitor | 100 nF | ≥10 V | GPIO34 to logic GND |
| SW1 | 1 | Normally-open momentary button | Exact part TBD | Logic signal | GPIO33 calibration input |
| K1 | 1 | Active-HIGH one-channel relay module | Exact module UNVERIFIED | 5 V control presumed; contacts TBD | Pump; coil diode not visibly identified |
| K2 | 1 | Selectable two-channel relay module | Exact module UNVERIFIED | 5 V control presumed; contacts TBD | HIGH trigger; mist 1 + fan 1; visible diode(s) unverified |
| K3 | 1 | Selectable two-channel relay module | Exact module UNVERIFIED | 5 V control presumed; contacts TBD | HIGH trigger; mist 2 + fan 2; visible diode(s) unverified |
| K4 | 1 | Two-channel AC SSR module | Exact module/internal part UNVERIFIED | Input/output/current/thermal TBD | Separate commercial electrical box |
| F2–F6 | 5 | DC branch fuse + holder | TBD individually | DC voltage/breaking capacity TBD | Pump, mist 1, fan 1, mist 2, fan 2 |
| D1 | 1 DNP | Pump-load flyback diode | Part/rating TBD | From measured pump current | Fit only for fixed-polarity brushed DC pump |
| F7 | 1 | AC growlight fuse + holder | TBD | Mains rated; breaking capacity TBD | Select from load/SSR/wire evidence |
| J10–J19 | 10 | DC adapter/load connectors | 2-pin, exact parts TBD | Voltage/current per branch | Polarity clearly marked |
| J20–J21 | 2 | AC input/output connectors | L/N/PE, exact parts TBD | Mains rated | Touch-safe, separate AC box |
| TP1 | 1 | Test point | `LOGIC_GND` | — | Reference |
| TP2 | 1 | Test point | `+12V_LOGIC_FUSED` | ≥12 V | Logic input rail |
| TP3 | 1 | Test point | `+5V_LOGIC` | ≥5 V | Regulated logic rail |
| TP4 | 1 | Test point | `+3V3` | ≥3.3 V | Sensor rail |
| TP5–TP11 | 7 | Test points | Seven control nets | 3.3 V | Output validation |
| TP12–TP14 | 3 | Test points | SDA, SCL, SOIL_ADC | 3.3 V | Sensor debugging |

## 5. Validation Warning

> CONCEPTUAL SCHEMATIC — Verify all component pinouts, electrical ratings, footprints, protection requirements, and physical wiring against manufacturer datasheets and physical measurements before fabrication or deployment.

This schematic is intentionally not labeled production-ready. Exact module pinouts, fuse values, relay-contact ratings, pump suppression, SSR identity/terminal pairing, AC protection, connector ratings, and external cable ratings remain unresolved until recorded physical evidence exists.

# Snowberry Rev B Physical Verification Record

**Status:** `EMPTY EVIDENCE TEMPLATE — NOT AN APPROVAL`  
**Unit ID:** `snowberry-001`  
**Revision:** B0 candidate  
**Firmware commit/version:** TBD  
**Tester/date:** TBD

Every unchecked or `TBD` item is unresolved. Do not interpret this template as a completed test record.

Use measured values and photos. Do not write “pass” from memory.

## A. Module Identification

| Item | Manufacturer/model/marking | Header labels/order | Dimensions | Photo/ref | Result |
|---|---|---|---|---|---|
| ESP32 DevKitC | TBD | TBD | TBD | TBD | [ ] |
| Fixed pump relay | TBD | TBD | TBD | TBD | [ ] |
| Two-channel relay A | TBD | TBD | TBD | TBD | [ ] |
| Two-channel relay B | TBD | TBD | TBD | TBD | [ ] |
| Two-channel SSR | TBD | TBD | TBD | TBD | [ ] |
| LM2596 module | TBD | TBD | TBD | TBD | [ ] |
| SHT30 | TBD | TBD | TBD | TBD | [ ] |
| BH1750 | TBD | TBD | TBD | TBD | [ ] |
| Soil sensor | TBD | TBD | TBD | TBD | [ ] |

## B. Relay Input Characterization

Configure both channels on relay modules A and B to HIGH-trigger. Keep COM/NO/NC unloaded.

| Channel | 0 V result | 3.3 V result | Input LOW V | Input HIGH V | 100 transitions clean | 10 kΩ pulldown tested | Result |
|---|---|---|---:|---:|---|---|---|
| Pump | TBD | TBD | TBD | TBD | [ ] | [ ] | [ ] |
| Mist 1 | TBD | TBD | TBD | TBD | [ ] | [ ] | [ ] |
| Fan 1 | TBD | TBD | TBD | TBD | [ ] | [ ] | [ ] |
| Mist 2 | TBD | TBD | TBD | TBD | [ ] | [ ] | [ ] |
| Fan 2 | TBD | TBD | TBD | TBD | [ ] | [ ] | [ ] |

For each channel confirm:

- OFF: COM–NC continuity and COM–NO open.
- ON: COM–NO continuity and COM–NC open.
- No chatter or repeated click.

## C. SSR Identification and Control

| Check | Measurement/evidence | Result |
|---|---|---|
| Exact part/module marking | TBD | [ ] |
| Control header VCC/GND/IN1/IN2 order | TBD | [ ] |
| Channel-to-load-terminal pairing | TBD | [ ] |
| IN1 0 V = OFF | TBD | [ ] |
| IN1 3.3 V = ON | TBD | [ ] |
| IN2 0 V = OFF | TBD | [ ] |
| IN2 3.3 V = ON | TBD | [ ] |
| Channel 2 terminals covered/unloaded | TBD | [ ] |
| Actual growlight current and SSR temperature | TBD | [ ] |

## D. Adapter and Load Register

| Branch | Adapter label | Measured polarity | No-load V | Loaded V | Load label | Running A | Start A | Cable | Connector rating | Result |
|---|---|---|---:|---:|---|---:|---:|---|---|---|
| Logic | 12 V/1 A | TBD | TBD | TBD | logic | TBD | TBD | TBD | TBD | [ ] |
| Pump | 12 V/8 A adapter rating | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | [ ] |
| Mist 1 | 24 V/650 mA context | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | [ ] |
| Mist 2 | 24 V/650 mA context | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | [ ] |
| Fan 1 | 24 V/1 A context | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | [ ] |
| Fan 2 | 24 V/1 A context | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | [ ] |
| Growlight | mains/<100 W | n/a | TBD | TBD | TBD | TBD | TBD | TBD | TBD | [ ] |

## E. Fuse and Suppression Selection

| Branch | Normal/start current evidence | Relay/contact limit | Wire/connector limit | Selected fuse/type | Suppression | Reviewer result |
|---|---|---|---|---|---|---|
| Logic | TBD | n/a | TBD | TBD | LM2596 decoupling | [ ] |
| Pump | TBD | TBD | TBD | TBD | TBD after motor-type check | [ ] |
| Mist 1 | TBD | TBD | TBD | TBD | no generic diode | [ ] |
| Mist 2 | TBD | TBD | TBD | TBD | no generic diode | [ ] |
| Fan 1 | TBD | TBD | TBD | TBD | per fan documentation | [ ] |
| Fan 2 | TBD | TBD | TBD | TBD | per fan documentation | [ ] |
| Growlight | TBD | TBD | TBD | TBD | SSR/AC design; no flyback diode | [ ] |

### Relay-coil suppression inspection

| Module | Visual observation | Confirmed across coil/driver | Marking/orientation | Action | Result |
|---|---|---|---|---|---|
| Pump 1-channel relay | no diode visibly identified | TBD | TBD | trace circuit; add coil diode only if truly absent | [ ] |
| Relay module A, 2-channel | visible diode(s) reported | TBD | TBD | no duplicate diode if confirmed | [ ] |
| Relay module B, 2-channel | visible diode(s) reported | TBD | TBD | no duplicate diode if confirmed | [ ] |
| SSR, 2-channel | no AC flyback diode expected | n/a | n/a | no flyback diode on AC output | [ ] |

## F. Logic Rail

| Check | Expected | Measured | Result |
|---|---:|---:|---|
| LM2596 before load | 5.00 V | TBD | [ ] |
| LM2596 all relay coils ON | 4.8–5.1 V | TBD | [ ] |
| Logic adapter current all coils ON + Wi-Fi | < adapter/connector/fuse limit | TBD | [ ] |
| ESP32 3V3 | near 3.3 V | TBD | [ ] |
| +5V to GND resistance before power | no short | TBD | [ ] |
| USB/external-power jumper behavior | no backfeed | TBD | [ ] |

## G. Sensors

| Check | Evidence | Result |
|---|---|---|
| SHT30 detected at 0x44 | TBD | [ ] |
| BH1750 detected at 0x23 | TBD | [ ] |
| Powered-off SDA effective pullup | TBD Ω | [ ] |
| Powered-off SCL effective pullup | TBD Ω | [ ] |
| Soil AOUT maximum at 3.3 V supply | TBD V | [ ] |
| Soil filter comparison direct vs filtered | TBD | [ ] |
| Substrate dry ADC | TBD | [ ] |
| Substrate wet ADC | TBD | [ ] |

## H. Boot and Channel Isolation

| Test | Count/result | Evidence | Pass |
|---|---|---|---|
| Cold power cycles, all outputs OFF | 0/20 | TBD | [ ] |
| ESP32 reset cycles, all outputs OFF | 0/20 | TBD | [ ] |
| ESP32 removed, powered relay controls OFF | TBD | TBD | [ ] |
| Pump command toggles pump only | TBD | TBD | [ ] |
| Humidifier command toggles all four only | TBD | TBD | [ ] |
| Growlight command toggles SSR1 only | TBD | TBD | [ ] |
| SSR2 always OFF | TBD | TBD | [ ] |

## I. Functional Safety Tests

| Scenario | Expected | Actual | Pass |
|---|---|---|---|
| SHT30 disconnected | all four humidifier relays OFF | TBD | [ ] |
| BH1750 disconnected | growlight SSR1 OFF | TBD | [ ] |
| Soil disconnected/uncalibrated | pump OFF; manual rejected | TBD | [ ] |
| Wi-Fi/router unavailable | local AUTO continues | TBD | [ ] |
| Firebase unavailable | local AUTO continues; remote unavailable | TBD | [ ] |
| Manual growlight expiry | returns AUTO at ≤30 min | TBD | [ ] |
| Manual humidifier expiry | returns AUTO at ≤30 min | TBD | [ ] |
| Manual pump | one 10 s pulse only | TBD | [ ] |
| Pump soak | no restart for 10 min | TBD | [ ] |
| Pump budget | third start within 5 h blocked | TBD | [ ] |
| Reboot pump budget | cannot bypass cap | TBD | [ ] |

## J. Matrix Board Inspection

- [ ] Front photo recorded.
- [ ] Rear/solder-side photo recorded.
- [ ] No load current routed through thin matrix-board strips.
- [ ] No AC on matrix board.
- [ ] ESP32 is socketed/removable.
- [ ] GPIO pulldowns measure approximately 10 kΩ.
- [ ] Every connector is keyed or unambiguously labeled.
- [ ] Test points labeled: GND, 5V, 3V3, SDA, SCL, soil, seven outputs.
- [ ] No exposed whiskers, solder bridges, or loose strands.

## K. Enclosure and Installation

- [ ] Matrix board mounted on spacers.
- [ ] Relay tray mechanically secured.
- [ ] SSR/AC section partitioned and covered.
- [ ] All cable entries downward.
- [ ] Drip loops present.
- [ ] Strain relief on every external cable.
- [ ] Six adapters/power strip in separate covered ventilated dry box.
- [ ] Backplate spans two bamboo members and cannot rotate.
- [ ] PLA+ kept out of direct sun/high-heat location.
- [ ] Master disconnect accessible.

## L. Final Disposition

- [ ] `PASS — eligible for unattended actuator deployment`
- [ ] `MONITOR ONLY — actuator deployment blocked`
- [ ] `FAIL — do not install`

**Open blockers:**

1. TBD
2. TBD
3. TBD

**Reviewer name/date:** TBD

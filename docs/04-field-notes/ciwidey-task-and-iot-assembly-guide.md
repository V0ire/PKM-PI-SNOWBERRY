# Ciwidey Task Plan and Sensor-Only IoT Assembly Guide — Snowberry

## Purpose

Prepare a safe sensor-only Snowberry prototype today, then use it tomorrow in Ciwidey to collect baseline data and cable layout measurements.

This guide intentionally avoids final actuator wiring. The lazy safe path is: measure first, design EasyEDA later.

---

## What Success Looks Like Tomorrow

By the end of the Ciwidey visit, you should have:

- Greenhouse sketch with real dimensions.
- Candidate IoT box location.
- Candidate sensor and actuator locations.
- Air baseline: temperature and humidity.
- Light baseline: lux.
- Soil baseline: wet, dry if possible, and normal field raw ADC.
- Power source map and measured voltages.
- Cable length schedule with 20-30% slack.
- Photo evidence for every important location.
- List of risks before PCB/EasyEDA design.

Do not try to solve everything tomorrow. Tomorrow is measurement day.

---

## Today Plan

### Minimum Plan: 3-5 Hours

| Step | Task | Time Estimate | Done |
|---|---|---:|---|
| 1 | Print or save measurement checklist | 30 min | [ ] |
| 2 | Assemble ESP32 sensor-only prototype | 1-2 h | [ ] |
| 3 | Upload simple sensor-reading firmware | 1-2 h | [ ] |
| 4 | Test all readings at home | 30-60 min | [ ] |
| 5 | Label wires and pack tools | 30 min | [ ] |

### Optional Plan: +1-2 Hours

| Step | Task | Time Estimate | Done |
|---|---|---:|---|
| 6 | Bench-test relay/SSR with LED only, no real load | 1 h | [ ] |
| 7 | Prepare photo numbering system | 15 min | [ ] |
| 8 | Prepare blank greenhouse sketch sheet | 15 min | [ ] |

### Do Not Do Today Unless Already Tested

- [ ] Do not wire permanent 220VAC growlight switching.
- [ ] Do not connect pump/mist/fan as final field loads.
- [ ] Do not design final PCB before tomorrow's measurements.
- [ ] Do not cut final cable lengths before route measurement.

---

## Sensor-Only IoT Prototype

### Components Needed

- ESP32 DevKitC V4 / WROOM-32D
- SHT30-D temperature/humidity sensor
- BH1750 / GY-302 light sensor
- Capacitive Soil Moisture Sensor V2.0
- USB cable / power bank
- Breadboard
- Jumper wires
- Optional: plastic box/bag for field protection

### Pin Map

| Component | ESP32 Pin | Notes |
|---|---|---|
| SHT30 SDA | GPIO21 | I2C SDA |
| SHT30 SCL | GPIO22 | I2C SCL |
| BH1750 SDA | GPIO21 | same I2C bus |
| BH1750 SCL | GPIO22 | same I2C bus |
| Soil analog output | GPIO34 | ADC1, safe with WiFi |
| Sensor VCC | 3V3 preferred | keep logic safe |
| Sensor GND | GND | common ground |

Do not use GPIO 6-11. Avoid GPIO 0, 2, 5, 12, 15 for field wiring.

---

## Assembly Steps

### 1. Power Off First

- [ ] ESP32 disconnected from USB.
- [ ] No adapter connected.
- [ ] No pump, fan, mist disc, or growlight connected.

### 2. Wire I2C Sensors

SHT30:

- [ ] SHT30 VCC → ESP32 3V3
- [ ] SHT30 GND → ESP32 GND
- [ ] SHT30 SDA → ESP32 GPIO21
- [ ] SHT30 SCL → ESP32 GPIO22

BH1750:

- [ ] BH1750 VCC → ESP32 3V3
- [ ] BH1750 GND → ESP32 GND
- [ ] BH1750 SDA → ESP32 GPIO21
- [ ] BH1750 SCL → ESP32 GPIO22
- [ ] BH1750 ADDR left default / GND if needed for address 0x23

### 3. Wire Soil Sensor

- [ ] Soil sensor VCC → ESP32 3V3
- [ ] Soil sensor GND → ESP32 GND
- [ ] Soil sensor analog output → ESP32 GPIO34

Note: if your soil module only works correctly at 5V, test carefully because analog output must stay within ESP32 ADC safe range. Preferred field baseline test: 3.3V sensor power.

### 4. Cable Protection for Field

- [ ] Keep ESP32 and breadboard inside a dry plastic box/bag.
- [ ] Let only sensor probes extend outside.
- [ ] Add tape strain relief so jumper wires do not pull loose.
- [ ] Label SHT30, BH1750, Soil, 3V3, GND.

---

## Pre-Power Checklist

Before plugging in USB:

- [ ] No wire from 3V3 to GND.
- [ ] SHT30 and BH1750 share GPIO21/GPIO22 correctly.
- [ ] Soil analog goes to GPIO34, not GPIO35/ADC2/random pin.
- [ ] All grounds are common.
- [ ] No actuator load connected.
- [ ] Electronics are dry.

Then:

- [ ] Plug ESP32 into USB.
- [ ] Confirm ESP32 boots.
- [ ] Open Serial Monitor.
- [ ] Confirm SHT30 reading appears.
- [ ] Confirm BH1750 lux reading appears.
- [ ] Confirm soil raw ADC changes when sensor moves between air/wet media.

---

## Simple Firmware Behavior Needed

The field firmware only needs to print values repeatedly.

Minimum output every 2-5 seconds:

```text
TEMP_C=24.8 RH=82.4 LUX=1850 SOIL_ADC=1875
```

Nice-to-have output:

```text
POINT=A3 TEMP_C=24.8 RH=82.4 LUX=1850 SOIL_ADC=1875 STABLE=YES
```

Do not require Firebase tomorrow. Local serial readings are enough for baseline.

---

## Tomorrow Field Procedure

### Phase 1 — Arrival and Safety Scan

- [ ] Ask permission before placing sensors or tape marks.
- [ ] Identify wet zones, worker paths, and power source.
- [ ] Do not open or modify permanent electrical wiring.
- [ ] Take overview photos before moving anything.

### Phase 2 — Pick IoT Box Reference Point

Choose the likely box location first.

Good location:

- dry
- reachable
- close to power
- not in direct mist
- not blocking workers
- acceptable WiFi

Mark it temporarily as:

```text
REFERENCE POINT: IOT BOX
```

All cable lengths are measured from here.

### Phase 3 — Layout Measurement

- [ ] Measure greenhouse length.
- [ ] Measure greenhouse width.
- [ ] Measure greenhouse height.
- [ ] Measure plant bed dimensions.
- [ ] Measure walkway width.
- [ ] Sketch top view.
- [ ] Mark power, water, IoT box, sensor candidates, actuator candidates.

### Phase 4 — Air Baseline

Use SHT30 at plant canopy height.

At each point:

1. Hold sensor in position.
2. Wait 1-3 minutes.
3. Record temperature and RH.
4. Take a photo of the position.
5. Write the point code in the checklist.

Measure at least:

- outside greenhouse
- entrance
- center bed
- far bed/side bed
- near mist/fan candidate
- near IoT box candidate
- hottest-looking area
- most humid-looking area

### Phase 5 — Light Baseline

Use BH1750 at plant canopy height. Point it upward.

Measure at least:

- outside greenhouse
- center bed
- side bed
- darkest-looking plant area
- brightest-looking plant area
- under candidate growlight position

Record weather and time. Light readings change a lot by cloud/time.

### Phase 6 — Soil Baseline

Use GPIO34 raw ADC.

Measure:

- fully wet/saturated media if possible
- normal field media near plants
- dry media if available
- at least one extra bed/pot sample

For each sample:

1. Insert sensor consistently.
2. Wait for reading to settle.
3. Record raw ADC.
4. Record media condition.
5. Take photo.

Do not decide final soil threshold tomorrow unless readings are repeated and stable.

### Phase 7 — Power Survey

Use multimeter only if safe.

Record:

- outlet position
- route from outlet to IoT box
- measured adapter voltages if adapters are available
- dry/safe adapter placement
- whether extension cable crosses worker path

Do not connect final actuator wiring tomorrow.

### Phase 8 — Component Position Candidates

Mark/photograph candidate locations:

- IoT box
- SHT30
- BH1750
- soil sensor
- growlight
- pump
- mist disc
- fan
- 12V adapter
- 24V adapter

For every candidate, write why it is there.

### Phase 9 — Cable Length Measurement

Measure real routed path, not direct distance.

For each route:

```text
measured route + 20-30% slack + service loop = final cable estimate
```

Recommended service loop:

- sensor cable: +0.3 to 0.5 m
- actuator cable: +0.5 to 1.0 m
- power source cable: +1.0 m if route may change

Important separation:

- Keep sensor cables away from pump motor cable.
- Keep I2C cables as short as practical.
- Keep AC/growlight path physically separated from low-voltage sensor wiring.
- Mist disc uses 24V rail, fan and pump use 12V rail.

### Phase 10 — End-of-Visit Review

Before leaving:

- [ ] Recheck checklist tables are filled.
- [ ] Recheck each photo has meaning.
- [ ] Confirm IoT box candidate location.
- [ ] Confirm biggest cable route problems.
- [ ] Confirm what data is still missing.

---

## After the Visit

Create these outputs before EasyEDA:

1. Clean greenhouse layout sketch.
2. Cable schedule table.
3. Baseline data summary.
4. Final candidate component position map.
5. Risk list.
6. Only then update schematic/PCB assumptions.

---

## Time Estimate for Full IoT Assembly

### Sensor-Only Baseline Rig

Estimated: 3-5 hours today.

Good enough for tomorrow:

- ESP32 works.
- SHT30 works.
- BH1750 works.
- Soil ADC works.
- Readings are visible locally.

### Full Actuator Prototype

Estimated: 1-2 focused days after field measurement.

Includes:

- relay/SSR wiring
- fuse placement
- 12V/24V/5V power rails
- flyback diode for pump
- fail-safe boot test
- LED load test before real load
- supervised real actuator test

### PCB / EasyEDA

Do after:

- cable paths are known
- enclosure position is known
- power location is known
- component positions are known
- breadboard wiring has been validated

Do not rush PCB before field measurements. A wrong connector position or cable assumption will cost more time than waiting one day.

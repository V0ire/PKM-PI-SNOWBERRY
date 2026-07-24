# Ciwidey Field Measurement Checklist — Snowberry

Date: ____________  Location: ____________  Team: ____________

## Mission

Collect enough site facts to design Snowberry wiring, enclosure placement, cable lengths, sensor positions, actuator positions, and baseline thresholds later.

Do not finalize PCB layout from memory. Measure the greenhouse first.

## Safety Rules

- [ ] Do not modify permanent 220VAC wiring during this visit.
- [ ] Do not run pump, mist disc, fan, or growlight automatically unless the circuit was already bench-tested.
- [ ] Keep ESP32, laptop, power bank, and breadboard away from water and mist.
- [ ] Use sensor-only prototype for baseline readings.
- [ ] Measure cable paths along the real route, not straight-line distance.
- [ ] Add 20-30% slack to every cable length.

---

## 1. Tools to Bring

- [ ] Tape measure, 5-10 m
- [ ] Multimeter
- [ ] Phone camera
- [ ] Notebook / printed checklist
- [ ] Marker tape / masking tape
- [ ] Labels or small stickers
- [ ] Power bank / USB cable
- [ ] Laptop if possible
- [ ] ESP32 sensor-only prototype
- [ ] Spare jumper wires
- [ ] Plastic box or bag to protect electronics
- [ ] Cable ties

---

## 2. Choose IoT Box Reference Point

Pick the likely ESP32/enclosure location first. All cable measurements start from this point.

Candidate IoT box location: ______________________________________

Check:

- [ ] Dry location
- [ ] Reachable by hand
- [ ] Near available power
- [ ] Protected from mist / rain / splash
- [ ] Not blocking workers
- [ ] Good enough WiFi signal
- [ ] Cable routes can be tied safely

Photo number(s): ______________________________________

---

## 3. Greenhouse Layout Measurement

Draw a rough top-view sketch on paper. Mark plant beds, walkways, power, water, and IoT box.

| Item | Measurement | Notes |
|---|---:|---|
| Greenhouse length | ____ m | |
| Greenhouse width | ____ m | |
| Greenhouse height | ____ m | |
| Plant bed count | ____ | |
| Bed length | ____ m | |
| Bed width | ____ m | |
| Walkway width | ____ m | |
| Distance: entrance to IoT box | ____ m | routed path |
| Distance: power source to IoT box | ____ m | routed path |
| Distance: water source/reservoir to pump | ____ m | routed path |

Required photos:

- [ ] Entrance view
- [ ] Full greenhouse length view
- [ ] Plant bed close-up
- [ ] Ceiling / lamp hanging area
- [ ] Power source area
- [ ] Water source / reservoir area
- [ ] Candidate IoT box location
- [ ] Candidate sensor positions
- [ ] Candidate actuator positions

---

## 4. Baseline Air Measurement

Measure air temperature and relative humidity at plant canopy height. Wait 1-3 minutes at each point before recording.

Sensor height from floor/media: ____ cm

| Point | Location Description | Temp °C | RH % | Stable? | Notes |
|---|---|---:|---:|---|---|
| A1 | Outside greenhouse | | | Y/N | |
| A2 | Near entrance | | | Y/N | |
| A3 | Center plant bed | | | Y/N | |
| A4 | Left/right side bed | | | Y/N | |
| A5 | Near fan/mist candidate | | | Y/N | |
| A6 | Near IoT box candidate | | | Y/N | |
| A7 | Hottest-looking area | | | Y/N | |
| A8 | Most humid-looking area | | | Y/N | |

Notes / observed wind / condensation / wet leaves:

__________________________________________________________________

---

## 5. Baseline Light Measurement

Measure lux at plant canopy height. Point the BH1750/light sensor upward like the plant receives light.

Measurement time: ____________  Weather: sunny / cloudy / rain / mixed

| Point | Location Description | Lux | Stable? | Shade Source / Notes |
|---|---|---:|---|---|
| L1 | Outside greenhouse | | Y/N | |
| L2 | Center plant bed | | Y/N | |
| L3 | Left/right side bed | | Y/N | |
| L4 | Under candidate growlight | | Y/N | |
| L5 | Darkest-looking plant area | | Y/N | |
| L6 | Brightest-looking plant area | | Y/N | |

Growlight candidate position:

- Height above plants: ____ cm
- Number of lamps planned: ____
- Lamp spacing estimate: ____ cm
- Cable route from IoT box / SSR to lamp: ____ m

---

## 6. Soil Moisture Baseline

Record raw ADC and condition. Do not use internet default values.

Soil sensor pin: GPIO34. Sensor powered by: 3.3V / 5V / other: ______

| Sample | Media Condition | Raw ADC | Estimated % | Stable? | Notes |
|---|---|---:|---:|---|---|
| S1 | Fully wet / saturated media | | | Y/N | wet baseline |
| S2 | Normal field media | | | Y/N | actual plant condition |
| S3 | Dry media if available | | | Y/N | dry baseline |
| S4 | Another bed sample | | | Y/N | |
| S5 | Another pot/polybag sample | | | Y/N | |

Soil calibration notes:

- Wet ADC average: ______
- Dry ADC average: ______
- Normal field ADC range: ______ to ______

---

## 7. Power Source Survey

Do not connect final loads yet. Measure and document only.

| Power Item | Location | Voltage Measured | Distance to IoT Box | Notes |
|---|---|---:|---:|---|
| 220VAC outlet | | | ____ m | protected from water? |
| 12V adapter candidate | | | ____ m | for pump/fan/LM2596 input |
| 24V adapter candidate | | | ____ m | for mist disc |
| 5V rail / USB power | | | ____ m | for ESP32 during test |

Check:

- [ ] Outlet is not exposed to water/mist
- [ ] Cable can be routed above ground or tied safely
- [ ] Adapter location can stay dry
- [ ] There is room for fuse holders/enclosure
- [ ] Extension cable route does not cross worker path unsafely

Photo number(s): ______________________________________

---

## 8. Candidate Component Positions

Mark candidate positions with tape if allowed.

| Component | Candidate Position | Height | Reason | Photo No. |
|---|---|---:|---|---|
| ESP32 / IoT box | | | dry + accessible | |
| SHT30 air temp/RH | | ____ cm | canopy-level air | |
| BH1750 light sensor | | ____ cm | plant-level light | |
| Soil moisture sensor | | ____ cm | representative media | |
| Growlight | | ____ cm | covers plant bed | |
| Pump | | | near reservoir | |
| Mist disc | | | safe from electronics | |
| Fan | | | airflow across plants | |
| 12V adapter | | | dry power area | |
| 24V adapter | | | dry power area | |

---

## 9. Cable Length Schedule

Measure the actual cable path: along wall/frame/bed route. Add slack.

Formula:

```text
final cable length = measured routed path + 20-30% slack + service loop if needed
```

| Cable Route | Signal / Power | Measured Route | Slack | Final Length | Cable Type / Notes |
|---|---|---:|---:|---:|---|
| IoT box to SHT30 | I2C signal | ____ m | ____ m | ____ m | keep short if possible |
| IoT box to BH1750 | I2C signal | ____ m | ____ m | ____ m | same I2C bus |
| IoT box to soil sensor | analog signal | ____ m | ____ m | ____ m | avoid pump power cable |
| IoT box to growlight SSR | control / AC area | ____ m | ____ m | ____ m | no AC final wiring tomorrow |
| IoT box to pump relay / pump | 12V power/control | ____ m | ____ m | ____ m | thicker wire for motor power |
| IoT box to mist relay / mist disc | 24V power/control | ____ m | ____ m | ____ m | separate 24V rail |
| IoT box to fan relay / fan | 12V power/control | ____ m | ____ m | ____ m | separate fan channel |
| Power outlet to IoT box | AC adapter feed | ____ m | ____ m | ____ m | keep dry and safe |
| 12V adapter to 12V distribution | 12V power | ____ m | ____ m | ____ m | fuse required later |
| 24V adapter to mist rail | 24V power | ____ m | ____ m | ____ m | fuse required later |

Cable route risks:

- [ ] Wet area crossed
- [ ] Worker path crossed
- [ ] Sharp frame edge
- [ ] Long I2C route
- [ ] Pump motor cable near sensor cable
- [ ] Need cable clips / conduit / cable ties

---

## 10. WiFi / Connectivity Baseline

| Point | Location | Phone WiFi Bars | Speed/Signal Notes | Firebase reachable? |
|---|---|---:|---|---|
| W1 | IoT box candidate | | | Y/N |
| W2 | Center bed | | | Y/N |
| W3 | Far end of greenhouse | | | Y/N |
| W4 | Power source area | | | Y/N |

Router location: ______________________________________

Possible issue:

- [ ] Weak signal at IoT box
- [ ] Greenhouse frame blocks signal
- [ ] No stable internet
- [ ] Need router/repeater/hotspot test later

---

## 11. End-of-Visit Decisions

Before leaving, write the current best decisions.

Final candidate IoT box location: ________________________________

Final candidate sensor locations:

- SHT30: _________________________________________________________
- BH1750: ________________________________________________________
- Soil sensor: ___________________________________________________

Final candidate actuator locations:

- Growlight: _____________________________________________________
- Pump: __________________________________________________________
- Mist disc: _____________________________________________________
- Fan: ___________________________________________________________

Biggest risks found:

1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

Missing data to collect later:

1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

---

## 12. Required Output After Visit

- [ ] Rough greenhouse sketch with dimensions
- [ ] Photo folder with numbered photos
- [ ] Completed baseline air table
- [ ] Completed baseline light table
- [ ] Completed soil ADC baseline table
- [ ] Completed power source survey
- [ ] Completed cable length schedule
- [ ] List of final candidate component positions
- [ ] List of risks before PCB/EasyEDA design

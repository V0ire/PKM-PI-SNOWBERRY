# Snowberry Smart Greenhouse – AI-Clarity Parameter Specification

## Scope

This document is designed for a practical IoT greenhouse system for non-lab farmers in tropical/subtropical highland conditions such as Ciwidey, Indonesia. The environmental ranges below are based primarily on **general greenhouse strawberry research** for *Fragaria × ananassa*, not on exclusive research for white strawberry or snowberry cultivars alone.[cite:23][cite:31][cite:10][cite:14]

At present, there is no strong evidence that white strawberry/snowberry requires quantitatively different temperature, humidity, or daily light targets than red greenhouse strawberries. Therefore, the values in this document should be treated as **safe and practical default settings** for snowberry, then adjusted using local field data from Ciwidey.[cite:23][cite:82][cite:110][cite:111]

## Design principle

This document is intentionally written for an ESP32-based local-first control system and a farmer-facing dashboard. The goal is not laboratory precision, but simple thresholds that are useful, understandable, and safe enough for daily greenhouse operation.[cite:10][cite:14][cite:31]

The green, yellow, and red ranges below are **engineering control set-points**, not absolute plant biology boundaries. Strawberry plants can still survive outside the green zone, but the risk of lower yield, poorer fruit quality, pollination problems, or disease becomes higher.[cite:10][cite:11][cite:12]

## Working assumptions

- Crop: white strawberry / snowberry, treated as general greenhouse strawberry unless local cultivar data prove otherwise.[cite:23][cite:31]
- Growing system: polybag, pot, or container culture using cocopeat or similar soilless media.[cite:16][cite:42]
- Sensors: SHT30-D for air temperature and RH, BH1750 for lux, capacitive media-moisture sensor.
- Actuators: grow light, irrigation pump, mist disc/fogger, circulation or exhaust fan.
- Target users: non-technical farmers who need simple dashboard messages and clear actions.

## Core evidence summary

Greenhouse strawberries generally perform well at daytime temperatures around 20–24°C and night temperatures around 10–14°C, with relative humidity around 60–75% to balance growth and disease risk. Cooler nights improve fruit quality, while prolonged high humidity increases Botrytis pressure and can interfere with flowering performance.[cite:10][cite:14][cite:20][cite:31][cite:60][cite:127]

For light, modern greenhouse strawberry guidance usually places the minimum daily light integral (DLI) near 10–12 mol/m²/day, while 20–25 mol/m²/day is closer to optimal production. DLI above about 30 mol/m²/day can create stress, especially when combined with excessive heat.[cite:121][cite:15][cite:14][cite:126]

Photoperiod should not be oversimplified. Some strawberry cultivars respond as short-day plants, while others are day-neutral or everbearing. Because white strawberry types are not uniform, photoperiod strategy should remain flexible unless the exact cultivar type is known.[cite:121][cite:24][cite:34][cite:89][cite:82]

In substrate systems, greenhouse practice generally favors low-EC, frequent fertigation rather than rigid interval rules such as “feed every two days.” Fixed claims such as a “3-day fertilization phase” are not strong enough to use as universal automation defaults.[cite:16][cite:42][cite:28][cite:94]

## Default phase thresholds

| Phase | Parameter | Safe | Check | Danger | Confidence | Notes |
|---|---|---|---|---|---|---|
| Vegetative | Day air temperature | 20–24°C [cite:10][cite:14][cite:31][cite:127] | 18–20 or 24–28°C | <18 or >28°C | High | Broadly supported greenhouse range |
| Vegetative | Night air temperature | 12–16°C [cite:14][cite:20][cite:31][cite:127] | 10–12 or 16–18°C | <10 or >18°C | Medium | Slightly cool nights are acceptable |
| Vegetative | Day RH | 60–75% [cite:10][cite:11][cite:60][cite:61] | 50–60 or 75–85% | <50 or >85% | High | Avoid prolonged high humidity |
| Vegetative | Night RH | 70–85% [cite:14][cite:10][cite:126] | 60–70 or 85–90% | >90% for long periods | Medium | High RH can reduce tipburn but raises disease risk |
| Vegetative | DLI | 12–15 mol/m²/day [cite:121][cite:14][cite:15] | 8–12 | <8 | High | Below this, growth continues but productivity drops |
| Flowering | Day air temperature | 18–22°C [cite:10][cite:14][cite:126] | 16–18 or 22–26°C | <16 or >26°C | Medium | Protect pollination conditions |
| Flowering | Night air temperature | 10–14°C [cite:14][cite:31][cite:127] | 8–10 or 14–16°C | <8 or >16°C | Medium | Cooler nights help quality |
| Flowering | Day RH | 60–70% [cite:10][cite:11][cite:14] | 50–60 or 70–80% | <50 or >80% | Medium | Very high RH may reduce anther dehiscence |
| Flowering | Night RH | 70–80% [cite:10][cite:14][cite:126] | 60–70 or 80–85% | >85% for long periods | Medium | Keep flowers dry enough to reduce fungal risk |
| Flowering | DLI | 15–20 mol/m²/day [cite:121][cite:15][cite:31] | 12–15 | <12 | High | Stronger light target for reliable bloom and fruit set |
| Early fruit set | Day air temperature | 18–22°C [cite:10][cite:14] | 16–18 or 22–26°C | <16 or >26°C | Medium | Keep climate stable |
| Early fruit set | Night air temperature | 10–14°C [cite:14][cite:31] | 8–10 or 14–16°C | <8 or >16°C | Medium | Avoid warm nights |
| Early fruit set | Day RH | 60–70% [cite:10][cite:11] | 50–60 or 70–80% | <50 or >80% | Medium | Protect young fruit and flowers |
| Early fruit set | Night RH | 70–80% [cite:10][cite:12][cite:126] | 60–70 or 80–85% | >85% for long periods | Medium | Botrytis risk rises quickly here |
| Early fruit set | DLI | 18–22 mol/m²/day [cite:121][cite:15][cite:31] | 15–18 | <15 | Medium | Important for fruit sizing |
| Fruiting & ripening | Day air temperature | 18–22°C [cite:10][cite:14][cite:126] | 16–18 or 22–26°C | <16 or >26°C | Medium | Helps maintain fruit firmness |
| Fruiting & ripening | Night air temperature | 10–12°C [cite:14][cite:31][cite:126][cite:127] | 8–10 or 12–16°C | <8 or >16°C | High | Warm nights reduce sweetness |
| Fruiting & ripening | Day RH | 60–70% [cite:10][cite:11][cite:60] | 50–60 or 70–80% | <50 or >80% | Medium | Mature fruit is sensitive to fungal pressure |
| Fruiting & ripening | Night RH | 70–80% [cite:10][cite:12][cite:126] | 60–70 or 80–85% | >85% for long periods | Medium | Keep night moisture under control |
| Fruiting & ripening | DLI | 18–25 mol/m²/day [cite:121][cite:15][cite:20][cite:31][cite:126] | 15–18 | <15 or >30 | High | Above 30 may require shading |

## Unsafe thresholds

| Condition | Status | Main risk | Default action | Confidence |
|---|---|---|---|---|
| RH ≥85% and air temperature 15–22°C for several hours | Danger | High Botrytis / gray mold risk [cite:10][cite:12] | Fan ON, mist OFF, improve ventilation | High |
| RH ≥90% through most of the night | Danger | Condensation and fungal disease risk [cite:10][cite:14][cite:126] | Fan ON periodically, reduce fogging | Medium |
| Day RH <50% | Check | Tipburn, calyx burn, dry floral tissue [cite:14][cite:10][cite:126] | Short mist pulses, check airflow | Medium |
| Day temperature >28°C | Danger | Heat stress, poorer fruit quality [cite:10][cite:20][cite:89][cite:126] | Fan max, use shading if available | High |
| Night temperature >18°C for long periods | Check | Lower sugar accumulation, weaker flavor [cite:14][cite:126][cite:127] | Increase night ventilation if possible | Medium |
| DLI <8 mol/m²/day | Danger | Low productivity, small fruit [cite:121][cite:14][cite:31] | Turn grow light ON | High |
| DLI 8–12 mol/m²/day | Check | Acceptable survival, suboptimal yield [cite:121][cite:14][cite:15] | Consider supplemental lighting | High |
| DLI >30 mol/m²/day | Check / Danger | Light and heat stress [cite:121][cite:15][cite:126] | Add shading or reduce leaf heat load | Medium |
| Media sensor <20% of local calibrated range | Danger | Media too dry [cite:42] | Run irrigation until back in safe zone | Low |
| Media sensor >80% of local calibrated range | Danger | Waterlogging, low root oxygen [cite:16][cite:42] | Stop pump, check drainage | Low |

## Media, irrigation, and nutrition

For polybag or cocopeat systems, the safest general principle is to keep the root zone evenly moist but not saturated, while preserving enough air space for roots. Greenhouse strawberry references support media with high water-holding capacity, good aeration, pH around 5.5–6.0, and root-zone EC around or below 1.2 dS/m.[cite:16][cite:42][cite:61]

Modern greenhouse practice generally supports low-EC, frequent fertigation rather than coarse interval-based feeding such as “every two days.” In a simple IoT system without inline EC control, the most realistic strategy is frequent small irrigations, periodic observation of drainage, and occasional flushing when salt build-up is suspected.[cite:42][cite:16][cite:28]

### Practical media rules for the dashboard

- The medium should stay moist, not cracked-dry and not continuously waterlogged.
- Some drainage after irrigation is usually better than zero drainage at all times.[cite:42]
- If leaves wilt at midday while the medium is still wet, the problem may be heat stress or low root oxygen, not lack of water.[cite:16][cite:42]

### Important note on moisture percentages

The percentage reported by a capacitive media sensor is **not a universal biological number**. Safe, warning, and danger percentages must be treated as a **local sensor calibration result** that depends on the sensor model, probe placement, substrate recipe, pot size, and ADC behavior, not as a scientific strawberry constant.

Therefore, the following range should only be used as a starting default:

- Safe: 30–70% of the local calibrated range.
- Check: 20–30% or 70–80%.
- Danger: <20% or >80%.

Confidence for this section is **low**, because it is based on local calibration logic rather than direct crop-science literature.

## Light, lux, and simple dashboard logic

The BH1750 reports lux, while plants respond more directly to PPFD and DLI. For practical greenhouse field use, a simple approximation is to estimate PPFD as roughly lux / 50 under sunlight-like or broad white light, then integrate that estimate over time to approximate DLI.[cite:121][cite:70][cite:72]

This means the dashboard does not need to expose complex plant-light math to farmers. It is more useful to present simple states such as “light too low,” “light sufficient,” or “too intense,” then let the controller respond with supplemental light or shading if required.[cite:121][cite:15][cite:31]

### Farmer-friendly light rules

- If projected daily DLI is <12 mol/m²/day, show “Low Light.”[cite:121][cite:31]
- If DLI is around 15–25 mol/m²/day, show “Light Adequate / Optimal.”[cite:121][cite:15][cite:31]
- If DLI >30 mol/m²/day or peak lux is excessively high together with heat, show “Too Intense.”[cite:121][cite:15]

## Photoperiod note

Photoperiod should be handled carefully because not all white strawberry types share the same flowering behavior. Some white or pineberry cultivars behave as short-day types, while others are sold or managed as day-neutral or everbearing.[cite:82][cite:87][cite:89]

Because cultivar identity in the field is often uncertain, the safest IoT default is **not to hard-code the system around short-day assumptions**. If the local cultivar proves to be day-neutral, extending total light to 14–16 hours may still support yield; if it is short-day, flowering induction requirements should be handled separately.[cite:121][cite:24][cite:34][cite:89]

## Claims that should not be used as default system logic

### “Optimal RH is 80–90%”

This claim appears in some Indonesian open-field strawberry references as a description of highland climate, not as a modern greenhouse control target. In a humid greenhouse, RH that high is too risky if it persists, especially during flowering and fruiting.[cite:49][cite:10][cite:11]

### “Optimal light is 8–10 hours/day”

This is better treated as a traditional field description than a greenhouse optimum. In protected cultivation, DLI matters more than clock hours alone.[cite:49][cite:121][cite:31]

### “There is a 3-day fertilization or fruit-setting phase”

There is no strong basis for modeling strawberry with a rigid 3-day “fertilization phase.” Pollination and fruit set occur across many flowers over time, not in one fixed short block.[cite:31][cite:28]

### “Fertigate every two days for best results”

This may fit one experiment or one local production method, but it is not strong enough to be used as a universal automation default. For a simple IoT greenhouse, flexible low-dose fertigation based on moisture and plant response is safer.[cite:42][cite:16][cite:94]

## Farmer-facing dashboard messages

### English status labels

- Safe
- Check
- Danger

### Optional Indonesian labels

- Aman
- Perlu Cek
- Bahaya

### Temperature

- Safe: “Temperature is within a good range for this stage.”
- Check: “Temperature is becoming less ideal. Please check ventilation and plant condition.”
- Danger: “Temperature is too high or too low. Take action now to protect flowers and fruit.”

### Humidity

- Safe: “Humidity is in a safe range. Disease risk is lower.”
- Check: “Humidity is becoming less ideal. Check for condensation on plastic and leaves.”
- Danger: “Humidity is too high. Gray mold risk is increasing. Turn on fans and reduce misting.”

### Media moisture

- Safe: “Growing media moisture is balanced. Roots have enough water and air.”
- Check: “Media moisture is moving out of the ideal range. Check irrigation timing.”
- Danger: “Growing media is in a dangerous condition. Check the pump, drainage, and root-zone condition immediately.”

### Light

- Safe: “Daily light level is good for growth and fruiting.”
- Check: “Light is below target today. Consider supplemental lighting.”
- Danger: “Light or heat is too intense. Use shading to protect leaves and fruit.”

## Final recommendation

For a non-lab farmer IoT system, the parameters in this document are **more than sufficient** as a starting default, even though they are not exclusive to white strawberry. Their strength lies in translating broad greenhouse strawberry knowledge into simple thresholds that can be monitored by sensors, explained on a farmer dashboard, and automated through an ESP32 controller.[cite:10][cite:14][cite:31]

The most important next step is not to add more theory, but to collect Ciwidey field data over several weeks or one production cycle. That local data can then be used to refine the green, yellow, and red thresholds so they become increasingly specific to the actual snowberry material, greenhouse construction, and farmer practices on site.[cite:49][cite:53]

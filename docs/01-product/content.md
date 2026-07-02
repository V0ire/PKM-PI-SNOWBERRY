# Snowberry — Copywriting & Edu-Botany Module

## 1. Loading Screen Fun Facts

The following 12 facts rotate on the splash screen every 5 seconds with a fade transition. They are shuffled on each app load.

| # | Fact |
|---|------|
| 1 | White strawberries were first commercially cultivated in Japan, where a single premium berry of the 'White Jewel' cultivar can sell for over ¥1,000 (roughly $10 USD). |
| 2 | Unlike red strawberries, white varieties lack the Fragaria allergen 1 (Fra a 1) protein, which means some people with red strawberry allergies can eat white strawberries without a reaction. |
| 3 | White strawberries stay pale because they produce almost no anthocyanin, the pigment responsible for the red color in conventional strawberry fruit. |
| 4 | The flavor profile of white strawberries is often described as a blend of pineapple, apricot, and bubblegum, with a floral sweetness that differs markedly from red cultivars. |
| 5 | Strawberries are not true berries in the botanical sense. Each "seed" on the surface is actually an individual fruit called an achene, and the fleshy part is an enlarged receptacle. |
| 6 | White strawberry cultivars like 'Snow White' and 'White Jewel' are selections of Fragaria × ananassa, the same hybrid species as all commercial red strawberries. |
| 7 | Pollination is critical for uniform strawberry fruit shape. A single flower has 200–400 ovules, and each must be individually pollinated to prevent misshapen berries. |
| 8 | The ideal temperature range for strawberry fruiting is 18–25°C during the day and 12–15°C at night. Temperatures above 30°C halt sugar accumulation in the fruit. |
| 9 | Strawberry plants are photoperiod-sensitive. Short-day cultivars initiate flower buds when daylight drops below 14 hours, which is why greenhouse lighting schedules matter. |
| 10 | Controlled-environment strawberry farming can yield up to 10× more fruit per square meter compared to open-field cultivation, because growing conditions are optimized year-round. |
| 11 | High humidity above 80% during flowering causes pollen grains to clump together, severely reducing pollination success and leading to poor fruit set. |
| 12 | Botrytis cinerea (gray mold) is the most economically damaging disease in strawberry cultivation. Keeping relative humidity between 55–70% during fruiting is the primary prevention strategy. |

---

## 2. Growth Phase Education Module — Phase 1: Vegetative (HST 0–30)

### What Happens During This Phase

The vegetative phase spans from transplant day (HST 0) through approximately HST 30. During this period, the strawberry plant focuses its energy entirely on establishing a strong root system and building above-ground vegetative mass. The crown — the compressed stem at the base of the plant from which all leaves and roots originate — develops rapidly during this window. Healthy crown development is the single most important predictor of future yield.

New leaves unfurl from the crown in a spiral pattern, each leaf consisting of three leaflets (trifoliate). The plant may also begin sending out runners (stolons), which are horizontal stems that produce daughter plants at their nodes. In production greenhouses, runners are typically removed to redirect energy toward the crown and future flower buds.

Root establishment happens primarily in the top 15 cm of the growing medium. A dense, white root mass indicates healthy growth. Brown or sparse roots suggest overwatering, poor drainage, or pathogen pressure from organisms such as Phytophthora or Pythium.

### Microclimate Requirements

| Parameter | Target Range | Critical Boundary |
|---|---|---|
| Temperature | 18–24°C | Below 10°C: growth stalls. Above 28°C: excessive runner production at expense of crown. |
| Relative Humidity | 60–75% | Below 50%: leaf tip burn, transpiration stress. Above 80%: fungal disease pressure. |
| Light (photoperiod) | 12–16 hours per day | Below 10 hours: premature flower bud initiation in short-day cultivars. Above 18 hours: delayed flowering. |
| Soil Moisture | 60–70% volumetric water content | Below 50%: root desiccation. Above 80%: anaerobic conditions, root rot. |

### Why Stability Matters

Temperature swings greater than 5°C within a single day stress crown development and can cause asymmetric leaf growth. If the crown is weakened during this phase, it produces fewer flower trusses in Phase 2, which directly reduces total fruit count.

Excess moisture in the growing medium promotes crown rot caused by Phytophthora cactorum, one of the most destructive soil-borne diseases in strawberry production. Once crown rot establishes, the plant is unrecoverable. Maintaining soil moisture within the 60–70% band through pulsed irrigation — short watering events separated by drainage periods — is the most effective prevention.

Humidity spikes above 80% during the vegetative phase encourage foliar diseases including powdery mildew (Podosphaera aphanis) and leaf spot (Mycosphaerella fragariae). These diseases reduce photosynthetic leaf area, weakening the plant heading into flowering.

### Snowberry's Role

- **Growlight:** Automatically supplements natural light during short days to maintain 14–16 hour photoperiod. The SSR-controlled AC grow light activates at dusk and deactivates after the target photoperiod is reached, based on a timer calculated from sunrise data and the user-configured light schedule.
- **Mist Disc + Fan:** Humidity regulation. When RH drops below the lower threshold, the mist disc activates in short pulses (5 seconds on, 55 seconds off) to raise ambient humidity without wetting leaf surfaces. When RH exceeds the upper threshold, the fan activates to increase air circulation and drive moisture out.
- **Pump:** Soil moisture-driven pulsed irrigation. The pump activates when volumetric water content drops below the lower threshold and runs for a configurable duration (default 30 seconds), then pauses to allow water to percolate before re-reading the sensor. This prevents overwatering.

---

## 3. Growth Phase Education Module — Phase 2: Flowering (HST 30–60)

### What Happens During This Phase

Flower bud initiation begins internally around HST 25–30, though visible flower stalks (inflorescences) typically emerge around HST 35–40. Each inflorescence produces a cluster of flowers called a cyme, with the primary (king) flower opening first, followed by secondary and tertiary flowers over the next 7–10 days.

Anthesis — the opening of a flower — exposes the receptacle and its ring of stamens. Strawberry flowers are self-fertile, meaning a single flower contains both male (stamens) and female (pistils) parts. However, effective pollination requires physical transfer of pollen from anthers to stigmas, which in a greenhouse environment depends on air movement (fans) or manual intervention, since natural pollinators like bees are often absent.

The pollination window for each flower is approximately 5–7 days after anthesis. Unpollinated ovules produce no achenes, resulting in misshapen, unmarketable fruit. Even partial pollination failure — where only some of the 200–400 ovules on a single receptacle are fertilized — produces a visibly lopsided berry.

### Microclimate Requirements

| Parameter | Target Range | Critical Boundary |
|---|---|---|
| Temperature | 15–22°C | Below 12°C: pollen tube growth slows drastically. Above 27°C: flower bud abortion. |
| Relative Humidity | 50–70% | Below 40%: stigma desiccation, poor pollen adhesion. Above 80%: pollen clumping, Botrytis on petals. |
| Light (intensity) | 20,000–40,000 lux during day | Below 15,000 lux: weak flower stalks, reduced flower count per truss. |
| Soil Moisture | 55–65% | Slightly drier than vegetative phase to encourage reproductive transition. |

### Why Stability Matters

Relative humidity above 80% is the most dangerous condition during flowering. At high humidity, pollen grains absorb moisture and clump together, preventing them from being released from the anthers and carried to the stigmas. The result is poor fruit set — fewer berries per truss and more misshapen fruit. This is the primary reason Snowberry implements aggressive humidity control during this phase.

Temperature spikes above 27°C, even for a few hours, can cause flower bud abortion. The developing buds are heat-sensitive, and once aborted, they cannot recover. A single hot afternoon in an uncontrolled greenhouse can eliminate an entire flush of flowers. Maintaining the 15–22°C range with nighttime cooling is essential.

Insufficient light during flowering produces elongated, weak flower stalks that bend under their own weight. This positions the flowers below the leaf canopy where air circulation is poor, further increasing local humidity around the flowers and compounding pollination problems.

### Snowberry's Role

- **Mist Disc + Fan (coordinated):** Aggressive humidity management. The mist disc is used sparingly during flowering — only when RH drops critically low. The fan runs more frequently to maintain constant air movement across the flower canopy, serving dual purposes: keeping RH below 70% and physically vibrating flower stalks to release pollen (buzz pollination substitute).
- **Growlight:** Maintains high light intensity during cloudy days. The grow light supplements natural light to ensure the 20,000 lux minimum is met during the photoperiod.
- **Temperature monitoring alerts:** Snowberry sends a push notification via FCM if the temperature exceeds 25°C, giving the grower time to intervene (open vents, increase fan speed) before buds abort at 27°C.

---

## 4. Growth Phase Education Module — Phase 3: Fruiting (HST 60–90+)

### What Happens During This Phase

After successful pollination, the fertilized ovules develop into achenes (the small "seeds" on the fruit surface), and the receptacle begins to enlarge. This enlargement is what we recognize as the strawberry fruit. In white strawberry cultivars, the receptacle swells and softens but does not accumulate anthocyanin pigments, remaining pale white to very light pink at maturity.

Sugar accumulation is the defining quality metric for white strawberries. The characteristic pineapple-like sweetness develops in the final 10–15 days before harvest, driven by the conversion of starch reserves to fructose and glucose. This process is temperature-dependent: it proceeds optimally between 18–25°C and slows dramatically above 30°C or below 12°C.

Color development in white cultivars is minimal by design. The fruit transitions from hard green to soft white/cream over approximately 25–30 days post-pollination. The lack of anthocyanin means the fruit shows bruising more easily than red varieties, requiring careful handling during and after harvest.

Harvest timing for white strawberries is judged primarily by touch (slight give under gentle pressure) and aroma (the pineapple/floral scent intensifies at peak ripeness), since color change is not a reliable indicator as it is with red cultivars.

### Microclimate Requirements

| Parameter | Target Range | Critical Boundary |
|---|---|---|
| Temperature | 18–25°C | Below 12°C: sugar synthesis stalls. Above 30°C: sugar accumulation halts, fruit softens prematurely. |
| Relative Humidity | 55–70% | Below 50%: skin cracking from rapid moisture loss. Above 75%: Botrytis cinerea (gray mold), fruit rot. |
| Soil Moisture | 50–60% | Reduced from earlier phases. Below 45%: fruit shrinkage. Above 70%: fruit splitting, watery flavor. |
| Light | Maintained for sugar synthesis | Full photoperiod to power photosynthesis for starch-to-sugar conversion. |

### Why Stability Matters

Overwatering during fruiting is the most common cause of fruit loss in greenhouse strawberry production. Excess soil moisture causes the fruit to absorb water through the vascular system faster than it can transpire, leading to internal pressure buildup that physically splits the fruit skin. Split fruit is immediately colonized by Botrytis cinerea (gray mold), which can spread to adjacent berries within 48 hours.

Temperature above 30°C halts sugar accumulation entirely. White strawberries grown in uncontrolled greenhouses during summer often have bland, watery flavor despite appearing fully mature. Maintaining the 18–25°C range during the final 2 weeks before harvest is the difference between a premium-quality berry and an unmarketable one.

High humidity above 75% during fruiting creates surface moisture on the fruit, which is the primary infection pathway for Botrytis. The combination of high humidity and warm temperature (20–25°C) is optimal for Botrytis spore germination, making this phase the highest-risk period for gray mold outbreaks.

### Snowberry's Role

- **Pump:** Pulsed watering with extended soak periods. During fruiting, the pump activates less frequently but runs for longer durations when it does (default 45 seconds per pulse). The interval between watering events is extended to allow the growing medium to partially dry, reducing the average soil moisture compared to the vegetative phase.
- **Fan:** Continuous low-speed air circulation to maintain RH below 70% and prevent surface moisture from condensing on fruit. The fan may run nearly continuously during this phase in humid climates.
- **Temperature monitoring:** Continuous monitoring with FCM alerts at 28°C (warning) and 30°C (critical). The alert at 28°C gives the grower a 2°C buffer to take corrective action.
- **Growlight:** Maintains full photoperiod to maximize photosynthesis for sugar synthesis. Light quality (spectrum) does not change between phases in the current Snowberry hardware revision, but duration is maintained at the user-configured schedule.

---

## 5. Technical Rationale Summary

White strawberry cultivation is a precision agriculture challenge where microclimate stability determines both yield and quality. Unlike field-grown red strawberries that tolerate moderate environmental variation, white cultivars express quality defects visibly and immediately: misshapen fruit from poor pollination, bland flavor from heat-interrupted sugar synthesis, and rapid spoilage from Botrytis colonization on split or moisture-damaged skin. Each of the three growth phases has a different dominant failure mode — crown rot during vegetative establishment, pollen clumping during flowering, and fruit splitting during fruiting — but all three share a common root cause: environmental parameters drifting outside narrow optimal bands. Snowberry exists to hold those parameters steady. By continuously reading temperature, humidity, light, and soil moisture, and by actuating grow lights, pumps, mist discs, and fans in response to real-time sensor data, the system eliminates the environmental drift that degrades white strawberry quality. The 30-minute manual override guardrail ensures that even when a grower intervenes directly, the system returns to automatic control before prolonged manual operation can push conditions outside safe ranges. The result is a microclimate that is stable enough to produce consistently premium-grade white strawberries across all three growth phases, regardless of external weather conditions.

---

## 6. App UI Copy Strings

### App Identity

| Element | Copy |
|---|------|
| **App title** | Snowberry |
| **Tagline** | Precision microclimate for perfect white strawberries. |

### Dashboard Greeting

The greeting displayed at the top of the dashboard is contextual based on the user's local time:

| Time Range | Greeting |
|---|------|
| 05:00–11:59 | Good morning! Here's your greenhouse at a glance. |
| 12:00–16:59 | Good afternoon! Here's your greenhouse at a glance. |
| 17:00–20:59 | Good evening! Here's your greenhouse at a glance. |
| 21:00–04:59 | Working late? Here's your greenhouse at a glance. |

### Empty State — No Device Paired

| Element | Copy |
|---|------|
| **Title** | No greenhouse connected |
| **Body** | Snowberry needs to connect to your greenhouse controller before it can show you sensor data and let you manage actuators. Make sure your Snowberry device is powered on and within WiFi range. |
| **CTA button** | Set up my greenhouse |

### Offline Banner

> ⚠️ Device is offline. Live controls are unavailable.

### Manual Override Confirmation Dialog

| Element | Copy |
|---|------|
| **Title** | Switch to Manual Control? |
| **Body** | The {actuator_name} will no longer respond to sensor readings automatically. Manual mode will expire in 30 minutes. |
| **Cancel button** | Cancel |
| **Confirm button** | Confirm |

Where `{actuator_name}` is dynamically replaced with the lowercase actuator name: "pump", "growlight", "mist disc", or "fan".

### Threshold Saved Toast

> ✅ Thresholds saved. Your greenhouse will use the new settings immediately.

### Fault Notification Messages

These are push notifications delivered via Firebase Cloud Messaging when the ESP32 detects a fault condition.

| Fault Type | Notification Title | Notification Body |
|---|---|---|
| **Sensor read failure** | 🔴 Sensor Error | Snowberry could not read the {sensor_name} sensor. Automatic control for affected actuators is paused until the sensor recovers. |
| **Actuator stuck ON** | 🟠 Actuator Alert | The {actuator_name} has been running for over {duration} minutes continuously. This may indicate a stuck relay or a sensor malfunction. |
| **Actuator stuck OFF** | 🟡 Actuator Alert | The {actuator_name} has not activated despite {sensor_name} being outside its threshold range. Check the relay wiring and actuator power supply. |
| **Temperature critical** | 🔴 High Temperature | Greenhouse temperature has reached {value}°C. This exceeds the safe range for your current growth phase. Take immediate action to cool the environment. |
| **WiFi disconnected** | 📡 Connection Lost | Snowberry lost its WiFi connection and is operating in offline mode. Automatic control continues locally, but you cannot monitor or adjust settings remotely. |
| **NVS storage error** | ⚙️ System Error | Snowberry encountered a storage error and may need to be re-paired. Press and hold the reset button for 5 seconds to restart the pairing process. |

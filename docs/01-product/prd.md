# Product Requirement Document — Snowberry Smart Greenhouse

| Field            | Value                                      |
| ---------------- | ------------------------------------------ |
| Document Version | 1.0                                        |
| Date             | 2026-07-02                                 |
| Project          | Snowberry — Smart Greenhouse 4-in-1        |
| Program          | PKM PI (Program Kreativitas Mahasiswa)      |
| Status           | Draft                                      |

---

## 1. Product Overview

**Product Name:** Snowberry — Smart Greenhouse 4-in-1 for White Strawberry Cultivation

**Category:** IoT Edge Device + Responsive Web Application

**Target User:** Non-technical strawberry farmers and agricultural students who need automated microclimate control without understanding embedded systems or programming. The interface must be operable by someone who can use a smartphone browser and nothing more.

**Platform:**

| Layer      | Technology                          | Rationale                                                                                         |
| ---------- | ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| MCU        | ESP32 WROOM-32D                     | Dual-core 240 MHz, built-in WiFi, 520 KB SRAM, NVS flash for persistent config, mature ecosystem |
| Backend    | Firebase Firestore (Spark tier)     | Zero-cost hosted NoSQL with real-time listeners, eliminates server provisioning and maintenance    |
| Auth       | Firebase Authentication             | Email/password flow, integrates directly with Firestore Security Rules for UID-scoped access      |
| Push       | Firebase Cloud Messaging (FCM)      | Free push notifications to web clients, no polling required for fault alerts                      |
| Frontend   | Responsive Web App (Tailwind CSS)   | Single codebase for mobile and desktop, no app store review, instant deployability                |

**Backend Choice Rationale:** Firebase Spark tier provides 20,000 writes/day and 50,000 reads/day at zero cost. With a 1-minute telemetry interval producing 1,440 writes/day (7.2% of the write quota), the system operates well within free-tier limits. Firestore's built-in `onSnapshot` real-time listener eliminates the need for a WebSocket server or polling infrastructure, which would otherwise require a paid VPS. For a student-funded PKM project targeting a single greenhouse, Firebase Spark is the correct economic choice.

---

## 2. Problem Statement

White strawberries (*Fragaria × ananassa*, cultivar group including Snow White and White Jewel) require a narrow microclimate envelope to produce marketable fruit:

- Air temperature must stay within 18–26 °C; sustained exposure above 30 °C causes flower abortion.
- Relative humidity must remain between 60–80%; below 50% triggers tip burn, above 85% promotes Botrytis cinerea (gray mold).
- Soil moisture must be maintained between 40–70% volumetric water content; overwatering causes root rot, underwatering halts fruit development.
- Supplemental lighting is needed when ambient lux drops below 2,000 lx during the fruiting phase to maintain photoperiod requirements.

In highland greenhouses in Indonesia, farmers currently manage these parameters manually — checking thermometers, visually inspecting soil, and toggling fans or misters by hand. This approach fails because:

1. **Inconsistency** — human attention lapses during nighttime, weekends, and harvest periods.
2. **Delayed response** — by the time a farmer notices wilting or mold, crop damage has already occurred.
3. **No historical data** — without recorded trends, farmers cannot correlate environmental shifts with yield outcomes.
4. **No remote visibility** — farmers must be physically present to assess greenhouse conditions.

Snowberry solves these problems by running a local control loop on the ESP32 that maintains microclimate parameters autonomously, while providing a web dashboard for remote monitoring, threshold tuning, and fault alerting.

---

## 3. Value Proposition

**Local-First Autonomous Control + Remote Monitoring**

| Capability                    | Benefit to Farmer                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| Bang-bang control with hysteresis runs on-device | Greenhouse stays regulated even if WiFi drops or the farmer is away         |
| Real-time dashboard           | Check all four sensor readings and actuator states from any phone browser               |
| Dynamic threshold tuning      | Adjust setpoints seasonally or per cultivar without re-flashing firmware                |
| FCM fault alerts              | Receive immediate push notification if a sensor fails or pump gets stuck               |
| Trend history charts          | Correlate environmental data with growth phases to optimize future harvests             |
| Growth phase tracker          | Automatically calculates days after planting and displays current cultivation phase     |

The core design principle is **operational technology resilience**: the ESP32 control loop is the source of truth for actuator decisions. Firebase is a monitoring and configuration overlay. If the cloud disappears entirely, the greenhouse continues to operate on its last-known thresholds stored in NVS flash.

---

## 4. Functional Requirements

### FR-01: Live Dashboard

**Description:** A single-page dashboard displaying all sensor readings and actuator statuses in real time.

**Sensor Display Cards:**

| Card             | Data Source   | Unit  | Health Indicator Logic                                                          |
| ---------------- | ------------- | ----- | ------------------------------------------------------------------------------- |
| Temperature      | SHT30-D       | °C    | 🟢 Green: 18–26 °C · 🟡 Yellow: 15–18 or 26–30 °C · 🔴 Red: <15 or >30 °C    |
| Humidity         | SHT30-D       | %RH   | 🟢 Green: 60–80% · 🟡 Yellow: 50–60 or 80–85% · 🔴 Red: <50 or >85%           |
| Light Intensity  | BH1750        | lux   | 🟢 Green: ≥ lux_low threshold · 🟡 Yellow: 50–100% of lux_low · 🔴 Red: <50%  |
| Soil Moisture    | Capacitive V2 | %     | 🟢 Green: within soil_low–soil_high · 🟡 Yellow: ±5% outside range · 🔴 Red: ±10% outside range |

**Actuator Status Cards:**

Each of the four actuators (growlight, pump, mist disc, fan) displays:

- Current state: `ON` (green badge) or `OFF` (gray badge)
- Current mode: `AUTO` or `MANUAL`
- If in MANUAL mode: countdown timer showing remaining minutes and seconds until auto-revert

**Refresh Behavior:**

- Data source: Firestore `onSnapshot` listener on `devices/{deviceId}/status/realtime`
- Effective refresh rate: updates arrive within 1–3 seconds of ESP32 writing new data (Firestore real-time propagation)
- The ESP32 writes to `status/realtime` every 60 seconds
- Timestamp display: "Last updated X min ago" shown below the sensor grid, calculated client-side from the `last_seen` field
- If `last_seen` exceeds 5 minutes, the timestamp turns red and displays "⚠ Device may be offline"

---

### FR-02: Auto/Manual Hybrid Control

**Description:** Each of the four actuators can be independently toggled between AUTO mode (ESP32 control loop decides) and MANUAL mode (user forces ON or OFF from the web app).

**Actuators:**

| Actuator    | Relay Type | Voltage | AUTO Control Logic                                              |
| ----------- | ---------- | ------- | --------------------------------------------------------------- |
| Growlight   | SSR        | AC      | ON when lux < lux_low, OFF when lux > lux_high                 |
| Pump        | Relay      | DC 12V  | Pulsed: ON for `pump_pulse_ms`, then OFF for `soak_period_ms`, repeat while soil < soil_low. Stop when soil ≥ soil_high |
| Mist Disc   | Relay      | DC 24V  | ON when RH < rh_low, OFF when RH > rh_high                     |
| Fan         | Relay      | DC 12V  | ON when temp > temp_high OR RH > rh_high, OFF when temp < temp_low AND RH < rh_low |

**Manual Override Guardrail:**

- Maximum manual override duration: **30 minutes**
- When the user switches an actuator to MANUAL, a countdown timer starts at 30:00 and is visible in the dashboard actuator card
- When the timer reaches 00:00, the actuator automatically reverts to AUTO mode without requiring user re-confirmation
- The user may press an **Extend** button at any time during the countdown to reset the timer back to 30:00
- The user may press a **Return to Auto** button at any time to immediately exit MANUAL mode

**Confirmation Dialog (MANUAL activation):**

```
┌─────────────────────────────────────────────────┐
│  Switch Growlight to MANUAL ON?                 │
│                                                 │
│  The growlight will be forced ON regardless of  │
│  light sensor readings. This override will      │
│  expire in 30 minutes and the actuator will     │
│  return to AUTO mode automatically.             │
│                                                 │
│  [ Cancel ]                [ Confirm ]          │
└─────────────────────────────────────────────────┘
```

The dialog text adapts to the specific actuator name and the target state (ON or OFF).

**Firebase Command Payload (written to `devices/{deviceId}/config/commands`):**

When the user confirms a mode change, the web app writes the following document:

```json
{
  "actuator": "growlight",
  "mode": "MANUAL",
  "state": true,
  "manual_until": 1751457600000,
  "issued_at": 1751455800000,
  "issued_by": "uid_abc123"
}
```

| Field          | Type    | Description                                                        |
| -------------- | ------- | ------------------------------------------------------------------ |
| `actuator`     | string  | One of: `growlight`, `pump`, `mist`, `fan`                         |
| `mode`         | string  | `MANUAL` or `AUTO`                                                 |
| `state`        | boolean | Desired actuator state when mode is MANUAL. Ignored when mode is AUTO |
| `manual_until` | number  | Unix timestamp (ms) when MANUAL mode expires. Null when mode is AUTO  |
| `issued_at`    | number  | Unix timestamp (ms) when the command was issued                    |
| `issued_by`    | string  | Firebase Auth UID of the user who issued the command               |

The ESP32 listens to this document via Firestore REST long-poll or periodic check (every 5 seconds). On receiving a command, it updates the actuator state and writes the acknowledgment back to `status/realtime`.

---

### FR-03: Dynamic Threshold Tuning

**Description:** All control thresholds are configurable from the web app. Changes are written to Firestore and synced to the ESP32, which persists them in NVS flash.

**Configurable Parameters:**

| Parameter         | Field Name        | Default | Min   | Max   | Unit  | Guardrail Rule                          |
| ----------------- | ----------------- | ------- | ----- | ----- | ----- | --------------------------------------- |
| Temp Low          | `temp_low`        | 18.0    | 10.0  | 35.0  | °C    | Must be < `temp_high`                   |
| Temp High         | `temp_high`       | 26.0    | 10.0  | 35.0  | °C    | Must be > `temp_low`                    |
| Humidity Low      | `rh_low`          | 60.0    | 30.0  | 95.0  | %RH   | Must be < `rh_high`                     |
| Humidity High     | `rh_high`         | 80.0    | 30.0  | 95.0  | %RH   | Must be > `rh_low`                      |
| Soil Moisture Low | `soil_low`        | 40.0    | 10.0  | 90.0  | %     | Must be < `soil_high`                   |
| Soil Moisture High| `soil_high`       | 70.0    | 10.0  | 90.0  | %     | Must be > `soil_low`                    |
| Lux Low           | `lux_low`         | 2000    | 500   | 50000 | lux   | Must be < `lux_high`                    |
| Lux High          | `lux_high`        | 5000    | 500   | 50000 | lux   | Must be > `lux_low`                     |
| Pump Pulse        | `pump_pulse_ms`   | 5000    | 1000  | 30000 | ms    | Must be ≤ `soak_period_ms`              |
| Soak Period       | `soak_period_ms`  | 60000   | 10000 | 300000| ms    | Must be ≥ `pump_pulse_ms`               |

**UI Behavior:**

- Each parameter is presented as a slider input with the current value displayed numerically beside it
- Slider bounds are clamped to the Min and Max columns above
- Cross-parameter validation runs on every slider change:
  - If `temp_low >= temp_high`, the Save button is disabled and an inline error message reads: "Low threshold must be less than high threshold"
  - The same logic applies to all low/high pairs (rh, soil, lux) and to the pump_pulse/soak relationship
- When all validations pass, the Save button becomes active

**Confirmation Dialog (before saving):**

```
┌─────────────────────────────────────────────────┐
│  Save Threshold Changes?                        │
│                                                 │
│  The following parameters will be updated:      │
│                                                 │
│    Temp Low:  18.0 → 20.0 °C                   │
│    Temp High: 26.0 → 28.0 °C                   │
│                                                 │
│  Changes will take effect on the device within  │
│  60 seconds.                                    │
│                                                 │
│  [ Cancel ]                [ Save ]             │
└─────────────────────────────────────────────────┘
```

The dialog shows only the parameters that were actually changed, with before and after values.

---

### FR-04: Critical Fault Alerting via FCM

**Description:** The ESP32 detects hardware faults locally and writes fault events to Firestore. A Cloud Function (or client-side logic checking `status/faults`) triggers FCM push notifications to the user.

**Fault Code Table:**

| Code   | Fault Name         | Trigger Condition                                                  | FCM Notification Text                                                      | Severity |
| ------ | ------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------- | -------- |
| F-01   | SHT30 Failure      | I2C read returns NACK or CRC mismatch for 3 consecutive attempts   | 🌡️ Sensor Alert: Temperature/humidity sensor (SHT30) is not responding. Check wiring and connections. | Critical |
| F-02   | BH1750 Failure     | I2C read returns 0xFFFF or timeout for 3 consecutive attempts      | 💡 Sensor Alert: Light sensor (BH1750) is not responding. Check wiring and connections.               | Critical |
| F-03   | Soil Sensor Failure| ADC reading is pinned at 0 or 4095 for 5 consecutive readings      | 🌱 Sensor Alert: Soil moisture sensor is reading out of range. It may be disconnected or damaged.     | Critical |
| F-04   | Device Offline     | No telemetry write to Firestore for >5 minutes (detected client-side) | 📡 Connection Lost: Snowberry device has not reported data for over 5 minutes. Check power and WiFi. | Warning  |
| F-05   | PSU Fault          | Voltage divider ADC reads <10.5V on 12V rail (>12.5% drop)        | 🔋 Power Alert: Supply voltage has dropped below safe levels. Check power adapter and connections.    | Critical |
| F-06   | Pump Stuck ON      | Pump relay has been continuously ON for >5 minutes without soil moisture increase | 🚰 Actuator Alert: Water pump has been running for over 5 minutes with no moisture change. Possible blockage or sensor fault. | Critical |

**Fault Lifecycle:**

1. ESP32 detects fault condition → sets fault code in `status/realtime` → appends fault event to `status/faults` array
2. Web app reads `status/faults` via `onSnapshot` → displays fault banner at top of dashboard
3. FCM notification is sent to all registered tokens for the device owner
4. When the fault condition clears (sensor recovers, device reconnects), ESP32 sets `resolved: true` on the fault entry

---

### FR-05: Trend History & Charts

**Description:** Historical telemetry data is visualized as time-series line charts rendered client-side.

**Data Source:** Firestore `devices/{deviceId}/telemetry/{YYYY-MM-DD}` documents are queried directly from the web app. No aggregation backend is required.

**Time Range Selector:**

| Range | Documents Queried | Estimated Reads | Data Points Displayed |
| ----- | ----------------- | --------------- | --------------------- |
| 24h   | 1–2 daily docs    | 2               | Up to 1,440           |
| 7d    | 7 daily docs      | 7               | Up to 10,080 (downsample to 1 per 10 min = 1,008) |
| 30d   | 30 daily docs     | 30              | Up to 43,200 (downsample to 1 per hour = 720) |

**Chart Panels:**

- Temperature (°C) — line chart with threshold bands (low/high) drawn as horizontal dashed lines
- Humidity (%RH) — line chart with threshold bands
- Light Intensity (lux) — line chart with threshold band
- Soil Moisture (%) — line chart with threshold bands

**Rendering:** Charts are rendered client-side using a lightweight JavaScript charting library (Chart.js or Lightweight Charts). All data transformation and downsampling happen in the browser to avoid cloud function costs.

---

### FR-06: Growth Phase Visualization

**Description:** The user inputs the planting date once. The system calculates Days After Planting (Hari Setelah Tanam / HST) and displays the current growth phase.

**Growth Phase Table (White Strawberry):**

| Phase         | HST Range   | Description                                      |
| ------------- | ----------- | ------------------------------------------------ |
| Vegetative    | 0–30 HST    | Leaf and runner development, root establishment   |
| Flowering     | 31–60 HST   | Flower bud formation and pollination period       |
| Fruiting      | 61–90 HST   | Fruit development and ripening                    |
| Harvest       | 91+ HST     | Fruit picking window, plant maintenance           |

**UI Display:**

- A horizontal progress bar divided into four colored segments (green → yellow → orange → red)
- A marker indicates the current day's position on the bar
- Below the bar: "Day 45 of cultivation — Flowering Phase"
- The planting date is stored in `devices/{deviceId}/config/thresholds` as `planting_date` (ISO 8601 string)

---

### FR-07: Educational Module

**Description:** A static content section within the web app providing cultivation guidance for white strawberries.

**Content Sections:**

1. About White Strawberries — cultivar overview, origin, and unique characteristics
2. Ideal Growing Conditions — temperature, humidity, light, and soil requirements (cross-references the threshold defaults)
3. Common Pests and Diseases — Botrytis, spider mites, aphids, powdery mildew
4. Watering Best Practices — pulse irrigation rationale, overwatering symptoms
5. Harvest Indicators — color, firmness, aroma cues for peak ripeness

**Loading Screen Fun Facts:**

The web app displays a random fact from the following pool during initial load:

- "White strawberries were first cultivated in Japan and can sell for over $10 per berry."
- "The SHT30-D sensor used in Snowberry can measure temperature within ±0.2 °C accuracy."
- "White strawberries get their color from a lack of the Fra a 1 allergen protein — making them hypoallergenic."
- "The ESP32 processor in Snowberry runs at 240 MHz — faster than the computer that guided Apollo 11."
- "Optimal soil moisture for strawberries is between 40–70%. Snowberry checks this every 60 seconds."

---

## 5. Non-Functional Requirements

### NFR-01: Local Reliability (Offline Resilience)

**Control Loop Independence:** The ESP32 control loop executes entirely in local firmware using threshold values stored in NVS flash. No network call is required to make an actuator decision. If WiFi is unavailable, the control loop continues to run identically.

**Telemetry Buffering:**

- When WiFi is disconnected, the ESP32 stores telemetry readings in a RAM ring buffer
- Buffer capacity: 10–20 readings (10–20 minutes of data at 1-minute intervals)
- Buffer size in memory: approximately 20 readings × 40 bytes = 800 bytes (well within ESP32's 520 KB SRAM)
- On WiFi reconnection, the buffer is flushed to Firestore in a batch write
- If the buffer fills before reconnection, the oldest readings are overwritten (ring buffer behavior)

**Web App Offline Behavior:**

- When the `onSnapshot` listener detects disconnection from Firestore, the dashboard enters a degraded state:
  - A top banner appears: "⚠ Connection to cloud lost. Live data may be stale. Controls are disabled until connection is restored."
  - All Manual/Auto toggle buttons are disabled (grayed out)
  - Threshold tuning Save button is disabled
  - Sensor cards continue displaying the last-known values with the timestamp frozen
- When connection is restored, the banner disappears and controls re-enable automatically

---

### NFR-02: Firebase Spark Tier Efficiency

**Write Budget (20,000 writes/day):**

| Write Source                 | Frequency            | Daily Writes | % of Quota |
| ---------------------------- | -------------------- | ------------ | ---------- |
| Telemetry (1 doc/day, array append) | 1,440 appends/day but 1 doc write per append | 1,440 | 7.20% |
| Status/realtime update       | Every 60 seconds     | 1,440        | 7.20%      |
| Threshold changes            | ~2–5 per day         | 5            | 0.03%      |
| Command writes               | ~5–10 per day        | 10           | 0.05%      |
| Fault event writes           | ~0–5 per day         | 5            | 0.03%      |
| **Total**                    |                      | **2,900**    | **14.50%** |

**Read Budget (50,000 reads/day):**

| Read Source                  | Frequency            | Daily Reads  | % of Quota |
| ---------------------------- | -------------------- | ------------ | ---------- |
| onSnapshot realtime listener | ~1 read per update received | 1,440   | 2.88%      |
| Threshold config reads       | On page load + changes | 10         | 0.02%      |
| Trend history (24h)          | ~3 queries/day       | 6            | 0.01%      |
| Trend history (7d)           | ~1 query/day         | 7            | 0.01%      |
| Trend history (30d)          | ~0.5 query/day       | 15           | 0.03%      |
| **Total**                    |                      | **1,478**    | **2.96%**  |

**Payload Minification:** Telemetry entries within the daily document use single-character or two-character field names to minimize document size. See API Contract for the minification key mapping.

---

### NFR-03: UI Responsiveness

| Metric                          | Target        |
| ------------------------------- | ------------- |
| First Contentful Paint (FCP)    | < 2.0 seconds on 4G connection |
| Dashboard data refresh          | < 3.0 seconds from ESP32 write to UI update |
| Threshold save round-trip       | < 5.0 seconds from Save click to ESP32 acknowledgment |
| Supported viewport range        | 360px (mobile) to 1440px (desktop) |
| Primary design approach         | Mobile-first responsive layout using Tailwind CSS breakpoints |

---

### NFR-04: Security

**Authentication:**

- Firebase Authentication with email/password provider
- No anonymous access permitted
- Session persistence set to `LOCAL` (survives browser restart)

**Firestore Security Rules:**

- All documents under `devices/{deviceId}` are readable and writable only by the authenticated user whose UID matches the `owner_uid` field on the device document
- Users can only read/write their own `users/{uid}` documents
- No public read or write access on any collection

**Device Credentials:**

- WiFi SSID and password are stored in ESP32 NVS flash (encrypted partition)
- Firebase project credentials are compiled into firmware (API key is non-secret for Firestore with Security Rules enforced)
- No sensitive tokens are transmitted in telemetry payloads

---

### NFR-05: Maintainability

**Modular Firmware Structure:**

- Firmware is organized into discrete C/C++ modules: `sensor_manager`, `actuator_controller`, `control_loop`, `wifi_manager`, `firestore_client`, `nvs_config`, `fault_detector`
- Each module exposes a clean init/update interface and can be unit-tested in isolation

**Threshold Tuning Without Re-flash:**

- All threshold values are read from NVS on boot and updated via Firestore sync
- No firmware re-compilation or re-upload is required to change any operational parameter

**Field Recalibration:**

- Soil moisture sensor calibration (dry/wet reference points) can be triggered via a physical button on the PCB or remotely through the web app's calibration interface
- Calibration values are stored in NVS alongside thresholds

---

## 6. Out of Scope

The following features are explicitly excluded from the Snowberry v1.0 scope:

| Excluded Feature              | Rationale                                                                   |
| ----------------------------- | --------------------------------------------------------------------------- |
| Multi-device support          | v1.0 targets a single greenhouse unit; multi-device adds auth complexity    |
| Machine learning / prediction | Requires historical dataset that does not yet exist; premature optimization |
| OTA firmware updates          | Adds significant security surface and partition management complexity       |
| Monetization / billing        | This is a PKM academic project, not a commercial product                    |
| CO2 sensor                    | Adds cost and complexity; white strawberry cultivation does not critically depend on CO2 enrichment |
| EC / pH sensor                | Hydroponic-grade sensors are outside the budget and scope of soil-based cultivation |
| Camera / image capture        | Bandwidth and storage costs exceed Spark tier; visual inspection remains manual |
| Multi-user access             | Single owner per device simplifies security rules and eliminates role management |

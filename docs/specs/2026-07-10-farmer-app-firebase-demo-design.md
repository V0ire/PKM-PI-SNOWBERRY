# Snowberry Farmer App and Firebase Demo Design

**Date:** 2026-07-10  
**Status:** Approved design; awaiting user review  
**Scope:** Farmer-facing web app, Firebase Spark demo setup, and ESP32-to-Firestore integration.

## Goal

Deliver a simple Indonesian farmer application for a live Snowberry greenhouse demo. Within ten seconds, a farmer should understand the greenhouse condition, the most important action, and all other active risks without needing technical knowledge.

Developer-facing source code, configuration, and technical documentation use English. All farmer-facing UI copy uses Indonesian.

## Scope

Included:

- Firebase Spark project with one fixed demo device: `snowberry-001`.
- No visible login for the demo.
- ESP32 direct writes to Firestore.
- Dashboard, Kondisi Tanaman, Aktuator, Riwayat, splash, and two-field first setup.
- First setup fields: Nama Greenhouse and Tahap Tanaman.
- Phase options: Vegetatif, Berbunga, Buah.
- Live sensor and actuator state, daily natural-light estimate, and growlight-on duration.
- One fixed, firmware-defined safe rewatering pulse after confirmation.
- Firebase Console setup checklist, public demo Firestore rules, seed data, and environment configuration.

Excluded:

- Login, device pairing, multi-farm support, notifications, full settings, fertilizer automation, shading hardware, and a dedicated farmer education page.
- Combined DLI from natural and growlight sources until lamp output calibration is available.

## System Architecture

```text
Sensors → ESP32 local control loop → actuators
                 ↓ every 60 seconds
          Firestore status + telemetry
                 ↓ realtime listener
              Farmer web app
                 ↓ temporary commands
Firestore config/commands → ESP32 polls → validates → applies or rejects
```

The ESP32 remains the actuator decision-maker. It reads sensors and applies safe local control even when Firestore is unavailable. The app does not optimistically alter actuator state. It sends a command and displays the state acknowledged by the ESP32.

### Firestore data

- `devices/snowberry-001`: greenhouse metadata including `greenhouse_name` and `plant_phase`.
- `devices/snowberry-001/status/realtime`: sensors, actuators, actuator reasons, daily natural-light estimate, growlight-on duration, and `last_seen`.
- `devices/snowberry-001/config/thresholds`: local control thresholds. Not exposed in the demo UI.
- `devices/snowberry-001/config/commands`: temporary manual and rewatering commands.
- `devices/snowberry-001/telemetry/{YYYY-MM-DD}`: periodic samples for history.

The demo uses public read/write Firestore rules because of the deadline. This is explicitly temporary. Replace it with invisible Anonymous Auth and restrictive rules after the demo.

## Farmer Experience

### Splash

The app starts with a strawberry animation and one short useful farming fact. It waits for the first Firebase status update for at least three seconds. If no data arrives within 15 seconds, it opens Dashboard and shows:

> Data greenhouse belum masuk. Cek listrik box Snowberry dan koneksi Wi-Fi. Hubungi tim teknis jika masalah berlanjut.

The application continues listening for data in the background.

### First setup

When metadata is absent, ask only:

1. Nama Greenhouse
2. Tahap Tanaman: Vegetatif, Berbunga, atau Buah

Save both values to the fixed device document. Phase is chosen once during demo setup and is not editable from the farmer UI.

### Dashboard

Order:

1. **Aksi Utama**: one largest, highest-priority recommended action.
2. Other active conditions: visible red/yellow issue cards, never hidden.
3. **Kondisi Tanaman** summary.
4. **Aktuator** summary.
5. **Tahap Tanaman** card.

Priority order for Aksi Utama:

1. Missing device data or device fault.
2. Sensor fault.
3. Media remains dry after three watering cycles.
4. Dangerous humidity or temperature.
5. Low daily natural-light progress.

Example dry-media action:

> Tanaman masih kering setelah 3 kali penyiraman. Cek air pada tandon dan jalur pompa.

The rewatering button opens a confirmation dialog. Confirming sends one fixed safe pulse selected and enforced by the ESP32. The app waits for acknowledgment.

### Kondisi Tanaman

Each sensor shows:

- Current number and unit.
- Plain-language meaning.
- Status: Aman, Perlu Cek, or Bahaya.
- One farmer action when needed.

The page uses researched, phase-specific defaults. It does not claim that 80–90% RH is optimal, that 8–10 hours alone guarantees enough light, that fertilization should happen every two days, or that strawberry has a rigid three-day fertilization phase.

### Aktuator

Default view is status and explanation only. Manual access is intentionally secondary:

1. Farmer taps **Buka Kontrol Manual**.
2. A warning explains the temporary safety limit.
3. Farmer can temporarily control one tool for up to 30 minutes.
4. ESP32 validates command expiry and safety conditions, then writes an acknowledgment.

### Riwayat

- Default: Hari Ini.
- Alternative: 7 Hari.
- Shows temperature, humidity, media moisture, actuator activity, natural-light estimate, and growlight-on duration.
- Shows stability and daily progress in plain Indonesian rather than engineering charts alone.

## Light Measurement Constraint

The BH1750 is installed above the growlight and measures natural light rather than lamp illumination at the canopy. Therefore, the demo displays two separate values:

- Estimated natural-light progress from BH1750 readings.
- Growlight ON duration from the ESP32 actuator state.

Do not present their sum as verified DLI. A combined DLI estimate requires a calibrated growlight contribution measured at plant canopy level.

## Field Placement Metadata

- IoT box: approximately 30 cm below greenhouse top and slightly above sprinkler level.
- BH1750: top position below UV plastic; natural-light reference.
- Soil sensor: centre/reference pot near IoT box.
- SHT30-D: canopy-height reference, mounted on bamboo near the soil-sensor reference area.
- Actuators: close to the IoT box to reduce cable risk.

Sensor readings represent reference positions, not every pot or every greenhouse microclimate.

## Research Defaults

`docs/06-research/snowberry_iot_ai_clarity_en.md` is the working research reference. It treats snowberry as general greenhouse strawberry until cultivar-specific data exists.

Key defaults:

- Avoid prolonged RH above 85%; it increases condensation and Botrytis risk.
- Use phase-specific temperature/RH ranges.
- Treat media-moisture percentages as locally calibrated sensor values, not universal crop-science constants.
- Use natural light accumulation as a practical estimate; DLI is more useful than fixed light hours but must not be overstated with the current sensor placement.
- Do not automate fertilizer schedules without EC/pH or local validation.

## Errors and Safety

- Missing Firebase data does not claim that local control is active. It only instructs the farmer to check box power and Wi-Fi.
- Manual commands expire at 30 minutes.
- Rewatering is a fixed safe firmware pulse, not a farmer-selected duration.
- Commands are acknowledged by the ESP32 before the app treats them as applied.
- Firmware remains local-first: cloud loss must not be a control dependency.

## Validation

- Web app: `npm run build`.
- Firmware: PlatformIO compile for normal and Firebase-enabled targets.
- Firebase smoke test: ESP32 can write realtime status and telemetry; web app receives it; app command receives an ESP32 acknowledgment.
- Failure checks: Firebase/Wi-Fi loss does not prevent local control; app shows the 15-second no-data fallback.

## Deferred After Demo

- Anonymous Auth and restrictive Firestore rules.
- Push notification for Aksi Utama: requires browser permission, service worker, and a trusted sending service; it is not appropriate for this deadline.
- Farmer-facing Panduan Tanaman page.
- Editable settings and threshold management.
- Growlight canopy calibration and combined DLI.
- Fertilizer guidance and automation after validated local agronomy data.

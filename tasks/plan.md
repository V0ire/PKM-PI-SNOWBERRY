# Implementation Plan: Snowberry Farmer App and Firebase Demo

## Overview

Implement the approved Firebase Spark demo: ESP32 writes live greenhouse state to Firestore, and the Indonesian farmer web app shows a simple action-first experience for one fixed device, `snowberry-001`.

## Architecture Decisions

- Firebase Firestore is the integration point; the ESP32 remains the local actuator controller.
- Demo Firestore rules are public read/write temporarily. Move to Anonymous Auth after the demo.
- The dashboard never claims local control is active if Firebase data is missing.
- The BH1750 value is natural-light reference only. Display natural-light progress and growlight-on duration separately.
- The demo exposes no threshold settings or farmer phase edits after first setup.

## Dependency Graph

```text
Firestore console/config/rules
  ├─ web app Firebase data mapping and first setup
  │   ├─ splash and no-data state
  │   ├─ dashboard action-first views
  │   └─ history and manual-control UI
  └─ ESP32 Firebase client
      ├─ realtime status and telemetry writes
      └─ command poll, validation, acknowledgement
```

## Task List

### Phase 1: Firebase foundation

#### Task 1: Prepare Firebase demo configuration

**Description:** Provide the Console checklist, public-demo Firestore rules, seed metadata, and web environment template for the fixed `snowberry-001` device.

**Acceptance criteria:**
- [ ] Firestore contains the fixed device metadata shape with greenhouse name and plant phase.
- [ ] Rules permit the explicitly temporary demo read/write flow.
- [ ] No Firebase secret is added to Git.

**Verification:**
- [ ] Manual Firestore Console read/write smoke test succeeds.
- [ ] Confirm environment template contains placeholders only.

**Dependencies:** None

**Files likely touched:**
- `firebase/firestore.rules`
- `firebase/seed.example.json`
- `web-app/.env.example`
- Firebase setup checklist document

**Estimated scope:** M

#### Task 2: Align frontend Firestore types and data source

**Description:** Extend the existing Firebase data source to map device metadata, live status, commands, telemetry, natural-light progress, growlight duration, and ESP32 acknowledgements.

**Acceptance criteria:**
- [ ] The web app reads the approved Firestore paths for `snowberry-001`.
- [ ] Missing/invalid data safely maps to a no-data UI state.
- [ ] Commands are displayed as pending until ESP32 acknowledgement.

**Verification:**
- [ ] `npm run build` succeeds.
- [ ] Seeded Firestore values appear in the web app.

**Dependencies:** Task 1

**Files likely touched:**
- `web-app/src/types.ts`
- `web-app/src/services/firebaseDataSource.ts`
- `web-app/src/services/useSnowberryData.ts`
- `web-app/src/services/firebaseConfig.ts`

**Estimated scope:** M

### Checkpoint: Firebase foundation

- [ ] Firestore and web app exchange a realtime status document.
- [ ] `npm run build` succeeds.

### Phase 2: Farmer application vertical slices

#### Task 3: Add splash, first setup, and no-data fallback

**Description:** Build the startup flow: Indonesian farming fact splash, a minimum three-second wait for status, 15-second no-data fallback, then two-field first setup persisted to Firestore.

**Acceptance criteria:**
- [ ] Splash waits for first data with a three-second minimum.
- [ ] After 15 seconds, Dashboard opens with approved power/Wi-Fi/technical-team copy.
- [ ] First setup persists greenhouse name and phase; phase is not farmer-editable afterward.

**Verification:**
- [ ] `npm run build` succeeds.
- [ ] Manual test covers first data, no data, and saved setup flows.

**Dependencies:** Task 2

**Files likely touched:**
- `web-app/src/App.tsx`
- `web-app/src/components/*`
- `web-app/src/pages/*`
- `web-app/src/styles.css`

**Estimated scope:** M

#### Task 4: Implement action-first Dashboard and Kondisi Tanaman

**Description:** Reshape the dashboard around one prioritized Aksi Utama plus visible secondary warnings, then add the quantitative and qualitative sensor interpretation view.

**Acceptance criteria:**
- [ ] One highest-priority action follows the approved priority order.
- [ ] Other active issues remain visible with clear Aman/Perlu Cek/Bahaya states.
- [ ] Sensor views show value, meaning, and one farmer action in Indonesian.
- [ ] Natural-light progress and growlight-on duration are separate.

**Verification:**
- [ ] `npm run build` succeeds.
- [ ] Manual test with safe, warning, danger, and no-data Firestore states.

**Dependencies:** Task 2, Task 3

**Files likely touched:**
- `web-app/src/pages/DashboardPage.tsx`
- `web-app/src/components/*`
- `web-app/src/utils/*`
- `web-app/src/data/*`
- `web-app/src/styles.css`

**Estimated scope:** M

#### Task 5: Restrict manual control and add rewatering confirmation

**Description:** Default Aktuator to status-only. Gate manual controls behind a warning and preserve the 30-minute command limit. Add confirmation before the fixed safe rewatering command.

**Acceptance criteria:**
- [ ] Manual controls remain hidden until Buka Kontrol Manual is confirmed.
- [ ] Rewatering sends no command until Ya, Siram is confirmed.
- [ ] UI waits for ESP32 acknowledgement and reports rejected/expired commands.

**Verification:**
- [ ] `npm run build` succeeds.
- [ ] Manual Firestore command and acknowledgement smoke test succeeds.

**Dependencies:** Task 2, Task 4

**Files likely touched:**
- `web-app/src/App.tsx`
- `web-app/src/components/ActuatorCard.tsx`
- `web-app/src/components/ConfirmManualModal.tsx`
- `web-app/src/services/dataSource.ts`

**Estimated scope:** M

#### Task 6: Implement Riwayat today and seven-day views

**Description:** Use telemetry to provide simple Hari Ini and 7 Hari summaries for climate stability, media state, natural-light estimate, growlight duration, and tool activity.

**Acceptance criteria:**
- [ ] Hari Ini is the default selection.
- [ ] 7 Hari uses available daily telemetry without unsupported agronomy claims.
- [ ] Natural-light progress and growlight duration stay separate.

**Verification:**
- [ ] `npm run build` succeeds.
- [ ] Manual test with seeded multi-day telemetry succeeds.

**Dependencies:** Task 2, Task 4

**Files likely touched:**
- `web-app/src/pages/HistoryPage.tsx`
- `web-app/src/services/firebaseDataSource.ts`
- `web-app/src/types.ts`
- `web-app/src/styles.css`

**Estimated scope:** M

### Checkpoint: Farmer application

- [ ] First setup, splash fallback, Dashboard, Kondisi Tanaman, Aktuator, and Riwayat work with Firestore data.
- [ ] `npm run build` succeeds.
- [ ] Farmer copy is Indonesian; developer-facing code is English.

### Phase 3: ESP32 Firebase integration

#### Task 7: Add Firebase connectivity without coupling local control

**Description:** Add Wi-Fi provisioning/connection and Firebase client configuration while preserving boot safe-state and local control operation if cloud connectivity fails.

**Acceptance criteria:**
- [ ] Safe actuator state remains first in boot.
- [ ] Wi-Fi/Firebase failure does not stop local sensor/control loop.
- [ ] Credentials are local-only and ignored by Git.

**Verification:**
- [ ] PlatformIO normal build succeeds.
- [ ] Disconnect Wi-Fi manually; local control loop continues.

**Dependencies:** Task 1

**Files likely touched:**
- `firmware/platformio.ini`
- `firmware/src/main.cpp`
- `firmware/include/*`
- new narrowly-scoped Firebase/network source files if needed

**Estimated scope:** M

#### Task 8: Publish live status and daily telemetry

**Description:** Write approved sensor, actuator, reason, daily natural-light estimate, growlight-on duration, and last-seen fields to realtime and daily telemetry documents.

**Acceptance criteria:**
- [ ] ESP32 updates realtime status every 60 seconds.
- [ ] Telemetry uses the contract daily document path.
- [ ] Natural-light estimate and growlight duration are stored separately.

**Verification:**
- [ ] PlatformIO Firebase target builds.
- [ ] Firestore Console shows realtime and telemetry updates from ESP32.

**Dependencies:** Task 7

**Files likely touched:**
- `firmware/src/main.cpp`
- `firmware/src/*firebase*`
- `firmware/include/*firebase*`

**Estimated scope:** M

#### Task 9: Poll commands and write acknowledgement

**Description:** Poll the command document, validate expiry and safety, apply valid commands locally, and publish acknowledgements for manual control and rewatering.

**Acceptance criteria:**
- [ ] Manual command expires at 30 minutes maximum.
- [ ] Rewatering uses one firmware-defined safe pulse.
- [ ] Invalid, expired, and safety-rejected commands receive explicit acknowledgement.

**Verification:**
- [ ] PlatformIO Firebase target builds.
- [ ] Manual Firestore command test verifies applied and rejected acknowledgement paths.

**Dependencies:** Task 7, Task 8

**Files likely touched:**
- `firmware/src/control.cpp`
- `firmware/src/main.cpp`
- `firmware/src/*firebase*`
- `firmware/include/*`

**Estimated scope:** M

### Checkpoint: End-to-end demo

- [ ] ESP32 writes live Firestore data.
- [ ] Web app renders that data and sends commands.
- [ ] ESP32 acknowledges commands.
- [ ] Wi-Fi/Firebase loss does not stop local ESP32 control.
- [ ] Web app and firmware builds succeed.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Public demo rules allow arbitrary writes | High | Single demo project/device; replace with Anonymous Auth after demo |
| Firebase libraries exceed firmware memory or schedule | High | Prove a minimal status write early; retain current local-only firmware as fallback |
| No lamp calibration | Medium | Separate natural-light estimate from growlight duration |
| Sensor placement represents only one zone | Medium | Describe readings as reference values; avoid whole-greenhouse claims |
| Weak Wi-Fi | High | App timeout state plus ESP32 local-first controller |

## Open Questions

- Which Firebase ESP32 library and auth flow fit the available board flash and Spark project configuration? Resolve during Task 7 with a minimal write proof.
- What calibrated growlight canopy contribution should be used later for combined DLI?

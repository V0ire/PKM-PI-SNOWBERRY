# Implementation Plan: Snowberry Farmer Frontend Redesign

## Overview

Implement the approved farmer-facing visual redesign without changing Firestore paths or ESP32 control authority. Work screen by screen: shared visual tokens first, then Beranda/Cek, Tanaman, Alat, Riwayat, splash/setup, and runtime verification.

## Architecture Decisions

- Reuse the existing React pages and Firebase data hook; redesign presentation and screen flow only.
- Use Starbucks green/cream colors and Nunito Sans. Borrow only spacing, radius, and shadow language from `docs/02-frontend/Design.md`.
- Keep four primary pages. Cek is a transient full-screen detail view, not bottom navigation.
- Treat Pelembap Udara as one farmer-facing system while preserving separate mist/fan internal state fields.

## Dependency Graph

```text
Shared tokens and navigation
  ├─ Beranda + Cek
  ├─ Tanaman
  ├─ Alat
  ├─ Riwayat
  └─ Splash + first setup
       └─ responsive/browser verification
```

## Task List

### Phase 1: Shared Foundation

#### Task 1: Establish shared visual system

**Description:** Update global typography, color roles, card surfaces, hero contrast, motion preferences, and the fixed four-item navigation.

**Acceptance criteria:**
- [ ] Nunito Sans with robust system fallback is applied.
- [ ] White/off-white cards use 20px radius, subtle border, and dark-green-tinted soft shadow.
- [ ] All buttons and navigation items meet 44px minimum touch target.

**Verification:**
- [ ] `npm run build` succeeds.
- [ ] Manual check at 360px and 680px widths.

**Dependencies:** None

**Files likely touched:**
- `web-app/index.html`
- `web-app/src/styles.css`
- `web-app/src/components/TopBar.tsx`
- `web-app/src/components/BottomNav.tsx`

**Estimated scope:** M

### Phase 2: Farmer Decision Screens

#### Task 2: Redesign Beranda and Cek

**Description:** Build the dark guided Aksi Utama hero, compact 2x2 qualitative sensor cards, phase card, quiet timestamp, optional confirmed action, and on-demand warning detail screen.

**Acceptance criteria:**
- [ ] Beranda contains only Aksi Utama, four compact sensor cards, timestamp, and phase card.
- [ ] Hero uses explicit qualitative state and shows `Ada N masalah lain` only when applicable.
- [ ] Cek opens without adding a fifth primary navigation item.

**Verification:**
- [ ] `npm run build` succeeds.
- [ ] Manual safe, warning, danger, no-data, and rewatering-action states.

**Dependencies:** Task 1

**Files likely touched:**
- `web-app/src/App.tsx`
- `web-app/src/pages/DashboardPage.tsx`
- `web-app/src/components/GreenhouseHero.tsx`
- `web-app/src/components/SensorGauge.tsx`
- `web-app/src/utils/status.ts`
- `web-app/src/styles.css`

**Estimated scope:** M

#### Task 3: Redesign Tanaman walkthrough

**Description:** Present sensor interpretation one at a time in fixed order with accessible controls, swipe support, progress, and secondary phase targets.

**Acceptance criteria:**
- [ ] Order is Suhu, Udara, Cahaya, Media.
- [ ] Current card shows number, meaning, and farmer action.
- [ ] Swipe is supplemental; visible Sebelumnya/Berikutnya controls always work.

**Verification:**
- [ ] `npm run build` succeeds.
- [ ] Keyboard and touch navigation work at phone width.

**Dependencies:** Task 1

**Files likely touched:**
- `web-app/src/pages/DashboardPage.tsx` or a focused replacement page
- `web-app/src/components/*`
- `web-app/src/styles.css`

**Estimated scope:** M

#### Task 4: Redesign Alat as farmer systems

**Description:** Present Lampu Tanam, Pompa Air, and Pelembap Udara in one scroll page with state first, role second, and gated manual controls last.

**Acceptance criteria:**
- [ ] Pelembap Udara is one card with Kabut and Kipas state chips.
- [ ] Manual control entry remains warning-gated and acts on the shared humidifier system.
- [ ] Internal mist/fan status remains visible without exposing relay terminology.

**Verification:**
- [ ] `npm run build` succeeds.
- [ ] Manual warning, active state, and offline-disabled state render correctly.

**Dependencies:** Task 1

**Files likely touched:**
- `web-app/src/components/ActuatorCard.tsx`
- `web-app/src/components/HumidifierCard.tsx`
- `web-app/src/pages/DashboardPage.tsx` or a focused replacement page
- `web-app/src/styles.css`

**Estimated scope:** M

### Checkpoint: Farmer Controls

- [ ] Beranda, Cek, Tanaman, and Alat use approved hierarchy.
- [ ] `npm run build` succeeds.
- [ ] Phone-width manual interaction check passes.

### Phase 3: History and Entry Flow

#### Task 5: Redesign Riwayat summaries and chart switcher

**Description:** Show Hari Ini/7 Hari summary status and findings before separate natural-light/lamp summary and one selected chart.

**Acceptance criteria:**
- [ ] Only Hari Ini and 7 Hari ranges are offered.
- [ ] Warning/danger produces `Hari ini perlu perhatian` with 2–3 findings.
- [ ] Only one chart is displayed at a time.

**Verification:**
- [ ] `npm run build` succeeds.
- [ ] Seeded safe and warning telemetry states render correctly.

**Dependencies:** Task 1

**Files likely touched:**
- `web-app/src/pages/HistoryPage.tsx`
- `web-app/src/components/MetricChart.tsx`
- `web-app/src/styles.css`

**Estimated scope:** M

#### Task 6: Finish splash and two-step setup

**Description:** Apply the approved floating strawberry splash, five-second fact rotation, reduced-motion fallback, and white two-step setup card with confirmation.

**Acceptance criteria:**
- [ ] Facts rotate every five seconds while loading.
- [ ] Reduced-motion disables decorative float/bounce.
- [ ] Setup asks name then phase before showing confirmation action.

**Verification:**
- [ ] `npm run build` succeeds.
- [ ] Manual test covers data-ready, 15-second no-data, and first setup paths.

**Dependencies:** Task 1

**Files likely touched:**
- `web-app/src/components/StartupScreen.tsx`
- `web-app/src/App.tsx`
- `web-app/src/styles.css`

**Estimated scope:** M

### Checkpoint: Final UI

- [ ] All four pages and entry flow meet approved spec.
- [ ] `npm run build` succeeds.
- [ ] Verify safe, warning, danger, offline, and no-data variants at 360px and 680px.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Existing partial UI changes overlap redesign | Medium | Preserve unrelated work; stage only specific files per task |
| Humidifier combined UI lacks firmware support | High | Present current internal states accurately; defer shared command behavior until firmware contract update |
| White text loses contrast on dark hero texture | Medium | Use dark overlay and test contrast before merge |
| Firebase currently appears to fall back to mock data | High | Verify data source separately; do not redesign around mock-only behavior |

## Open Questions

- Firmware/wiring documentation must confirm the revised 24V fan and mist loads before shared humidifier control is implemented.

## Approved Refinement Tasks

### Task 7: Repair hero hierarchy and page motion

**Description:** Remove greeting/duplicate action label from the hero, preserve white-text contrast, add phase/status chips, and implement approved card/page transitions.

**Acceptance criteria:**
- [ ] Hero shows phase/status chips, one headline, one risk line, and one action line.
- [ ] Hero text remains legible on every background texture.
- [ ] Card press and page transitions respect reduced-motion preference.

**Verification:**
- [ ] `npm run build` succeeds.
- [ ] Manual mobile contrast review passes.

**Dependencies:** Existing frontend redesign implementation

**Estimated scope:** M

### Task 8: Add Tanaman slide and research-based targets

**Description:** Add button/swipe horizontal slide behavior and replace phase target copy with approved research ranges.

**Acceptance criteria:**
- [ ] Buttons and swipe change current metric with a 180ms horizontal transition.
- [ ] Fase Berbunga and other phase targets match `docs/06-research/snowberry_iot_ai_clarity_en.md`.

**Verification:**
- [ ] `npm run build` succeeds.
- [ ] Manual swipe and button check at phone width passes.

**Dependencies:** Task 7

**Estimated scope:** M

### Task 9: Make manual feedback and tool icons explicit

**Description:** Add specific pending language after manual confirmation and use approved distinct system icons.

**Acceptance criteria:**
- [ ] Pending control state says what action is being sent.
- [ ] Confirmed states still wait for acknowledgement.
- [ ] Icons distinguish lamp, pump/soil, and humidifier.

**Verification:**
- [ ] `npm run build` succeeds.
- [ ] Mock command acknowledgement confirms text transition.

**Dependencies:** Task 7

**Estimated scope:** S

### Task 10: Make Riwayat detail metric-owned

**Description:** Reduce overview to state/count and render explanation, including light/lamp context, only for the selected metric.

**Acceptance criteria:**
- [ ] Overview has no detailed findings.
- [ ] Selected metric shows its specific explanation.
- [ ] Light/lamp summary appears only under Cahaya.

**Verification:**
- [ ] `npm run build` succeeds.
- [ ] Manual tab-switching review passes.

**Dependencies:** Task 7

**Estimated scope:** S

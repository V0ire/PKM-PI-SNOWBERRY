# Snowberry Farmer Frontend Redesign

**Date:** 2026-07-10  
**Status:** Approved design; awaiting written-spec review  
**Scope:** Mobile-first visual and interaction redesign for the farmer web app. This does not change Firebase paths or ESP32 control authority.

## Goal

Make Snowberry readable for non-technical farmers. Within ten seconds, Beranda must communicate the highest-priority action, current condition status, and plant phase without exposing technical controls or dense explanations.

All farmer-facing copy is Indonesian. Developer code and technical documentation remain English.

## Visual System

- Preserve the Starbucks source-of-truth palette: warm cream page canvas, white/off-white surfaces, Starbucks Green `#006241`, Green Accent `#00754a`, gold warning, and red danger.
- Use `docs/02-frontend/Design.md` only for layout language: 4px spacing rhythm, 20px rounded cards, compact status chips, and restrained layered shadows. Do not use its Airbnb red palette.
- Use Nunito Sans with system fallbacks. Body text is 14px; compact sensor values are 22px; all interactive targets remain at least 44px.
- Cards use a warm off-white surface, subtle border, dark-green-tinted soft shadow, 20px radius, and a colored left edge for status.
- Status text is explicit: `Aman · Nyaman`, `Perlu Cek · Terlalu Lembap`, or `Bahaya · ...`.
- `Perlu Cek` uses Starbucks gold/yellow. `Bahaya` uses pale red surface and dark red text. `Aman` uses green.
- The top bar is a minimal white surface containing Snowberry, greenhouse name, and connection pill.
- The bottom navigation is a fixed floating white pill with Beranda, Tanaman, Alat, and Riwayat.
- Motion is limited to pressed-button scale and page fade. The splash mark gently floats; `prefers-reduced-motion` disables decorative movement.

## Splash and Setup

### Splash

- Show a strawberry mark with a gentle float/bounce.
- Show one farmer fact, rotating every five seconds while loading.
- Wait for first Firebase data with a three-second minimum.
- After 15 seconds without data, open Beranda with: `Data greenhouse belum masuk. Cek listrik box Snowberry dan koneksi Wi-Fi. Hubungi tim teknis jika masalah berlanjut.`

### First Setup

Use a white, two-step card:

1. Nama Greenhouse.
2. Tahap Tanaman: Vegetatif, Berbunga, atau Buah.
3. Confirm with `Simpan dan Mulai Pantau`.

## Navigation

Primary navigation always has four entries:

1. Beranda
2. Tanaman
3. Alat
4. Riwayat

Detailed warnings are not a permanent navigation item. The Beranda hero link `Ada N masalah lain` opens a full-screen Cek view.

## Beranda

Order:

1. Minimal top bar.
2. Dark guided Aksi Utama hero.
3. Optional confirmed action button only when relevant, such as `Siram Kembali`.
4. Four compact sensor cards in a 2x2 grid.
5. Quiet data timestamp.
6. Small Tahap Tanaman card.
7. Fixed bottom navigation.

### Aksi Utama Hero

- Deep-green abstract gradient with subtle leaf texture. Darken any bright texture area to preserve white-text contrast.
- Shows phase chip, explicit status, highest-priority problem, risk explanation, exact farmer action, and `Ada N masalah lain` when other issues exist.
- For safe state, headline is `Kondisi greenhouse aman.`
- Does not include an action button unless an explicit confirmed command is available.

### Sensor Cards

- Show label, numeric value/unit, and qualitative status only.
- Primary number and label use dark green-black, never low-contrast gray.
- No sensor explanation on Beranda; details belong on Tanaman or Cek.
- White cards with colored edge accents are the default. A danger card uses pale red surface.

## Cek

- Opens from `Ada N masalah lain` in the hero.
- Lists all active warnings and dangers with meaning and farmer action.
- Does not add a permanent fifth navigation item.

## Tanaman

- Uses small green eyebrow, 28px title, and one-line helper.
- Presents one sensor at a time: Suhu, Udara, Cahaya, then Media.
- Shows `1 dari 4`, supports left/right swipe, and has visible `Sebelumnya` and `Berikutnya` controls.
- Each current sensor card shows numeric value, qualitative meaning, and one farmer action.
- Phase targets follow the four sensor cards as secondary information.

## Alat

- Uses small green eyebrow, title, and one-line helper.
- Shows one scroll page in this order: Lampu Tanam, Pompa Air, Pelembap Udara.
- Each card prioritizes current state, then short role, then Kontrol Manual Sementara entry.
- Pelembap Udara is one farmer-facing system card with separate state chips: `Kabut Menyala/Mati` and `Kipas Menyala/Mati`.
- AUTO and Kontrol Manual Sementara treat mist and fan as one shared humidifier system. Internal relay implementation remains separate.
- When humidity is high, the shared humidifier system turns off and the app tells the farmer to improve ventilation.

## Riwayat

- Uses small green eyebrow, title, and one-line helper.
- Switch only between Hari Ini and 7 Hari.
- Begins with overall status: `Hari ini perlu perhatian` when any warning or danger exists, then two or three plain-language findings.
- Shows natural-light and growlight-duration summary separately.
- Shows one selected chart at a time: Suhu, Udara, Cahaya, or Media.

## Constraints

- Maintain existing Firebase contract and local-first ESP32 control authority.
- BH1750 is a natural-light reference, not a growlight canopy sensor. Do not present combined DLI as measured fact.
- No settings page in this demo UI.
- No background push notification implementation in this redesign.
- The updated humidifier electrical revision must be reflected later in wiring and firmware contract documents: fan and mist are both 24V, separate relay channels, combined farmer-facing behavior.

## Validation

- `npm run build` passes after each screen slice.
- Test at 360px mobile width and a 680px centered desktop column.
- Verify touch targets are at least 44px.
- Verify white text against dark hero and primary card text against white/off-white surfaces.
- Test safe, warning, danger, offline, and no-data states.
- Test splash with reduced-motion preference.

## Deferred

- Firebase/ESP32 integration and live command acknowledgement are separate implementation tasks.
- Hardware/wiring update for the 24V humidifier revision is separate and must use the ESP32 safety workflow.
- Growlight canopy calibration and combined DLI.
- Farmer education page and push notifications.

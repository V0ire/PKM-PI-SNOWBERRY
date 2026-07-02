# Snowberry Antigravity Rules

## Rule Utama

Ikuti `AGENTS.md`.

## Frontend

Saat membuat atau mengubah UI:
- Kerja hanya di `web-app/`
- Baca `docs/02-frontend/DESIGN-starbucks.md`
- Baca `docs/00-antigravity/UI_UX_SNOWBERRY_PETANI_ID.md`
- Gunakan Bahasa Indonesia
- Gunakan istilah petani-friendly
- Mobile-first
- Jangan integrasi Firebase sebelum diminta
- Gunakan mock data dulu untuk tahap UI

## Product

Untuk scope dan alur:
- Baca `docs/01-product/overview.md`
- Baca `docs/01-product/prd.md`
- Baca `docs/01-product/ux-flow.md`

## Firebase

Untuk integrasi data:
- Baca `docs/03-technical/api-contract.md`
- Jangan gunakan path `sensorLog`
- Gunakan `telemetry/{YYYY-MM-DD}`

## Firmware

Untuk ESP32:
- Baca `docs/03-technical/wiring-schematic.md`
- Jangan ubah pin tanpa cek schematic
- Fail-safe harus jalan sebelum WiFi/sensor/Firebase

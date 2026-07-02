# Snowberry Agent Instructions

## Project Identity

Snowberry adalah project IoT Smart Greenhouse 4-in-1 untuk petani stroberi putih di Ciwidey.

Target:
- Web dashboard Bahasa Indonesia
- Petani-friendly
- Mobile-first
- Realtime monitoring
- Kontrol lokal ESP32 tetap menjadi sumber utama keputusan aktuator
- Firebase hanya untuk monitoring, konfigurasi, dan command overlay

## Folder Source of Truth

Baca dokumen ini sebelum coding:

1. `docs/00-antigravity/ANTIGRAVITY_MASTER_PROMPT_SNOWBERRY_ID.md`
2. `docs/00-antigravity/UI_UX_SNOWBERRY_PETANI_ID.md`
3. `docs/01-product/overview.md`
4. `docs/01-product/prd.md`
5. `docs/01-product/ux-flow.md`
6. `docs/01-product/content.md`
7. `docs/02-frontend/DESIGN-starbucks.md`
8. `docs/03-technical/api-contract.md`
9. `docs/03-technical/wiring-schematic.md`

## Prioritas Dokumen

Jika ada konflik:
1. Firestore/API: ikuti `docs/03-technical/api-contract.md`
2. Pin, wiring, fail-safe: ikuti `docs/03-technical/wiring-schematic.md`
3. UI visual, warna, font, spacing, style: ikuti `docs/02-frontend/DESIGN-starbucks.md`
4. Bahasa UI petani: ikuti `docs/00-antigravity/UI_UX_SNOWBERRY_PETANI_ID.md`
5. Scope produk: ikuti `docs/01-product/prd.md`
6. Gambaran besar project: ikuti `docs/01-product/overview.md`

## Hard Rules

- Jangan membuat fitur di luar MVP.
- Jangan membuat admin panel besar, SaaS multi-farm, marketplace, payment, atau AI diagnosis.
- Jangan mengubah dokumen di `docs/` kecuali diminta.
- Jangan menyimpan secret Firebase di repo.
- Jangan menaruh `.env` asli ke git.
- Jangan membuat firmware bergantung pada cloud untuk kontrol utama.
- Kalau WiFi/Firebase mati, ESP32 harus tetap bekerja dengan threshold terakhir di NVS.
- UI harus Bahasa Indonesia dan mudah dipahami petani.
- Frontend harus mengikuti `DESIGN-starbucks.md`.

## Istilah UI

Gunakan:
- Threshold -> Batas Otomatis
- Manual Override -> Kontrol Manual Sementara
- Fault -> Masalah
- Realtime -> Kondisi Sekarang
- Actuator -> Alat
- Device -> Perangkat
- Config -> Pengaturan

## Firestore Path Rules

Gunakan:
- `devices/{deviceId}/status/realtime`
- `devices/{deviceId}/config/thresholds`
- `devices/{deviceId}/config/commands`
- `devices/{deviceId}/telemetry/{YYYY-MM-DD}`

Jangan gunakan:
- `sensorLog`

## Work Style

- Kerjakan bertahap.
- Buat diff kecil.
- Untuk frontend, kerja di `web-app/`.
- Untuk firmware, kerja di `firmware/`.
- Untuk Firebase, kerja di `firebase/`.
- Setelah edit web-app, jalankan build/test jika tersedia.
- Setelah edit firmware, cek pin dari wiring schematic.
- Jangan over-engineering.

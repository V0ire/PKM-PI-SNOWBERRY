#!/usr/bin/env bash
set -u

echo "== Fix Snowberry folder structure =="

mkdir -p docs/00-antigravity
mkdir -p docs/01-product
mkdir -p docs/02-frontend
mkdir -p docs/03-technical
mkdir -p docs/04-field-notes

mkdir -p web-app/src web-app/public
mkdir -p firebase/seed-data
mkdir -p firmware/snowberry-esp32/src firmware/snowberry-esp32/include firmware/snowberry-esp32/lib
mkdir -p firmware/test-sketches/01-i2c-scan
mkdir -p firmware/test-sketches/02-sht30-bh1750-test
mkdir -p firmware/test-sketches/03-soil-calibration
mkdir -p firmware/test-sketches/04-relay-test
mkdir -p firmware/test-sketches/05-firebase-test
mkdir -p hardware/wiring hardware/datasheets hardware/photos
mkdir -p .agents/skills .agents/rules

move_if_exists() {
  src="$1"
  dst="$2"

  if [ -f "$src" ]; then
    mv "$src" "$dst"
    echo "Moved: $src -> $dst"
  fi
}

move_if_exists_anywhere() {
  filename="$1"
  dst_dir="$2"

  if [ -f "$filename" ]; then
    mv "$filename" "$dst_dir/"
    echo "Moved: $filename -> $dst_dir/"
  elif [ -f "docs/00-antigravity/$filename" ]; then
    :
  elif [ -f "docs/01-product/$filename" ]; then
    :
  elif [ -f "docs/02-frontend/$filename" ]; then
    :
  elif [ -f "docs/03-technical/$filename" ]; then
    :
  fi
}

move_if_exists_anywhere ANTIGRAVITY_MASTER_PROMPT_SNOWBERRY_ID.md docs/00-antigravity
move_if_exists_anywhere UI_UX_SNOWBERRY_PETANI_ID.md docs/00-antigravity
move_if_exists_anywhere SNOWBERRY_GAP_ANALYSIS_DAN_TAMBAHAN_MARKDOWN.md docs/00-antigravity

move_if_exists_anywhere prd.md docs/01-product
move_if_exists_anywhere ux-flow.md docs/01-product
move_if_exists_anywhere content.md docs/01-product
move_if_exists_anywhere device-pairing.md docs/01-product

if [ -f "overview.md" ]; then
  mv overview.md docs/01-product/overview.md
  echo "Moved: overview.md -> docs/01-product/overview.md"
fi

if [ -f "Overview.md" ]; then
  mv Overview.md docs/01-product/overview.md
  echo "Moved: Overview.md -> docs/01-product/overview.md"
fi

if [ -f "docs/02-technical/overview.md" ]; then
  mv docs/02-technical/overview.md docs/01-product/overview.md
  echo "Moved: docs/02-technical/overview.md -> docs/01-product/overview.md"
fi

if [ -f "docs/02-technical/DESIGN-starbucks.md" ]; then
  mv docs/02-technical/DESIGN-starbucks.md docs/02-frontend/DESIGN-starbucks.md
  echo "Moved: docs/02-technical/DESIGN-starbucks.md -> docs/02-frontend/DESIGN-starbucks.md"
fi

if [ -f "DESIGN-starbucks.md" ]; then
  mv DESIGN-starbucks.md docs/02-frontend/DESIGN-starbucks.md
  echo "Moved: DESIGN-starbucks.md -> docs/02-frontend/DESIGN-starbucks.md"
fi

move_if_exists_anywhere api-contract.md docs/03-technical
move_if_exists_anywhere wiring-schematic.md docs/03-technical

if [ -f "design.md" ]; then
  mkdir -p docs/99-archive
  mv design.md docs/99-archive/design-legacy.md
  echo "Archived: design.md -> docs/99-archive/design-legacy.md"
fi

if [ -f "docs/02-technical/design.md" ]; then
  mkdir -p docs/99-archive
  mv docs/02-technical/design.md docs/99-archive/design-legacy.md
  echo "Archived: docs/02-technical/design.md -> docs/99-archive/design-legacy.md"
fi

cat > AGENTS.md <<'EOF'
# Snowberry Agent Instructions

## Project Identity

Snowberry adalah project IoT Smart Greenhouse 4-in-1 untuk petani stroberi putih di Ciwidey.

Target utama:
- Web dashboard berbahasa Indonesia
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

Jangan gunakan `sensorLog`.

## Work Style

- Kerjakan bertahap.
- Buat diff kecil.
- Untuk frontend, kerja di `web-app/`.
- Untuk firmware, kerja di `firmware/`.
- Untuk Firebase, kerja di `firebase/`.
- Setelah edit web-app, jalankan build/test jika tersedia.
- Setelah edit firmware, cek pin dari wiring schematic.
EOF

cat > .agents/rules/snowberry-antigravity-rules.md <<'EOF'
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
EOF

mkdir -p .agents/skills/snowberry-frontend-design
cat > .agents/skills/snowberry-frontend-design/SKILL.md <<'EOF'
---
name: snowberry-frontend-design
description: Use when creating or editing Snowberry frontend UI, layout, color palette, typography, spacing, cards, dashboard visual hierarchy, responsive behavior, and component style.
---

# Snowberry Frontend Design Skill

Always read:
- `docs/02-frontend/DESIGN-starbucks.md`
- `docs/00-antigravity/UI_UX_SNOWBERRY_PETANI_ID.md`

## Rules

- Treat `DESIGN-starbucks.md` as the frontend visual source of truth.
- Follow its color palette, typography, spacing, radius, shadows, card layout, and interaction style.
- Keep UI mobile-first.
- Use Bahasa Indonesia for all visible text.
- Do not invent a new design system if `DESIGN-starbucks.md` already defines it.
- Dashboard must be calm, premium, agricultural, and easy for farmers.
- Use status labels with color and text, not color only.

## Output

When changing frontend:
1. Mention which design tokens/components were used.
2. Mention whether the page still follows mobile-first behavior.
3. Mention any deviation from `DESIGN-starbucks.md`.
EOF

mkdir -p docs/04-field-notes

if [ ! -f docs/04-field-notes/commissioning.md ]; then
  cat > docs/04-field-notes/commissioning.md <<'EOF'
# Checklist Commissioning Snowberry

- [ ] Jalur 12V dan 24V tidak tertukar
- [ ] Semua GND common
- [ ] Output LM2596 sudah 5.00V
- [ ] Fuse 12V terpasang
- [ ] Fuse 24V terpasang
- [ ] Pompa OFF saat boot
- [ ] Mist disc OFF saat boot
- [ ] Kipas OFF saat boot
- [ ] Growlight OFF saat boot
- [ ] ESP32 menyala stabil
- [ ] I2C scanner menemukan SHT30 dan BH1750
- [ ] Soil sensor terbaca
- [ ] Data masuk Firebase
- [ ] Dashboard tampil
EOF
fi

if [ ! -f docs/04-field-notes/kalibrasi-soil.md ]; then
  cat > docs/04-field-notes/kalibrasi-soil.md <<'EOF'
# Kalibrasi Soil Moisture

| Tanggal | Sensor | ADC Kering | ADC Basah | Catatan |
|---|---:|---:|---:|---|
| - | Soil 1 | - | - | - |

Jangan pakai angka default dari internet tanpa kalibrasi lapangan.
EOF
fi

cat > .gitignore <<'EOF'
node_modules/
dist/
build/
.env
.env.local
.DS_Store
.vscode/
.pio/
firmware/**/.pio/
firebase/.runtimeconfig.json
.codex-cache/
EOF

echo ""
echo "== Done =="
echo "Struktur sudah disesuaikan:"
echo "- overview.md sebagai gambaran utama project"
echo "- DESIGN-starbucks.md sebagai frontend design system"
echo "- api-contract dan wiring masuk technical"
echo ""
echo "Cek:"
echo "find docs -maxdepth 3 -type f | sort"

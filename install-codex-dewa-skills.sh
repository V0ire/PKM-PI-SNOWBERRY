#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="$(pwd)"
CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"

echo "== Snowberry Codex Dewa Skills Installer =="
echo "Project root : $PROJECT_ROOT"
echo "Codex home   : $CODEX_HOME"
echo ""

mkdir -p "$PROJECT_ROOT/.agents/skills"
mkdir -p "$PROJECT_ROOT/.agents/rules"
mkdir -p "$PROJECT_ROOT/.codex-cache/external-skills"
mkdir -p "$CODEX_HOME"
mkdir -p "$HOME/.agents/skills"

write_skill() {
  local skill_name="$1"
  mkdir -p "$PROJECT_ROOT/.agents/skills/$skill_name"
  cat > "$PROJECT_ROOT/.agents/skills/$skill_name/SKILL.md"
}

echo "== 1. Membuat AGENTS.md project =="

cat > "$PROJECT_ROOT/AGENTS.md" <<'EOF'
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
EOF

echo "== 2. Membuat global Codex guidance minimal =="

if [ -f "$CODEX_HOME/AGENTS.md" ]; then
  cp "$CODEX_HOME/AGENTS.md" "$CODEX_HOME/AGENTS.md.bak.$(date +%Y%m%d-%H%M%S)"
fi

cat > "$CODEX_HOME/AGENTS.md" <<'EOF'
# Global Codex Working Agreements

- Prefer small, reviewable diffs.
- Read repository AGENTS.md before editing.
- Do not add production dependencies without explaining why.
- Do not overwrite user files without checking current content.
- Always report commands run and checks performed.
- Be explicit about failed checks.
- For IoT, firmware, electrical, or safety-related work, prioritize fail-safe behavior over cleverness.
EOF

echo "== 3. Membuat Snowberry project-local skills =="

write_skill "snowberry-project-guardrails" <<'EOF'
---
name: snowberry-project-guardrails
description: Use for any Snowberry task. Enforces MVP scope, document source-of-truth order, Indonesian farmer-friendly UX, and IoT safety boundaries.
---

# Snowberry Project Guardrails

Use this skill before modifying Snowberry code.

## Required First Step

Identify the layer:
- docs
- web-app
- firebase
- firmware
- hardware

Then read the closest relevant docs.

## MVP Scope

Build only:
- Login
- Device pairing
- Dashboard realtime
- Sensor cards
- Actuator cards
- Kontrol Manual Sementara
- Batas Otomatis
- Riwayat grafik sederhana
- Fase Tanam / HST
- Notifikasi masalah dasar

Do not build:
- SaaS multi-farm dashboard
- Enterprise admin
- AI disease diagnosis
- Marketplace
- Complex analytics
- Payment
- Native mobile app

## Conflict Resolution

If documents conflict:
1. API/firestore wins from `docs/03-technical/api-contract.md`
2. Hardware safety wins from `docs/03-technical/wiring-schematic.md`
3. Frontend visual design wins from `docs/02-frontend/DESIGN-starbucks.md`
4. UX language wins from `docs/00-antigravity/UI_UX_SNOWBERRY_PETANI_ID.md`
5. Product scope wins from `docs/01-product/prd.md`

## Output Standard

When making changes:
- Explain changed files.
- Mention assumptions.
- Run available checks.
- Do not hide failed checks.
EOF

write_skill "snowberry-frontend-design" <<'EOF'
---
name: snowberry-frontend-design
description: Use when creating or editing Snowberry frontend UI, design system, layout, color palette, typography, spacing, responsive behavior, cards, dashboard, and visual polish.
---

# Snowberry Frontend Design Skill

Always read:
- `docs/02-frontend/DESIGN-starbucks.md`
- `docs/00-antigravity/UI_UX_SNOWBERRY_PETANI_ID.md`
- `docs/01-product/ux-flow.md`

## Rules

- Treat `DESIGN-starbucks.md` as the visual source of truth.
- Follow its color palette, typography, spacing, radius, shadows, and component feel.
- Do not invent a separate design system unless the doc is missing a token.
- Use mobile-first responsive design.
- Use Bahasa Indonesia for every visible UI string.
- Dashboard must feel calm, premium, agricultural, and easy for farmers.
- Use color plus text labels; never rely on color only.
- Make tap targets large enough for mobile use.

## UI Output Checklist

Before finishing:
- Dashboard readable within 10 seconds.
- Sensor states show Aman / Perlu Perhatian / Bahaya.
- Manual controls explain 30-minute temporary control.
- Empty/error/loading states use simple Indonesian.
- No English technical terms leak into farmer-facing UI.
EOF

write_skill "snowberry-ui-petani" <<'EOF'
---
name: snowberry-ui-petani
description: Use when writing Indonesian UI copy, buttons, labels, warnings, error states, dashboard text, onboarding text, and farmer-facing explanations.
---

# Snowberry UI Petani Skill

Use Bahasa Indonesia that is simple, calm, and practical.

## Preferred Terms

Use:
- Kondisi Sekarang
- Suhu Udara
- Kelembapan Udara
- Cahaya
- Kelembapan Tanah
- Lampu Tanam
- Pompa Air
- Kabut
- Kipas
- Batas Otomatis
- Kontrol Manual Sementara
- Kembali Otomatis
- Perpanjang 30 Menit
- Masalah
- Aman
- Perlu Perhatian
- Bahaya
- Menyala
- Mati

Avoid:
- threshold
- actuator
- override
- fault
- telemetry
- realtime
- device
- config
- payload
- snapshot

## Tone

- Do not blame the farmer.
- Give practical next action.
- Avoid scary language unless safety-critical.
- Prefer short sentences.

## Manual Control Copy

Always explain:
- Automatic control is paused temporarily.
- It returns to automatic mode after 30 minutes.
- The farmer can return to automatic mode anytime.
EOF

write_skill "snowberry-firebase-contract" <<'EOF'
---
name: snowberry-firebase-contract
description: Use when implementing Firebase Auth, Firestore reads/writes, realtime listeners, thresholds, commands, telemetry, seed data, or security rules for Snowberry.
---

# Snowberry Firebase Contract Skill

Always read:
- `docs/03-technical/api-contract.md`

## Valid Paths

Use:
- `devices/{deviceId}/status/realtime`
- `devices/{deviceId}/config/thresholds`
- `devices/{deviceId}/config/commands`
- `devices/{deviceId}/telemetry/{YYYY-MM-DD}`
- `users/{uid}`

Do not use:
- `sensorLog`
- random flat sensor collections
- one document per sensor per minute

## Realtime Dashboard

Read:
- `devices/{deviceId}/status/realtime`

Expected fields:
- `sensors.temperature_c`
- `sensors.humidity_pct`
- `sensors.lux`
- `sensors.soil_pct`
- `sensors.psu_voltage`
- `actuators.growlight`
- `actuators.pump`
- `actuators.mist`
- `actuators.fan`
- `device.online`
- `fault.active_code`
- `fault.active_message`
- `last_seen`

## Threshold Validation

Validate:
- `temp_low < temp_high`
- `rh_low < rh_high`
- `soil_low < soil_high`
- `lux_low < lux_high`
- `pump_pulse_ms <= soak_period_ms`

## Manual Command Payload

Write to:
- `devices/{deviceId}/config/commands`

Payload:
- `actuator`
- `mode`
- `state`
- `manual_until`
- `issued_at`
- `issued_by`

Manual mode expires after 30 minutes.
EOF

write_skill "snowberry-esp32-safety" <<'EOF'
---
name: snowberry-esp32-safety
description: Use when editing Snowberry ESP32 firmware, GPIO mapping, relay/SSR control, sensors, WiFi, NVS, fail-safe behavior, or Firebase sync.
---

# Snowberry ESP32 Safety Skill

Always read:
- `docs/03-technical/wiring-schematic.md`
- `docs/01-product/overview.md`

## Pin Rules

Known mapping:
- GPIO 21: I2C SDA
- GPIO 22: I2C SCL
- GPIO 34: Soil ADC
- GPIO 35: Voltage divider ADC
- GPIO 16: SSR growlight, active HIGH
- GPIO 17: Pump relay, active LOW
- GPIO 18: Mist relay, active LOW
- GPIO 19: Fan relay, active LOW
- GPIO 4: Button
- GPIO 25: SSR spare, active HIGH

Do not use flash pins:
- GPIO 6, 7, 8, 9, 10, 11

Avoid strapping pins:
- GPIO 0, 2, 5, 12, 15

## Fail-safe

First action in setup:
- Set SSR pins LOW.
- Set relay pins HIGH.
- Confirm all actuators OFF before WiFi, Firebase, or sensors.

## Control Philosophy

- Use bang-bang control with hysteresis.
- Do not use PID for relay/SSR ON/OFF actuators.
- Pump must use pulsed watering plus soak period.
- If sensor data is invalid for too long, related actuator goes OFF.
- Local ESP32 control must keep working without WiFi.
- Store thresholds and calibration in NVS.
- Do not log long-term telemetry into ESP32 flash.
EOF

write_skill "snowberry-react-vite-builder" <<'EOF'
---
name: snowberry-react-vite-builder
description: Use when creating or editing the Snowberry web-app React/Vite frontend, components, state, routing, mock data, build scripts, and frontend checks.
---

# Snowberry React Vite Builder Skill

Work only in `web-app/` unless asked otherwise.

## Preferred MVP Frontend Stack

- React
- TypeScript
- Vite
- CSS modules or plain CSS first
- Tailwind only if the project already uses it or user asks

## Development Flow

1. Inspect `web-app/package.json`.
2. Inspect current `src/`.
3. Make small changes.
4. Run:
   - `npm install` if dependencies are missing
   - `npm run build` if available
5. Report changed files and build result.

## Mock-first Rule

For the first UI milestone:
- Use local mock data.
- Do not integrate Firebase unless explicitly requested.
- Keep data structures close to `api-contract.md`.

## Component Priorities

Build:
- Dashboard shell
- Sensor cards
- Actuator cards
- Batas Otomatis form
- Riwayat chart placeholder
- Fase Tanam/HST page
- Loading/empty/error states
EOF

write_skill "snowberry-debug-review" <<'EOF'
---
name: snowberry-debug-review
description: Use when reviewing, debugging, or stabilizing Snowberry code before committing. Focuses on small diffs, tests, build errors, safety, and regression checks.
---

# Snowberry Debug Review Skill

## Review Order

1. Understand user request.
2. Check changed files.
3. Run available checks.
4. Fix only relevant issues.
5. Re-run checks.
6. Summarize clearly.

## For Frontend

Run if available:
- `npm run build`
- `npm run lint`
- `npm test`

Check:
- No farmer-facing English technical terms.
- No broken mobile layout.
- No fake Firebase paths.
- No leaked secrets.

## For Firmware

Check:
- Fail-safe setup is first.
- Relay active-low logic is correct.
- SSR active-high logic is correct.
- No blocking delay that breaks watchdog/control loop.
- WiFi failure does not stop local control.

## For Firebase

Check:
- Paths match `api-contract.md`.
- Rules do not expose arbitrary public writes.
- Manual command expires.
EOF

write_skill "snowberry-doc-sync" <<'EOF'
---
name: snowberry-doc-sync
description: Use when checking whether implementation matches Snowberry markdown docs, or when producing a concise implementation plan from docs.
---

# Snowberry Doc Sync Skill

## Source Docs

Read in this order:
1. `AGENTS.md`
2. `docs/00-antigravity/ANTIGRAVITY_MASTER_PROMPT_SNOWBERRY_ID.md`
3. `docs/00-antigravity/UI_UX_SNOWBERRY_PETANI_ID.md`
4. `docs/01-product/overview.md`
5. `docs/01-product/prd.md`
6. `docs/01-product/ux-flow.md`
7. `docs/02-frontend/DESIGN-starbucks.md`
8. `docs/03-technical/api-contract.md`
9. `docs/03-technical/wiring-schematic.md`

## Output

When planning:
- Separate MVP from later features.
- Identify exact files to edit.
- Avoid vague "we can add later" scope creep.
- Mention any document conflict.
EOF

echo "== 4. Membuat rules tambahan =="

cat > "$PROJECT_ROOT/.agents/rules/snowberry-codex-usage.md" <<'EOF'
# Snowberry Codex Usage

Recommended prompt:

Ikuti AGENTS.md. Gunakan skill Snowberry yang relevan. Untuk frontend, baca DESIGN-starbucks.md dan UI_UX_SNOWBERRY_PETANI_ID.md. Kerjakan hanya di web-app/. Jangan integrasi Firebase dulu kecuali saya minta.

Recommended explicit skills:
- $snowberry-project-guardrails
- $snowberry-frontend-design
- $snowberry-ui-petani
- $snowberry-firebase-contract
- $snowberry-esp32-safety
- $snowberry-react-vite-builder
- $snowberry-debug-review
- $snowberry-doc-sync
EOF

echo "== 5. Install / clone external tools and skill catalogs =="

if command -v git >/dev/null 2>&1; then
  echo "-- Cloning Ponytail catalog/plugin repo"
  if [ ! -d "$PROJECT_ROOT/.codex-cache/external-skills/ponytail" ]; then
    git clone https://github.com/DietrichGebert/ponytail.git "$PROJECT_ROOT/.codex-cache/external-skills/ponytail" || true
  else
    git -C "$PROJECT_ROOT/.codex-cache/external-skills/ponytail" pull --ff-only || true
  fi

  if [ -d "$PROJECT_ROOT/.codex-cache/external-skills/ponytail/skills/ponytail" ]; then
    rm -rf "$PROJECT_ROOT/.agents/skills/ponytail"
    cp -R "$PROJECT_ROOT/.codex-cache/external-skills/ponytail/skills/ponytail" "$PROJECT_ROOT/.agents/skills/ponytail" || true
  fi

  echo "-- Cloning Caveman AI Skills"
  if [ ! -d "$PROJECT_ROOT/.codex-cache/external-skills/caveman-ai-skills" ]; then
    git clone https://github.com/alinaeembaig/caveman-ai-skills.git "$PROJECT_ROOT/.codex-cache/external-skills/caveman-ai-skills" || true
  else
    git -C "$PROJECT_ROOT/.codex-cache/external-skills/caveman-ai-skills" pull --ff-only || true
  fi

  if [ -f "$PROJECT_ROOT/.codex-cache/external-skills/caveman-ai-skills/scripts/install-project-codex.sh" ]; then
    bash "$PROJECT_ROOT/.codex-cache/external-skills/caveman-ai-skills/scripts/install-project-codex.sh" || true
  fi

  echo "-- Cloning Awesome Agent Skills as catalog only"
  if [ ! -d "$PROJECT_ROOT/.codex-cache/external-skills/awesome-agent-skills-voltagent" ]; then
    git clone https://github.com/VoltAgent/awesome-agent-skills.git "$PROJECT_ROOT/.codex-cache/external-skills/awesome-agent-skills-voltagent" || true
  else
    git -C "$PROJECT_ROOT/.codex-cache/external-skills/awesome-agent-skills-voltagent" pull --ff-only || true
  fi

  if [ ! -d "$PROJECT_ROOT/.codex-cache/external-skills/awesome-agent-skills-skillmatic" ]; then
    git clone https://github.com/skillmatic-ai/awesome-agent-skills.git "$PROJECT_ROOT/.codex-cache/external-skills/awesome-agent-skills-skillmatic" || true
  else
    git -C "$PROJECT_ROOT/.codex-cache/external-skills/awesome-agent-skills-skillmatic" pull --ff-only || true
  fi
else
  echo "git tidak ditemukan. Skip clone external repositories."
fi

echo "== 6. Install RTK AI jika belum ada =="

if command -v rtk >/dev/null 2>&1; then
  echo "rtk sudah terpasang: $(command -v rtk)"
else
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh || true
  else
    echo "curl tidak ditemukan. Skip RTK install."
  fi
fi

if [ -x "$HOME/.local/bin/rtk" ]; then
  export PATH="$HOME/.local/bin:$PATH"
fi

if command -v rtk >/dev/null 2>&1; then
  rtk init -g --codex || true
  rtk init --agent antigravity || true
fi

echo "== 7. Membuat helper prompt untuk Codex =="

cat > "$PROJECT_ROOT/start-codex-snowberry.txt" <<'EOF'
Ikuti AGENTS.md.

Gunakan skill:
- $snowberry-project-guardrails
- $snowberry-frontend-design
- $snowberry-ui-petani
- $snowberry-react-vite-builder
- $snowberry-debug-review

Tugas awal:
Kerjakan hanya di web-app/.
Buat UI mock Snowberry mobile-first Bahasa Indonesia.
Wajib mengikuti docs/02-frontend/DESIGN-starbucks.md.
Jangan integrasi Firebase dulu.
Gunakan mock data yang bentuknya mirip api-contract.md.
Jangan membuat fitur di luar MVP.
EOF

echo "== 8. Ringkasan skill terpasang =="

echo ""
echo "Repo-local skills:"
find "$PROJECT_ROOT/.agents/skills" -maxdepth 2 -name SKILL.md | sort

echo ""
echo "Global Codex instructions:"
echo "$CODEX_HOME/AGENTS.md"

echo ""
echo "Catalog eksternal disimpan di:"
echo "$PROJECT_ROOT/.codex-cache/external-skills"

echo ""
echo "== Selesai =="
echo ""
echo "Kalau pakai fish dan rtk belum kebaca, jalankan:"
echo "fish_add_path ~/.local/bin"
echo ""
echo "Untuk Ponytail plugin Codex, kalau command codex tersedia, jalankan manual:"
echo "codex plugin marketplace add DietrichGebert/ponytail"
echo "codex"
echo "lalu buka /plugins dan /hooks untuk review/trust."
echo ""
echo "Prompt awal tersimpan di:"
echo "$PROJECT_ROOT/start-codex-snowberry.txt"

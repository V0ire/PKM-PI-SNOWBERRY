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

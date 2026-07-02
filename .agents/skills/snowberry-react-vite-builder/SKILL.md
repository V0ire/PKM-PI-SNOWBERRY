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

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

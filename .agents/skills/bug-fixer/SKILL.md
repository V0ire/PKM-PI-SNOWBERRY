---
name: bug-fixer
description: Use when investigating and fixing bugs in any stack. Emphasizes reproduction, root-cause analysis, minimal safe fixes, regression checks, and clear risk reporting.
---

# Bug Fixer

## Purpose

Fix defects safely and explain the root cause.

## Project harness safety

Project instructions and existing harness files override this skill. Read them first when present. Do not alter harness files unless explicitly asked.

## Workflow

1. Understand the observed behavior and expected behavior.
2. Find relevant logs, errors, stack traces, screenshots, tests, or user reports.
3. Locate the smallest relevant code path.
4. Reproduce the issue where possible, or reason clearly when reproduction is not possible.
5. Identify root cause, not only the symptom.
6. Implement the smallest safe fix.
7. Add or update regression tests where practical.
8. Run relevant tests/builds when possible.
9. Explain the fix and remaining risks.

## Debugging checklist

Check for:

- incorrect condition grouping
- null/undefined handling
- type mismatches
- time zone/date edge cases
- permissions/auth issues
- race conditions
- cache/state issues
- database query mistakes
- API contract mismatch
- frontend rendering/state bugs
- environment/config differences

## Rules

- Avoid broad rewrites for small bugs.
- Do not hide errors unless the project already uses that pattern.
- Prefer clear failure modes and meaningful logging.
- Preserve existing behavior outside the bug scope.

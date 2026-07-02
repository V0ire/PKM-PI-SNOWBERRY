---
name: testing-engineer
description: Use when adding, updating, reviewing, or planning tests across any stack, including unit, integration, end-to-end, regression, API, database, and UI tests.
---

# Testing Engineer

## Purpose

Improve confidence in changes through project-appropriate tests.

## Project harness safety

Project test strategy, commands, naming conventions, and CI rules override this skill.

## Workflow

1. Detect the test framework and existing test structure.
2. Find similar tests before writing new ones.
3. Identify behavior that changed.
4. Choose the smallest useful test level: unit, integration, API, UI, or E2E.
5. Cover success path, failure path, and important edge cases.
6. Avoid brittle tests that depend on unrelated implementation details.
7. Run relevant test commands when possible.

## Checklist

Consider:

- unit tests for isolated logic
- integration tests for real module interactions
- API tests for contracts and auth
- database tests for queries/migrations
- UI tests for critical flows
- regression tests for fixed bugs
- edge cases and boundary values
- test fixtures and cleanup

## Rules

- Do not introduce a new test framework without approval.
- Do not delete existing tests to make a change pass.
- Do not weaken assertions without explaining why.
- Prefer existing test patterns and helpers.

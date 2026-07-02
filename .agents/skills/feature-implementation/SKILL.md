---
name: feature-implementation
description: Use when adding or modifying application features in any programming language or framework. Focuses on project-safe, minimal, testable implementation.
---

# Feature Implementation

## Purpose

Implement features safely while respecting the existing project harness, architecture, and conventions.

## Project harness safety

Before editing, read project-specific guidance. If any project instruction conflicts with this skill, follow the project instruction.

Do not modify project harness files unless explicitly requested.

## Workflow

1. Understand the request and acceptance criteria.
2. Inspect project harness and relevant documentation.
3. Locate existing similar implementations.
4. Identify the smallest set of files likely to change.
5. Follow existing naming, folder structure, validation, error handling, and testing style.
6. Implement the feature with minimal unrelated edits.
7. Add or update tests when behavior changes.
8. Run relevant checks when possible.
9. Summarize changes, tests, risks, and assumptions.

## Implementation rules

- Do not introduce a new architecture unless requested.
- Do not add dependencies unless necessary and approved.
- Do not change public APIs without noting compatibility impact.
- Do not change database schema without migration and rollback consideration.
- Do not hardcode secrets.
- Keep UI, API, database, and business logic changes aligned with existing patterns.

## Final response checklist

- What changed
- Files touched
- Tests/checks run
- Risks or assumptions
- Manual verification steps if needed

---
name: project-discovery
description: Use before implementing, debugging, reviewing, refactoring, or documenting any software project. Detects language, framework, database, architecture, package manager, test commands, build commands, deployment style, and project harness files.
---

# Project Discovery

## Purpose

Understand the project before changing it.

## Instruction priority

Project-specific instructions always override this universal skill. Before applying this workflow, inspect and respect:

- `AGENTS.md`
- `CLAUDE.md`
- `CODEX.md`
- `README.md`
- `docs/`
- `.harness/`
- `.agents/`
- `.claude/`
- `.github/`
- existing code patterns

Do not modify project harness files unless explicitly requested.

## Discovery checklist

Inspect root files and configuration:

- package files: `package.json`, `composer.json`, `requirements.txt`, `pyproject.toml`, `go.mod`, `pom.xml`, `build.gradle`, `Gemfile`, `.csproj`
- environment/config examples: `.env.example`, `config/`, `settings/`
- containers and deployment: `Dockerfile`, `docker-compose.yml`, `k8s/`, `.github/workflows/`, `Makefile`
- documentation: `README.md`, `docs/`, `.harness/`
- tests: `tests/`, `spec/`, `__tests__/`, `cypress/`, `playwright/`

Detect:

- main language/runtime
- framework
- database and ORM/query layer
- frontend stack
- backend stack
- queue/background job system
- package manager
- build commands
- test commands
- lint/static analysis commands
- deployment or CI workflow

## Output

Provide a concise project map:

- detected stack
- important directories
- key commands
- existing harness files
- likely risk areas
- recommended next steps

## Rules

- Do not assume the stack.
- Do not introduce architecture.
- Do not edit before discovery unless the user explicitly asks for a small direct change.
- Existing project patterns are the source of truth.

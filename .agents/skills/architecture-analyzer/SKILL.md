---
name: architecture-analyzer
description: Use to understand or document a software project's architecture, module boundaries, data flow, dependencies, and design patterns without forcing a new architecture.
---

# Architecture Analyzer

## Purpose

Analyze the current architecture of a project and explain how it works.

## Project harness safety

Project-specific harnessing always overrides this skill. Read existing project instructions first. Do not reorganize architecture, rename modules, or introduce new patterns unless explicitly requested.

## What to inspect

- entry points
- routing or command handlers
- controllers, handlers, services, use cases, actions, jobs, workers
- models, entities, schemas, migrations
- API boundaries
- frontend component structure
- background tasks
- external integrations
- configuration and dependency injection
- test structure

## Analysis goals

Identify:

- architectural style already used
- main layers or modules
- dependencies between modules
- data flow
- side effects
- coupling and risk areas
- repeated patterns worth following
- areas that are fragile or unclear

## Rules

- Describe the existing architecture; do not prescribe a new one by default.
- Prefer improving within current boundaries.
- Do not force Clean Architecture, DDD, MVC, microservices, monolith, service classes, repositories, or event-driven design unless the project already uses them or the user asks.
- Explain trade-offs clearly when suggesting improvements.

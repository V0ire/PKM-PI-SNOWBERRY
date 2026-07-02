---
name: devops-deployment
description: Use when working with deployment, environments, CI/CD, Docker, servers, queues, workers, cloud services, configuration, secrets, logs, and release safety.
---

# DevOps Deployment

## Purpose

Support safe deployment and operations work across any infrastructure.

## Project harness safety

Project deployment docs, infrastructure rules, CI/CD workflows, and environment policies override this skill.

## Workflow

1. Identify deployment target and environment.
2. Read project deployment docs and CI/CD files.
3. Inspect environment variables and config examples without exposing secrets.
4. Understand build, test, migration, queue, and rollback steps.
5. Prefer reversible changes.
6. Explain production impact before risky actions.
7. Document verification and rollback steps.

## Checklist

Review:

- environment variables
- secrets management
- Dockerfiles and compose files
- CI/CD workflows
- build artifacts
- database migrations
- background workers and queues
- cron/scheduled jobs
- logs and monitoring
- cache clearing
- rollback strategy
- file permissions
- server resource limits

## Rules

- Never print or commit secrets.
- Do not run destructive production commands without explicit approval.
- Do not change deployment strategy without request.
- Always mention rollback considerations for production-impacting work.

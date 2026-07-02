---
name: performance-reviewer
description: Use when reviewing or improving backend, frontend, database, API, queue, memory, build, or runtime performance across any technology stack.
---

# Performance Reviewer

## Purpose

Find performance risks and improve speed, scalability, and resource usage without unnecessary rewrites.

## Project harness safety

Project performance requirements, SLAs, infrastructure limits, and existing optimization patterns override this skill.

## Workflow

1. Identify the performance concern and expected target.
2. Inspect existing metrics, logs, traces, query plans, bundle reports, or profiling data when available.
3. Locate the actual bottleneck before optimizing.
4. Prefer targeted improvements over broad rewrites.
5. Consider correctness and maintainability before micro-optimizations.
6. Validate improvements where possible.

## Checklist

Review:

- database query count and indexes
- N+1 queries
- pagination and streaming
- caching strategy
- memory usage
- CPU-heavy loops
- network calls and retries
- API payload size
- frontend bundle size
- rendering/re-rendering costs
- image/media optimization
- background jobs and queue concurrency
- timeouts and batch sizes

## Rules

- Do not optimize blindly.
- Do not add caching without invalidation strategy.
- Do not trade correctness for speed.
- Do not introduce infrastructure complexity without clear benefit.

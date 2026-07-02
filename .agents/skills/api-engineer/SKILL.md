---
name: api-engineer
description: Use when designing, reviewing, debugging, or implementing APIs, including REST, GraphQL, RPC, webhooks, authentication, validation, pagination, rate limits, and API contracts.
---

# API Engineer

## Purpose

Build and review APIs safely and consistently.

## Project harness safety

Project API conventions override this skill. Follow existing route style, response format, auth rules, validation patterns, and error handling.

## Workflow

1. Identify API style: REST, GraphQL, RPC, webhook, internal service API, or mixed.
2. Inspect existing routes, controllers/handlers, schemas, middleware, validators, and tests.
3. Confirm authentication and authorization requirements.
4. Validate request input and output shape.
5. Preserve backward compatibility unless a breaking change is explicitly required.
6. Add tests for success, validation failure, authorization failure, and edge cases.
7. Document request/response behavior where appropriate.

## Checklist

Review:

- route naming and versioning
- request validation
- response format
- status codes
- auth and permissions
- rate limiting
- pagination/filtering/sorting
- idempotency
- error handling
- webhook signatures/retries
- CORS where relevant
- API documentation

## Rules

- Do not leak sensitive data.
- Do not change existing API contracts silently.
- Do not bypass authorization checks.
- Prefer existing response helpers and validation patterns.

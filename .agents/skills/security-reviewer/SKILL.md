---
name: security-reviewer
description: Use when reviewing or implementing changes that affect authentication, authorization, secrets, input validation, file uploads, payments, webhooks, permissions, data exposure, or other security-sensitive areas.
---

# Security Reviewer

## Purpose

Identify and reduce security risks while respecting the project’s existing security model.

## Project harness safety

Project security rules, compliance requirements, and authentication/authorization conventions override this skill.

## Review checklist

Check for:

- missing authorization checks
- authentication bypasses
- insecure direct object references
- SQL/NoSQL injection
- command injection
- XSS and unsafe HTML rendering
- CSRF issues
- insecure file uploads
- path traversal
- exposed secrets or tokens
- weak webhook verification
- unsafe redirects
- sensitive data leakage in logs/responses
- overly permissive CORS
- insecure session/cookie settings
- privilege escalation

## Workflow

1. Identify security-sensitive data and operations.
2. Locate existing auth, permission, validation, and sanitization patterns.
3. Follow existing security conventions.
4. Add server-side validation even when client-side validation exists.
5. Avoid exposing secrets in code, logs, screenshots, or docs.
6. Add tests for authorization and validation where practical.
7. Clearly explain any remaining risks.

## Rules

- Never hardcode credentials.
- Never weaken auth or permission checks without explicit instruction.
- Never expose private user data unnecessarily.
- Prefer secure defaults and least privilege.

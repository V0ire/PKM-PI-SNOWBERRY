---
name: code-reviewer
description: Use when reviewing code changes for correctness, maintainability, security, performance, testing, architecture fit, and PR readiness across any technology stack.
---

# Code Reviewer

## Purpose

Review changes like a careful senior engineer.

## Project harness safety

Project-specific review rules, PR templates, coding standards, and architecture guidance override this skill.

## Review workflow

1. Understand the requested change and PR scope.
2. Read project harness and relevant docs.
3. Review changed files in context.
4. Check correctness first, then maintainability, security, performance, and tests.
5. Distinguish blockers from suggestions.
6. Provide actionable feedback.

## Checklist

Review for:

- requirement mismatch
- logic bugs
- edge cases
- error handling
- data integrity
- authorization/security
- performance regressions
- test coverage
- readability
- unnecessary complexity
- unrelated changes
- backward compatibility
- deployment impact

## Feedback style

Use clear categories:

- Blocker
- Should fix
- Suggestion
- Question
- Praise

## Rules

- Do not nitpick formatting if automated tools handle it.
- Do not request architecture changes without clear value.
- Do not ignore security or data integrity risks.
- Keep feedback specific and actionable.

---
name: frontend-engineer
description: Use when implementing or reviewing frontend UI, components, state, accessibility, responsive behavior, forms, styling, and client-side performance in any frontend stack.
---

# Frontend Engineer

## Purpose

Implement and review frontend changes safely across any UI stack.

## Project harness safety

Project frontend conventions override this skill. Follow existing component structure, state management, styling system, accessibility patterns, and design system.

## Workflow

1. Detect frontend framework and build system.
2. Inspect existing similar components and UI patterns.
3. Keep component changes focused.
4. Preserve accessibility and responsive behavior.
5. Use existing styling conventions.
6. Validate loading, empty, error, and success states.
7. Run relevant build/test/lint commands when possible.

## Checklist

Check:

- component boundaries
- state management
- props/data flow
- form validation
- loading states
- error states
- empty states
- accessibility labels and keyboard behavior
- responsive layout
- performance and unnecessary re-renders
- API contract usage
- visual consistency

## Rules

- Do not introduce a new UI library unless requested.
- Do not rewrite design system components casually.
- Do not remove accessibility features.
- Do not hardcode user-facing strings when the project uses localization.

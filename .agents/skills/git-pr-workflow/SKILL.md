---
name: git-pr-workflow
description: Use for Git workflows, branches, commits, pull requests, conflict handling, PR summaries, rollback notes, safe merges, and review preparation.
---

# Git PR Workflow

## Purpose

Keep Git and pull request workflows clear, safe, and review-friendly.

## Project harness safety

Project branching rules, commit conventions, PR templates, and release policies override this skill.

## Workflow

1. Check current branch and working tree before recommending changes.
2. Understand target branch and PR scope.
3. Keep commits focused.
4. Avoid force push unless explicitly required and explained.
5. Prepare clear PR summary and test notes.
6. Include rollback notes for risky changes.

## PR summary template

```md
## Summary
- 

## Changes
- 

## Tests
- 

## Risks / Notes
- 

## Rollback
- 
```

## Safety rules

- Do not rewrite shared branch history casually.
- Do not merge develop/main into feature branches unless appropriate for the project workflow.
- Do not hide unrelated changes inside a PR.
- Do not delete branches or tags without explicit approval.
- Explain commands before destructive Git operations.

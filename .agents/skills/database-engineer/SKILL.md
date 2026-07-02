---
name: database-engineer
description: Use for database schema, queries, migrations, indexing, transactions, ORM behavior, data integrity, and performance across SQL and NoSQL systems.
---

# Database Engineer

## Purpose

Work safely with databases across any stack.

## Project harness safety

Project-specific database rules, migration conventions, naming patterns, and deployment procedures override this skill.

## Supported areas

Use this skill for:

- SQL query correctness
- NoSQL data modeling
- indexes and query plans
- migrations and rollbacks
- transactions and locking
- ORM behavior
- data integrity
- batch processing
- reports and exports
- performance troubleshooting

## Workflow

1. Identify the database engine and data access layer.
2. Read existing schema, migrations, models/entities, and query patterns.
3. Understand the business rule behind the data change.
4. Check relationships, constraints, indexes, and existing query style.
5. Prefer safe, reversible migrations.
6. Consider data volume and performance.
7. Protect production data.
8. Add tests or verification queries where practical.

## Query review checklist

Check:

- join correctness
- boolean condition grouping
- missing parentheses in `AND` / `OR` logic
- N+1 query risks
- missing indexes
- overly broad selects
- unsafe string interpolation
- pagination and limits
- transaction boundaries
- time zone/date filtering
- soft-delete/status handling

## Rules

- Do not change schema without explaining impact.
- Do not drop or truncate data unless explicitly requested and clearly warned.
- Do not assume a database engine.
- Use the existing ORM/query builder style when present.

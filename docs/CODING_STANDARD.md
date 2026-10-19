# Coding Standard SIMUKPBJ

## Architecture

- Use Next.js App Router and TypeScript strict checks.
- Prefer Server Components for read/data composition; add `"use client"` only for browser state/effects/charts.
- Keep authentication/authorization and database writes server-side.
- Reuse shared AppHeader, Sidebar, shell, formatters, workflow helpers, and permission helpers.
- Do not duplicate domain logic in pages; extract pure transformations/services when reused.

## TypeScript and naming

- Avoid `any`; validate unknown external input with Zod.
- Components/types: PascalCase; functions/variables: camelCase; constants: descriptive camel/UPPER case consistently.
- File/route names follow existing kebab-case/App Router conventions.
- Never invent enum strings; import Prisma enums or use typed canonical mappings.

## Data and Prisma

- Select only required fields for APIs; never return hashes/secrets.
- Use transactions for multi-record atomic actions.
- Preserve Decimal precision; do not scale money by guessing.
- Prevent N+1 queries and child-row double counting.
- Mirror schema `VarChar`, enum, nullability, unique, numeric and date constraints in server validation.
- Never run destructive production commands or unreviewed schema pushes.

## Server actions and route handlers

Each sensitive operation must: authenticate; authorize role; authorize object/unit scope; validate input; enforce transition/business rule; write atomically; return safe errors; log/audit when required; invalidate affected cache/path.

## UI

- Scope feature styling; never use broad selectors that alter global navigation.
- Dashboard code must not instantiate Sidebar/AppHeader outside the established layout pattern.
- Provide loading, empty, and error states; do not use zero as an error fallback.
- Production metrics must never be hardcoded/mock data.
- Charts require explicit container size, responsive behavior, exact tooltip semantics, and non-misleading interpolation.

## Error and logging

- Map validation/conflict/not-found errors to clear safe messages.
- Log technical identifiers/codes, not secrets, JWTs, passwords, or sensitive payloads.
- Do not expose Prisma/stack messages to users.

## Quality gate

For relevant changes run `npx tsc --noEmit`, `npm run lint`, Prisma validation when schema/data access changes, available tests, and `npm run build`. Report unavailable tests honestly.

## Documentation definition of done

Before completing any code task:

1. Read relevant docs.
2. Assess documentation impact.
3. Update only affected documents in the same task.
4. Add meaningful documentation changes to `docs/CHANGELOG.md`.
5. Report files, content, reason, status, and any unverified facts.

Examples: Dashboard UI -> Design System/design brief/PRD if requirements change; KPI -> Business Rules/Data Dictionary/PRD/Testing; schema -> Database/Data Dictionary/Architecture; workflow -> Workflow/Business Rules/Validation/RBAC; auth -> Security/RBAC/Architecture.

Repository-wide agent policy is in root [AGENTS.md](../AGENTS.md).

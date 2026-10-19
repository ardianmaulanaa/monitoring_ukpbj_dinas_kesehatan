# Security Standard SIMUKPBJ

> Canonical concise security baseline. The expanded operational checklist remains in [security-standards.md](security-standards.md); where wording conflicts, this file and verified code audit take precedence until review.

## Authentication

- Passwords are bcrypt hashes; never log/return them.
- JWT session lifetime is 8 hours and requires `JWT_SECRET`.
- Cookie must be HttpOnly/Secure/SameSite as appropriate to environment; verify actual login route settings before release.
- Server handlers use `verifySessionToken`; presence of a cookie is not authentication.

## Authorization

- Enforce route, role, action, and object/unit scope on server.
- Proxy role decoding is an early navigation gate only because it decodes payload without signature verification.
- Menu hiding, client state, and disabled buttons are not security boundaries.
- Administrative, approval, export, reset, delete, and financial mutations require explicit role checks and audit evidence.

## Input/data security

- Validate external data with Zod or equivalent; use Prisma parameterization.
- Enforce length/range/enums/date/workflow guards and unique conflicts.
- Do not expose raw Prisma errors, stack traces, secrets, full sensitive payloads, or environment values.
- Upload/import must restrict type/size, generate safe names, avoid path traversal, and validate parsed content.

## Secrets and deployment

- Keep `.env*`, dumps, JWT secret, DB credentials, private keys out of Git/docs/logs.
- Use reviewed migrations and a verified backup before production DB changes.
- Do not run destructive reset/db-push operations in production.
- Review dependency vulnerabilities, Docker base images, TLS/Nginx headers, and firewall externally; Nginx configuration is not present here.

## Audit and logging

Record actor, action, entity ID, result/timestamp, and safe before/after context for critical events. Never log passwords, JWTs, DB URLs, or unnecessarily complete procurement payloads. Verification history and global audit log serve different purposes.

## Current findings

- Route RBAC mismatches are listed in [RBAC_MATRIX.md](RBAC_MATRIX.md).
- Automated security tests/rate-limit evidence were not found.
- Proxy payload decode must never be treated as final authorization.
- Compose runs seed on app startup; production safety is NEEDS VERIFICATION.

## Release gate

Block release for known auth bypass, IDOR, exposed secret, unsafe upload, destructive migration, or missing server authorization on sensitive action.

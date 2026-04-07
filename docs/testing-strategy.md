# Testing Strategy

This project now has a practical testing baseline optimized for a single active developer while still preparing for larger-scale traffic events.

## Philosophy

- Prioritize business-critical reliability over raw test count.
- Keep the suite fast and maintainable so tests run frequently.
- Focus load and resilience work on the customer quote path, not admin-heavy paths.
- Add observability checks alongside tests so production behavior is measurable.

## Current Baseline

### Unit tests

- Location: `tests/unit`
- Runner: Vitest (`vitest.config.ts`)
- Commands:
  - `bun run test`
  - `bun run test:unit`
  - `bun run test:watch`

Covered now:

- Address composition and normalization (`packages/db/src/address.ts`)
- Password hashing and verification (`packages/auth/src/password.ts`)
- Role helper behavior (`packages/db/src/roles.ts`)
- Validation schemas for quote intake and customer backfill (`packages/db/src/validators.ts`)
- Stripe webhook signature verification behavior (`apps/server/src/lib/stripe.ts`)

### CI automation

- Workflow: `.github/workflows/tests.yml`
- Triggered on pull requests and manual dispatch
- Runs unit tests using Bun + Vitest

## Next Layers (in order)

### 1) Integration tests (high priority)

Add API-level route tests for core endpoints with mocked bindings and deterministic data:

- `apps/server/src/routes/quotes.ts`
- `apps/server/src/routes/admin.ts` (limited to critical quote + route flows)
- `apps/server/src/routes/contractor.ts`
- `apps/server/src/routes/integrations.ts`

Critical edge cases:

- Authorization boundaries by role
- Idempotency for webhook event processing
- Validation failures and malformed payloads
- Route stop completion with and without `workOrderId`

### 2) End-to-end tests (selective)

Add a small set of top customer journey tests:

- Quote creation with a new property
- Quote creation with an existing property
- Admin quote finalize lifecycle
- Contractor stop completion confirmation

Keep this suite small, stable, and focused on regressions with high business impact.

### 3) Load and resilience tests (worst-case readiness)

Use synthetic tests focused on quote intake and quote reads:

- Ramp: baseline scaling profile
- Spike: sudden burst profile
- Stress: failure-threshold discovery
- Soak: sustained run for leak/degeneration detection

Because the app is currently single-dev and admin traffic is low, prioritize these paths:

- `POST /api/quotes`
- `GET /api/quotes`
- quote photo upload/read endpoints

## Observability Checklist

As tests expand, confirm production observability includes:

- Error tracking on server and web (already in place with Sentry)
- Route-level latency and error metrics for quote endpoints
- Correlation fields in logs (`requestId`, `quoteId`, `userRole`)
- Alerts for elevated 5xx and p95/p99 latency on quote endpoints

## Maintenance Rules

- Keep unit suite under a few seconds locally.
- Avoid brittle snapshot-heavy tests.
- Require tests for new high-impact business logic.
- Prefer targeted integration tests over broad end-to-end permutations.

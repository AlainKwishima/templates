# Project State

Current repository state: a microservices-based institution management starter kit with a workspace layout, shared utilities package, per-service test suites, and a reverse-proxy API gateway.

## High-Level Summary

- The repository has been migrated away from the old monolith into `packages/shared/` plus `services/*`.
- The public entry point is `api-gateway` on port `3000`.
- Domain services exist for auth, users, roles, departments, resources, transactions, notifications, reports, and dashboard aggregation.
- The repo root includes a workspace-aware `package.json`, `docker-compose.yml`, `README.md`, `SETUP.md`, and scripts `test-all.mjs` / `smoke-e2e.mjs`.
- Service-level README files are present for every microservice.
- PostgreSQL password default is **`mukabareke`** (user remains `postgres`).

## Workspace Layout

- `packages/shared/` — Common helpers, types, errors, auth middleware, pagination utilities, HTTP helpers, and shared seed constants.
- `services/api-gateway/` — Express reverse proxy that routes `/api/v1/*` prefixes to downstream services.
- `services/auth-service/` — Registration, login, logout, password reset, email verification, and refresh-token flows.
- `services/user-service/` — Admin-facing user CRUD.
- `services/role-service/` — Role CRUD.
- `services/department-service/` — Department CRUD.
- `services/resource-service/` — Resource CRUD.
- `services/transaction-service/` — Transaction lifecycle, downstream validation, and notification handoff.
- `services/notification-service/` — Notification send endpoint plus email template rendering.
- `services/report-service/` — Aggregated domain reporting.
- `services/dashboard-service/` — Cross-domain dashboard summary.

## What Is Implemented

- Shared `authenticate`, `authorise`, `sendSuccess`, `sendError`, `paginate`, `buildPaginatedResult`, `asyncHandler`, `AppError`, and Zod schemas are centralized in `@shared/lib`.
- Each service has `src/app.ts`, `src/server.ts`, `src/config/env.ts`, `package.json`, `tsconfig.json`, `Dockerfile`, `jest.config.ts`, and `.env.example`.
- Root orchestration: `docker compose up --build -d`, `npm run build:all`, `npm run test:all`, `npm run smoke:e2e`.
- Per-service README files document ports, responsibilities, environment variables, and test commands.

## Validation Status (last verified)

- `npm run build:all` — passes for shared + all 10 services.
- `npm run test:all` — passes.
- `docker compose up --build -d` — all services healthy.
- `npm run smoke:e2e` — passes against `http://localhost:3000`.

## Known Technical Gap

- Runtime data is **in-memory** in service handlers; Prisma schemas are scaffolded but not used for persistence yet.
- No root `scripts/seed.ts` against Postgres; seed data is in-memory via `DEFAULT_IDS` in `@shared/lib`.

## Operational Notes

- Root `.env.example` documents environment variables; copy to `.env` before Compose.
- Docker Compose uses shared Postgres (`db`) and internal service networking.
- The gateway forwards `Authorization` headers unchanged to downstream services.
- `auth-service` receives `NOTIFICATION_SERVICE_URL` in Compose for async notification handoff.

## Useful References

- [Root README](./README.md)
- [Setup guide](./SETUP.md)
- [Docker Compose](./docker-compose.yml)
- [Shared library](./packages/shared/src/index.ts)
- [API gateway](./services/api-gateway/src/app.ts)

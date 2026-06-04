# Setup Guide — Institution Management Microservices

This document records how to install, configure, validate, and operate the template after full workspace verification (June 2026).

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 20 |
| npm | ≥ 10 (workspaces) |
| Docker & Docker Compose | Recent stable (for full stack) |

Optional: [Brevo](https://www.brevo.com/) API key for real transactional email (in-memory notification records work without it).

## Quick start (Docker — recommended)

1. **Clone and install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set at minimum:

   - `JWT_SECRET` — at least 32 characters
   - `POSTGRES_PASSWORD` — default in template: `mukabareke`
   - `BREVO_API_KEY` — optional; placeholder is fine for local dev

3. **Start the stack**

   ```bash
   docker compose up --build -d
   ```

   Wait until all services report healthy (`docker compose ps`).

4. **Smoke-test the gateway** (27 live API checks: auth, CRUD, transactions, reports, dashboard)

   ```bash
   npm run smoke:e2e
   ```

   Gateway: `http://localhost:3000`  
   Swagger UI: `http://localhost:3000/api-docs` (OpenAPI JSON: `/api-docs.json`)

### Default admin credentials

| Field | Value |
|---|---|
| Email | `admin@institution.local` |
| Password | `Admin123!` |

These are seeded in-memory in `auth-service` and `user-service` (see `packages/shared/src/seed.ts`).

## Local development (without Docker)

Build shared library and a service, then run with env vars from its `.env.example`:

```bash
npm run build -w packages/shared
npm run build -w services/auth-service
# copy services/auth-service/.env.example → .env and adjust DATABASE_URL host to localhost
node services/auth-service/dist/server.js
```

Repeat per service. For cross-service flows (transactions, dashboard, reports), run dependent services or use Docker.

## Scripts

| Script | Purpose |
|---|---|
| `npm install` | Install all workspace dependencies |
| `npm run build:all` | TypeScript build for shared + all 10 services |
| `npm run test:all` | Build shared, then Jest for every workspace |
| `npm run smoke:e2e` | HTTP smoke test via API gateway (stack must be running) |

## PostgreSQL configuration

- **User:** `postgres` (unchanged)
- **Password:** `mukabareke` (updated from `postgres` across `.env.example`, service `.env.example` files, `docker-compose.yml` defaults, and unit-test `DATABASE_URL` placeholders)
- **Database:** `institution_db`
- **Schemas (per service):** `auth`, `users`, `roles`, `departments`, `resources`, `transactions`, `notifications`

Connection string pattern:

```text
postgresql://postgres:mukabareke@db:5432/institution_db?schema=<service-schema>
```

> **Changing the DB password on an existing volume:** Postgres initializes the password only on first volume creation. After changing `POSTGRES_PASSWORD`, run `docker compose down -v` (destroys data) and `docker compose up --build -d` again.

## Architecture summary

| Service | Port | Gateway prefix |
|---|---:|---|
| api-gateway | 3000 | `/` (health), proxies `/api/v1/*` |
| auth-service | 3001 | `/api/v1/auth` |
| user-service | 3002 | `/api/v1/users` |
| role-service | 3003 | `/api/v1/roles` |
| department-service | 3004 | `/api/v1/departments` |
| resource-service | 3005 | `/api/v1/resources` |
| transaction-service | 3006 | `/api/v1/transactions` |
| notification-service | 3007 | internal + `/api/v1/notifications/send` |
| report-service | 3008 | `/api/v1/reports` |
| dashboard-service | 3009 | `/api/v1/dashboard` |

There is **no frontend** in this repository; `CLIENT_URL` is used for CORS and email links only.

## Validation performed

- `npm install` — success
- `npm run build:all` — all workspaces compile
- `npm run test:all` — all unit/integration tests pass
- `docker compose up --build -d` — all 11 containers healthy
- `npm run smoke:e2e` — login, roles, departments, users, dashboard via gateway

## Configuration fixes applied

1. **Postgres password** — standardized to `mukabareke` in env examples, Compose defaults, and tests.
2. **auth-service in Compose** — added `NOTIFICATION_SERVICE_URL` for register/login notification handoff.
3. **Compose** — removed obsolete top-level `version` key (Compose v2 warning).
4. **Root scripts** — added `build:all` and `smoke:e2e`.
5. **`.env`** — created from `.env.example` when missing (ensure `POSTGRES_PASSWORD=mukabareke`).

## Known limitations (by design in this template)

- **In-memory persistence:** Domain services use `createMemoryStore` at runtime; Prisma schemas exist for future migration but are not wired to live CRUD yet.
- **No Prisma migrate/seed in CI:** `DATABASE_URL` is validated on startup but not used for queries in current handlers.
- **Email:** Brevo is configured; without a valid API key, notification records are stored in-memory and external send may no-op/fail gracefully.
- **Auth vs user data:** Separate in-memory stores per service; admin exists in both auth and user services with matching seed IDs.

## Troubleshooting

| Symptom | Action |
|---|---|
| Gateway 503 on routes | `docker compose ps` — wait for downstream healthchecks |
| Login 401 | Use `admin@institution.local` / `Admin123!` |
| DB connection errors after password change | `docker compose down -v` and recreate stack |
| `JWT_SECRET` startup failure | Must be ≥ 32 characters in `.env` |
| Smoke test fails on dashboard | Use `GET /api/v1/dashboard` (not `/summary`) |

## Production checklist

- [ ] Replace `JWT_SECRET` with a strong secret (secret manager)
- [ ] Set real `BREVO_*` credentials or swap email provider
- [ ] Wire Prisma migrations per schema and remove in-memory stores
- [ ] Add API rate limiting and request IDs at the gateway
- [ ] Use TLS termination (reverse proxy) in front of port 3000
- [ ] Pin Docker image digests and run `npm audit` remediation

# Agent Reference — Restful Microservices Template

## Project Overview

This repository is a **microservices-based REST API template** with a React single-page application. It provides a multi-service backend for user authentication, profile and role management, and file uploads, exposed through a single API gateway. The system is intended as a starter for building examination or enterprise-style web applications that require JWT authentication, role-based access control, PostgreSQL persistence, and transactional email.

The frontend currently implements a **status and authentication dashboard** that communicates with the gateway. API client modules and React Query hooks exist for users and files, but those domains are not rendered in the UI.

---

## Current System Architecture

### Repository layout

The project is an **npm workspaces monorepo**:


| Path                                              | Purpose                                                                                                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/shared` (`@restful/shared`)             | Shared JWT helpers, password hashing, API response types, application errors, HTTP service client, pagination utilities, seed constants |
| `packages/service-kit` (`@restful/service-kit`)   | Shared Express application factory, logging, middleware (validation, sanitization, error handling), graceful shutdown server            |
| `services/gateway` (`@restful/gateway`)           | Public HTTP entry point, reverse proxy, aggregated health, Swagger UI                                                                   |
| `services/auth-service` (`@restful/auth-service`) | Credentials, JWT sessions, email verification and password reset                                                                        |
| `services/user-service` (`@restful/user-service`) | User profiles, roles, admin APIs, internal service APIs                                                                                 |
| `services/file-service` (`@restful/file-service`) | File upload metadata and local disk storage                                                                                             |
| `frontend`                                        | React 19 + Vite SPA                                                                                                                     |
| `docker/`                                         | PostgreSQL initialization SQL                                                                                                           |
| `scripts/`                                        | `setup.mjs`, `e2e-test.mjs`                                                                                                             |


There is **no monolithic backend** in this repository.

### Runtime topology

```
Browser (frontend :5173)
        │
        ▼
API Gateway (:3000)  ── /docs (Swagger UI)
        │
        ├── /api/v1/auth/*   → auth-service (:4001)
        ├── /api/v1/users/*  → user-service (:4002)
        └── /api/v1/files/*  → file-service (:4003)

auth-service ──HTTP (X-Service-Key)──► user-service /internal/users/*
```

Each backend service runs as an independent Node.js process with its own PostgreSQL database:


| Database  | Service      |
| --------- | ------------ |
| `auth_db` | auth-service |
| `user_db` | user-service |
| `file_db` | file-service |


Local Docker Compose maps PostgreSQL to host port **55432** and creates all three databases via `docker/postgres/init-databases.sql`.

### Technology stack

**Backend (all services)**

- Node.js (ES modules), TypeScript
- Express 5
- Prisma 6 + PostgreSQL
- Zod request validation
- Pino logging (via service-kit)
- Helmet, CORS, HPP, express-rate-limit, request sanitization

**Auth-service additionally**

- Argon2id password hashing
- JSON Web Tokens (access + refresh)
- Brevo transactional email API (when configured)
- cookie-parser for refresh-token cookies

**File-service additionally**

- Multer (disk storage)

**Gateway**

- http-proxy-middleware (path rewrite to preserve `/api/v1/{service}` prefixes)
- swagger-ui-express (static OpenAPI document)

**Frontend**

- React 19, Vite 8
- TanStack React Query 5
- react-router-dom 7 (provider mounted; no route definitions in `App.tsx`)
- Zod for environment validation

### Cross-service communication

- **Public clients** call only the gateway at `http://localhost:3000/api/v1` (configurable).
- **auth-service → user-service** uses internal REST endpoints under `/internal/users`, authenticated with header `X-Service-Key` matching `INTERNAL_SERVICE_KEY` in both services.
- Internal routes are registered on user-service directly and are **not** proxied by the gateway.

### Shared configuration requirements

These values must be **identical** across services that use them:

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE` — auth-service, user-service, file-service
- `INTERNAL_SERVICE_KEY` — auth-service (client) and user-service (server)

auth-service loads environment variables with `dotenv.config({ override: true })` so values in `services/auth-service/.env` take precedence over pre-existing shell environment variables.

### API response contract

All operational HTTP handlers return a consistent JSON envelope:

- Success: `{ success: true, message, data, metadata? }`
- Error: `{ success: false, message, error: { code, details? }, metadata? }`

Request correlation uses `x-request-id` (generated if absent).

### Root npm scripts


| Script                                                                          | Behavior                                                                                                                  |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `npm run setup`                                                                 | Install dependencies, build shared packages, generate Prisma clients, copy `.env.example` files where missing             |
| `npm run dev:all`                                                               | Run gateway, auth-service, user-service, and file-service concurrently                                                    |
| `npm run dev:gateway` / `dev:auth` / `dev:users` / `dev:files` / `dev:frontend` | Run individual workspace                                                                                                  |
| `npm run build`                                                                 | Build `@restful/shared`, `@restful/service-kit`, then all workspaces that define a build script                           |
| `npm run db:migrate`                                                            | `prisma migrate deploy` on user-service, auth-service, file-service (in that order in the script; seed order is separate) |
| `npm run db:migrate:dev`                                                        | Interactive Prisma migrate dev per service                                                                                |
| `npm run db:seed`                                                               | Seed user-service, then auth-service                                                                                      |
| `npm run test:e2e`                                                              | HTTP smoke tests against the gateway                                                                                      |
| `npm run docker:up`                                                             | Start PostgreSQL container only                                                                                           |
| `npm run docker:down`                                                           | Stop Compose stack                                                                                                        |
| `npm run docker:full`                                                           | Build and start full Compose stack                                                                                        |


### Docker Compose

`docker-compose.yml` defines: `postgres`, `auth-service`, `user-service`, `file-service`, and `gateway` with production-oriented environment defaults. The postgres service uses port `55432:5432` on the host.

---

## Existing Features & Roles

### User roles (implemented)

Roles are stored in **user-service** and embedded in JWT claims at token issuance.


| Role name | Constant                 | Typical assignment                                            |
| --------- | ------------------------ | ------------------------------------------------------------- |
| `admin`   | `ADMIN_ROLE_NAME`        | Seeded admin user; full admin API access                      |
| `user`    | `DEFAULT_USER_ROLE_NAME` | Assigned on registration when the role exists in the database |


Seeded administrator (after `npm run db:seed`):

- Email: `admin@example.com`
- Password: `Admin123!`
- Status: `ACTIVE`, email verified
- Roles: `admin` and `user`

### Account statuses (user-service)

`PENDING`, `ACTIVE`, `INACTIVE`, `SUSPENDED`, `DELETED`

New registrations create profiles with status `PENDING` and `isEmailVerified: false` until email verification completes.

### Authentication and authorization (auth-service)

**Public endpoints** (via gateway `/api/v1/auth`):


| Method | Path               | Auth       | Description                                                                                                                |
| ------ | ------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/register`        | None       | Creates credential, user profile (via internal API), verification token; sends verification email; returns user and tokens |
| POST   | `/login`           | None       | Requires `ACTIVE` status and verified email; returns user and tokens; records last login                                   |
| POST   | `/refresh`         | None       | Accepts refresh token in body or `refreshToken` cookie; rotates refresh session                                            |
| POST   | `/logout`          | None       | Revokes refresh session when token provided                                                                                |
| POST   | `/forgot-password` | None       | Creates reset token and sends email if account exists (no email enumeration)                                               |
| POST   | `/reset-password`  | None       | Resets password, marks token used, revokes refresh sessions                                                                |
| POST   | `/verify-email`    | None       | Activates account (`ACTIVE`, verified) via user-service internal API                                                       |
| GET    | `/me`              | Bearer JWT | Returns claims from JWT (`id`, `email`, `roles`)                                                                           |


**Implemented security behaviors**

- Argon2id password hashing
- Access and refresh JWTs with configurable TTL
- Refresh token families, rotation, reuse detection (sessions revoked on reuse)
- Email verification required before login
- Password reset invalidates active refresh sessions

**Email delivery (auth-service)**

- Provider: Brevo HTTP API (`/v3/smtp/email`)
- When `EMAIL_ENABLED` is not `true` or `BREVO_API_KEY` is empty: **preview mode** (log only, no external send)
- When enabled with valid Brevo credentials and verified sender: sends verification and password-reset messages
- Retry logic on Brevo API failures (`EMAIL_RETRY_MAX_ATTEMPTS`, `EMAIL_RETRY_BASE_DELAY_MS`)
- Test command: `npm run email:test -w @restful/auth-service`

Registration rolls back the auth credential if user-service profile creation fails. Email send failures after successful profile creation will fail the registration request.

### Users and administration (user-service)

**Public endpoints** (via gateway `/api/v1/users`):


| Method | Path                | Auth                      | Description                                                          |
| ------ | ------------------- | ------------------------- | -------------------------------------------------------------------- |
| GET    | `/me`               | Bearer JWT                | Load profile from database                                           |
| PATCH  | `/me`               | Bearer JWT                | Update `firstName`, `lastName`, `phoneNumber`, `avatarUrl`           |
| GET    | `/admin`            | Bearer JWT + role `admin` | Paginated user list with optional `search`, `role`, `status` filters |
| GET    | `/admin/roles`      | Bearer JWT + role `admin` | List roles                                                           |
| PATCH  | `/admin/:id/status` | Bearer JWT + role `admin` | Set user status; prevents removing last active admin                 |
| PATCH  | `/admin/:id/roles`  | Bearer JWT + role `admin` | Replace user roles; prevents removing last active admin              |


**Authentication middleware (user-service)** validates the JWT and loads the user from the database (excluding deleted users).

**Internal endpoints** (user-service only, `X-Service-Key` required):


| Method | Path                                           | Description                              |
| ------ | ---------------------------------------------- | ---------------------------------------- |
| POST   | `/internal/users`                              | Create user profile with explicit `id`   |
| GET    | `/internal/users/:id/auth-context`             | Profile + roles for auth decisions       |
| GET    | `/internal/users/by-email/:email/auth-context` | Lookup by email                          |
| PATCH  | `/internal/users/:id/account-state`            | Update `isEmailVerified` and/or `status` |
| POST   | `/internal/users/:id/last-login`               | Update `lastLoginAt`                     |


### Files (file-service)

**Public endpoints** (via gateway `/api/v1/files`):


| Method | Path      | Auth       | Description                                      |
| ------ | --------- | ---------- | ------------------------------------------------ |
| GET    | `/`       | Bearer JWT | List files (paginated, optional search)          |
| GET    | `/:id`    | Bearer JWT | Get file metadata                                |
| PATCH  | `/:id`    | Bearer JWT | Update `originalName`                            |
| DELETE | `/:id`    | Bearer JWT | Soft-delete record and attempt filesystem delete |
| POST   | `/upload` | Bearer JWT | Multipart upload (`file` field)                  |


**Access rules**

- Non-admin users: operations scoped to their own `userId`
- Users with `admin` role in JWT claims: access all files

**Upload constraints**

- Storage: local directory (`UPLOAD_DIR`, default `uploads`)
- Max size: `MAX_UPLOAD_MB` (default 10 MB)
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `text/plain`

**Authentication middleware (file-service)** validates JWT and trusts role claims from the token without a database lookup.

### Health checks

Each service exposes under `/api/v1/health`:


| Endpoint     | Behavior                                                 |
| ------------ | -------------------------------------------------------- |
| GET `/`      | Basic health payload with uptime                         |
| GET `/live`  | Liveness                                                 |
| GET `/ready` | Readiness (includes database query where Prisma is used) |


The gateway exposes `GET /api/v1/health`, which probes each service’s `/api/v1/health/live` and returns aggregated status.

### API documentation

- Gateway serves Swagger UI at `**/docs`** using a static OpenAPI 3.1 document (`services/gateway/src/docs/openapi.ts`) summarizing main route groups.
- Route files in services contain OpenAPI comment annotations; those are **not** automatically aggregated into the gateway document.

### Frontend (implemented UI)

The SPA (`frontend`) currently renders:

- API health, liveness, and readiness status (via gateway)
- Login and logout using seeded admin credentials by default
- Display of signed-in user email and roles from session state

**Implemented client infrastructure**

- Typed API client with unified error handling (`ApiClientError`)
- Session storage for access tokens; refresh via `/auth/refresh` on bootstrap
- React Query hooks: `features/auth`, `features/health`
- API modules and hooks also exist for `features/users` and `features/files` but are **not used** by any page component

Default API base URL: `http://localhost:3000/api/v1` (`VITE_API_BASE_URL`).

`BrowserRouter` wraps the application; no `Route` components are defined.

### Verification and operational testing

- `**scripts/e2e-test.mjs`** (npm `test:e2e`): gateway health, admin login, `GET /auth/me`, `GET /users/me`, token refresh
- `**services/auth-service/scripts/test-brevo-email.ts**` (npm `email:test`): sends verification and password-reset test messages through configured Brevo or preview mode

There are **no** Vitest, Jest, or other automated unit or integration test suites in the repository.

---

## Current Status Verification

This document describes the Restful Microservices Template **as it exists in the repository at the time of writing**. It includes only implemented services, endpoints, behaviors, and client features that are present and operational when the system is configured with valid environment files, running PostgreSQL (local or Docker on port 55432), applied migrations, completed seeds, and all required processes started (`npm run dev:all` or Docker Compose full stack). Partial implementations are excluded unless noted; the frontend users and files API layers are documented only as non-UI client code, not as end-user features.
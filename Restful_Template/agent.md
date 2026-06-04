# National_Examination — Project State Documentation

## Project Overview

**National_Examination** is a full-stack REST API template with a React frontend client. It provides a lean foundation for user authentication, role-based access control, transactional email, file uploads, and operational health monitoring. The repository is organized as two applications under one workspace: `backend/` (Express API) and `frontend/` (Vite + React).

The backend exposes versioned JSON APIs under `/api/v1`. The frontend consumes those APIs through a typed HTTP client layer and currently renders a single operational status dashboard for connectivity and authentication smoke-testing.

---

## Current System Architecture

### Repository layout

| Path | Role |
|------|------|
| `backend/` | Express 5 API, Prisma ORM, PostgreSQL, Brevo email |
| `frontend/` | React 19 SPA, TanStack Query, React Router (provider only) |

### Backend tech stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (ES modules) |
| Framework | Express 5 |
| Language | TypeScript (strict) |
| Database | PostgreSQL via Prisma 6 |
| Auth | JWT access tokens + refresh token sessions (httpOnly cookie or body) |
| Password hashing | Argon2 |
| Validation | Zod |
| Logging | Pino |
| API docs | Swagger UI at `/docs` (OpenAPI 3.1) |
| Email | Brevo REST API (`/v3/smtp/email`) |
| File storage | Local disk (`UPLOAD_DIR`, default `uploads/`) |

### Frontend tech stack

| Layer | Technology |
|-------|------------|
| Build | Vite 8 |
| UI | React 19 |
| Data fetching | TanStack React Query 5 |
| Routing | `react-router-dom` 7 (`BrowserRouter` in `AppProviders`; no route definitions in `App`) |
| Validation (env) | Zod |
| Session storage | `sessionStorage` (access token + user profile) |

### Request flow (operational today)

```
Browser (frontend :5173)
    → fetch() with Bearer token + credentials
    → Express API (:4000)
        → middleware: request ID, logging, helmet, CORS, HPP, JSON body, sanitizer, cookies, rate limit
        → route handler (auth / users / files / health)
        → Prisma → PostgreSQL
        → (optional) Brevo API for email
```

### Backend modules (implemented)

| Module | Path prefix | Responsibility |
|--------|-------------|----------------|
| Health | `/api/v1/health` | Full health, liveness, readiness (DB ping on ready) |
| Auth | `/api/v1/auth` | Register, login, refresh, logout, forgot/reset password, verify email, current user |
| Users | `/api/v1/users` | Profile (`/me`), admin user/role management |
| Files | `/api/v1/files` | Upload, list, get, update metadata, soft-delete |

### Cross-cutting backend behavior

- **Standard API envelope:** `{ success, message, data, metadata? }` for successes; structured error responses via centralized error handler.
- **Authentication:** `Authorization: Bearer <accessToken>` on protected routes; refresh tokens stored hashed in `RefreshTokenSession` with rotation and reuse detection.
- **Authorization:** Role checks via `authorizeRoles(...)` middleware (`admin` required for admin routes).
- **Email:** `EmailService` sends through Brevo when `EMAIL_ENABLED=true` and `BREVO_API_KEY` is set; otherwise logs preview-only (no send). Retries on transient Brevo/network failures with exponential backoff.
- **Email templates:** HTML + plain text for verification and password reset; links use `FRONTEND_URL` (e.g. `/verify-email?token=...`, `/reset-password?token=...`).
- **Security middleware:** Helmet, CORS (configurable origins), HPP, rate limiting, request sanitization.
- **Tooling:** ESLint, Prettier, Husky (when `.git` exists), `lint-staged` on backend.

### Database schema (Prisma)

| Model | Purpose |
|-------|---------|
| `User` | Accounts with `UserStatus`, email verification flag, soft delete |
| `Role` / `UserRole` | Many-to-many roles (`admin`, `user` seeded) |
| `RefreshTokenSession` | Refresh token families, JTI, revocation |
| `PasswordResetToken` | Hashed reset tokens with expiry |
| `EmailVerificationToken` | Hashed verification tokens with expiry |
| `UploadedFile` | File metadata; `storage` defaults to `local` |

Migration applied: `20260528090552_init`.

### Configuration

Environment variables are validated at startup (`backend/src/config/env.ts`) via Zod. Secrets and integration keys live in `backend/.env` (gitignored); `backend/.env.example` documents required shape. Frontend uses `frontend/.env` with `VITE_*` variables.

Default local ports: backend **4000**, frontend **5173**.

---

## Existing Features & Roles

### User roles (seeded and enforced)

| Role | Name constant | Access |
|------|---------------|--------|
| **admin** | `ADMIN_ROLE_NAME` | All authenticated user routes plus admin user/role management and all files in list/get operations |
| **user** | `DEFAULT_USER_ROLE_NAME` | Own profile, own files only; assigned automatically on registration |

The seed script creates one admin account: `admin@example.com` / `Admin123!` with roles `admin` and `user`, status `ACTIVE`, email verified.

### User statuses

`PENDING` → set on registration until email verified (then set to `ACTIVE`).  
`ACTIVE`, `INACTIVE`, `SUSPENDED`, `DELETED` — admin can set via `PATCH /api/v1/users/admin/:id/status` (except `PENDING` is not in that enum; verification flow handles activation).

**Login rules (enforced):** account must be `ACTIVE` and `isEmailVerified=true`.

### Authentication & email (backend — fully implemented)

| Feature | Endpoint / behavior |
|---------|---------------------|
| Register | `POST /api/v1/auth/register` — creates user, assigns `user` role, issues tokens, sends Brevo verification email |
| Login | `POST /api/v1/auth/login` — requires verified active account |
| Refresh | `POST /api/v1/auth/refresh` — cookie or body refresh token; rotates session |
| Logout | `POST /api/v1/auth/logout` — revokes refresh session |
| Current user (auth) | `GET /api/v1/auth/me` |
| Forgot password | `POST /api/v1/auth/forgot-password` — sends reset email if user exists (no email enumeration in response) |
| Reset password | `POST /api/v1/auth/reset-password` — validates token, updates password, revokes refresh sessions |
| Verify email | `POST /api/v1/auth/verify-email` — activates account |

| Email workflow | Trigger | Provider |
|----------------|---------|----------|
| Verification | Registration | Brevo (or preview if disabled) |
| Password reset | Forgot password | Brevo (or preview if disabled) |
| Integration test | `npm run email:test` in `backend/` | Brevo |

### User management (backend — fully implemented)

| Feature | Endpoint | Auth |
|---------|----------|------|
| Get profile | `GET /api/v1/users/me` | Authenticated |
| Update profile | `PATCH /api/v1/users/me` | Authenticated |
| List users (paginated, search, role, status filters) | `GET /api/v1/users/admin` | `admin` |
| List roles | `GET /api/v1/users/admin/roles` | `admin` |
| Update user status | `PATCH /api/v1/users/admin/:id/status` | `admin` |
| Update user roles | `PATCH /api/v1/users/admin/:id/roles` | `admin` |

### File management (backend — fully implemented)

| Feature | Endpoint | Notes |
|---------|----------|-------|
| Upload | `POST /api/v1/files/upload` | Multipart field `file`; max size `MAX_UPLOAD_MB` |
| List | `GET /api/v1/files` | Paginated; users see own files; admins see all |
| Get | `GET /api/v1/files/:id` | Owner or admin |
| Update metadata | `PATCH /api/v1/files/:id` | Owner or admin |
| Delete | `DELETE /api/v1/files/:id` | Soft delete; removes file from disk |

**Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `text/plain`.

### Health & documentation (backend — fully implemented)

| Feature | Endpoint |
|---------|----------|
| Health check | `GET /api/v1/health` |
| Liveness | `GET /api/v1/health/live` |
| Readiness (includes DB) | `GET /api/v1/health/ready` |
| OpenAPI UI | `GET /docs` |

### Frontend — what is implemented today

**Operational UI (single page in `App.tsx`):**

- Displays API health, liveness, and readiness from the backend.
- Login form (pre-filled with seeded admin credentials for local testing).
- Shows signed-in user email and roles after login.
- Logout control.

**Operational client layer (no dedicated pages wired for these yet):**

The following have working TypeScript API functions and React Query hooks under `frontend/src/features/`, but are **not** exposed as routed UI screens:

- Auth: `register`, `logout`, `requestPasswordReset`, `resetPassword`, `verifyEmail`, `refreshSession`, `getCurrentAuthUser`
- Users: `getMe`, `updateMe`, `listUsers`, `listRoles`, `updateUserStatus`, `updateUserRoles`
- Files: `listFiles`, `getFile`, `updateFile`, `deleteFile`, `uploadFile`
- Health: `getHealthCheck`, `getLiveness`, `getReadiness` (used by the dashboard)

**Session handling:**

- Access token and user stored in `sessionStorage`.
- `bootstrapAuthSession()` can restore session via `POST /auth/refresh` (cookie-based refresh when backend sets it).

### Explicitly not present in the codebase

Per `backend/README.md` and repository contents: Docker, automated tests, Redis, cron/queues, advanced audit systems, DTO mapping layers, repository abstractions. No SMTP/nodemailer — email is Brevo-only.

### Backend npm scripts (available)

`dev`, `build`, `start`, `typecheck`, `lint`, `format`, `prisma:generate`, `prisma:migrate:dev`, `prisma:migrate:deploy`, `prisma:migrate:reset`, `prisma:studio`, `db:seed`, `email:test`.

### Frontend npm scripts (available)

`dev`, `build`, `preview`, `typecheck`, `lint`, `format`.

---

## Current Status Verification

This document was written against the **current** `Restful_Template` repository state: a working Express + Prisma + PostgreSQL backend with Brevo transactional email, JWT auth, RBAC, local file uploads, and Swagger; plus a React frontend with a functional API integration layer and a single status/authentication dashboard. All features listed above are implemented in source and have been exercised during project setup (database migrate/seed, API calls, Brevo test send, production build). Anything not described in this file is outside the scope of what is built and running today.

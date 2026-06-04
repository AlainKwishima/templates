# JavaT — Project Agent Reference

## Project Overview

JavaT is a full-stack application template consisting of a **Spring Boot REST API** and a **React + TypeScript single-page application**. Its purpose is to provide a production-oriented foundation for user authentication, role-based access control, user administration, and transactional email—so new applications can be built on top of working infrastructure rather than from scratch.

The backend exposes versioned JSON APIs under `/api/v1`. The frontend is a separate Vite application that consumes those APIs, stores JWT credentials in the browser, and provides authenticated UI flows for end users and administrators.

---

## Current System Architecture

### Repository layout

| Path | Role |
|------|------|
| `src/main/java/com/spring/JavaT/` | Spring Boot backend (monolith) |
| `frontend/` | React 19 + TypeScript SPA |
| `src/main/resources/db/migration/` | Flyway SQL migrations |
| `src/main/resources/templates/email/` | HTML email templates |
| `src/test/java/` | Backend tests (including Brevo integration test) |

### Backend tech stack

| Layer | Technology |
|-------|------------|
| Runtime | Java 22 |
| Framework | Spring Boot 3.4.5 |
| Security | Spring Security, JWT (jjwt 0.12.6), stateless sessions |
| Database | PostgreSQL |
| ORM / migrations | Spring Data JPA, Hibernate, Flyway |
| API documentation | SpringDoc OpenAPI 2.8.8 (Swagger UI) |
| Mapping | MapStruct 1.6.3, Lombok |
| Validation | Jakarta Bean Validation |
| Email | Brevo transactional API (`POST /v3/smtp/email`) via `RestClient` |
| Retry | Spring Retry (`spring-retry`, `spring-aspects`) |

SMTP and `spring-boot-starter-mail` are **not** used. Spring Mail auto-configuration is explicitly excluded.

### Frontend tech stack

| Layer | Technology |
|-------|------------|
| Build | Vite 8 |
| UI | React 19, TypeScript |
| Routing | React Router 7 |
| HTTP | Axios |
| Server state | TanStack Query |
| Forms | React Hook Form + Zod |
| Styling | CSS modules, CSS variables (light/dark theme) |
| Icons | Lucide React |

Default dev server: `http://localhost:5173`. API proxy in Vite forwards `/api` and `/v3` to the backend.

### How the systems interact

```
┌─────────────────┐     HTTPS/HTTP + JWT      ┌──────────────────────────┐
│  React SPA      │ ────────────────────────► │  Spring Boot API         │
│  (port 5173)    │     ApiResponse envelope  │  (port 8080)             │
└─────────────────┘                           └───────────┬──────────────┘
                                                            │
                    ┌───────────────────────────────────────┼───────────────────────┐
                    │                                       │                       │
                    ▼                                       ▼                       ▼
            ┌───────────────┐                      ┌─────────────────┐    ┌─────────────────┐
            │  PostgreSQL   │                      │  Brevo API      │    │  Swagger UI     │
            │  (users,      │                      │  (transactional │    │  /swagger-ui    │
            │   tokens)     │                      │   email)        │    │                 │
            └───────────────┘                      └─────────────────┘    └─────────────────┘
```

1. **Authentication**: The SPA sends credentials to `/api/v1/auth/*`. The API returns access and refresh JWTs. Subsequent requests include `Authorization: Bearer <accessToken>`.
2. **CORS**: `CorsConfig` allows configured origins (`http://localhost:5173`, `http://localhost:3000`) with credentials.
3. **Email links**: Verification and password-reset emails point to frontend routes (`/verify-email`, `/reset-password`). The SPA calls the backend to complete those actions.
4. **Errors**: All API responses use a standard `ApiResponse` envelope; `GlobalExceptionHandler` maps exceptions to consistent HTTP status codes and error lists.

### Operational backend modules

| Package / area | Responsibility |
|----------------|----------------|
| `auth/` | Registration, login, email verification, password reset; token entities |
| `user/` | Profile, password change, admin user CRUD, role and status management |
| `security/` | JWT generation/validation, filter chain, 401/403 handlers |
| `notification/` | `EmailService`, Brevo delivery, HTML templates, startup validation |
| `config/` | Security, CORS, JPA auditing, async email pool, Brevo `RestClient`, Swagger |
| `common/` | `ApiResponse`, pagination, `BaseEntity`, validation annotations, specifications |
| `exception/` | Domain and global exception handling |
| `audit/` | `AuditAwareImpl` for JPA `createdBy` / `updatedBy` on entities |

### Database schema (Flyway)

Migrations applied in order:

| Version | Content |
|---------|---------|
| V1 | `users` table |
| V2 | Seed default admin (`admin@javat.com`, role `ADMIN`) |
| V3 | `password_reset_tokens` |
| V4 | `email_verification_tokens` |
| V5 | Admin password hash update |

`User` extends `BaseEntity` (id, timestamps, `createdBy`, `updatedBy`, soft-delete fields, `status`). Account statuses: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING`.

### Configuration model

- **`application.properties`**: Committed defaults and `${ENV_VAR}` placeholders.
- **`application-local.properties`**: Gitignored; optional local overrides (database, Brevo key, test recipient).
- **Email secrets**: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` via environment or local file—never hardcoded in tracked sources.

Key runtime settings:

- JWT access token TTL: 24 hours; refresh token TTL: 7 days (refresh tokens are issued; there is **no** `/refresh` endpoint).
- Password reset token: 15 minutes.
- Email verification token: 24 hours.
- Brevo: up to 3 send retries with configurable delay; optional startup API validation and test email when `MAIL_TEST_RECIPIENT` is set.

---

## Existing Features & Roles

### API endpoints (implemented)

**Authentication** — `/api/v1/auth` (public)

| Method | Path | Behavior |
|--------|------|----------|
| POST | `/register` | Create account (`PENDING`), send verification email, return JWTs |
| POST | `/login` | Authenticate; block unverified users (403 `EMAIL_NOT_VERIFIED`) |
| POST | `/forgot-password` | Issue reset token, send email; always 200 |
| POST | `/reset-password` | Complete reset with token + new password |
| GET | `/verify-email?token=` | Activate account (`PENDING` → `ACTIVE`) |
| POST | `/resend-verification` | Resend verification for pending accounts; always 200 |

**User management** — `/api/v1/users` (JWT required)

| Method | Path | Access | Behavior |
|--------|------|--------|----------|
| GET | `/me` | Authenticated | Read own profile |
| PATCH | `/me` | Authenticated | Update name / username |
| PATCH | `/me/password` | Authenticated | Change password |
| GET | `/` | ADMIN | Paginated user list (filter by role, status, email search; sort) |
| GET | `/{id}` | ADMIN | Get user by ID |
| PATCH | `/{id}/role` | ADMIN | Assign `USER`, `MODERATOR`, or `ADMIN` |
| PATCH | `/{id}/deactivate` | ADMIN | Soft-deactivate account |
| PATCH | `/{id}/activate` | ADMIN | Restore deactivated account |

**Documentation** (public): `/swagger-ui.html`, `/v3/api-docs`

**Response contract**: Every endpoint returns `ApiResponse<T>` with `success`, `message`, `data`, `errors`, `timestamp`, `path`. Paginated lists use `PageResponse` with `content` and `meta`.

### Email (Brevo)

Fully wired and tested via `BrevoEmailDeliveryService`:

| Email type | Trigger | Template |
|------------|---------|----------|
| Account verification | Register, resend verification | `verification.html` |
| Password reset | Forgot password | `password-reset.html` |
| Test / diagnostic | Startup when `MAIL_TEST_RECIPIENT` set | `test.html` |
| Generic notification | `EmailService.sendNotification()` | Caller-supplied body |

Delivery is asynchronous (`emailTaskExecutor`). Successful sends log a Brevo `messageId`. Startup can validate the Brevo account API (`GET /v3/account`).

### User roles and access levels

| Role | Backend enforcement | Frontend access |
|------|---------------------|-----------------|
| **USER** | Default on registration; `/me` endpoints | Dashboard, profile, settings, API docs, audit logs page |
| **MODERATOR** | Stored and assignable by ADMIN; **no** dedicated `@PreAuthorize` rules beyond authenticated user | Same as USER (no extra routes) |
| **ADMIN** | `@PreAuthorize("hasRole('ADMIN')")` on user-management endpoints | Above plus Users list/detail, Roles page |

**Account state effects (backend)**:

- `PENDING`: Can register and receive tokens; **login blocked** until email verified.
- `INACTIVE` / soft-deleted: Account disabled via admin deactivate.
- `SUSPENDED`: Account locked at security layer.

### Frontend features (implemented)

**Authentication flows**

- Login, register, forgot password, reset password (query `token`), verify email (query `token`), resend verification
- JWT stored in `localStorage`; expiry tracked; 401 clears session and redirects to login
- Handling for `EMAIL_NOT_VERIFIED` with link to resend verification

**Authenticated application shell**

- Responsive sidebar layout with role-filtered navigation
- Light/dark theme toggle (persisted)
- Toast notifications for API success/errors
- Global loading and form validation (Zod)

**Pages tied to working backend APIs**

| Page | Function |
|------|----------|
| Dashboard | Profile summary; admin sees total user count |
| Profile | View/update profile; change password |
| Users (admin) | Paginated table, filters, sort, role change modal, activate/deactivate |
| User detail (admin) | View user; activate/deactivate |
| Roles (admin) | Documents three roles; shows live user counts per role from API |
| Settings | Theme selection; displays app metadata |
| API Docs | Fetches OpenAPI spec; lists endpoints; link to Swagger UI |

**Reusable frontend infrastructure**

- API client with auth interceptor and standard error parsing
- `authApi`, `userApi`, `swaggerApi` service modules
- UI components: Button, Input, Select, Card, Badge, Alert, Modal, Spinner, Skeleton, EmptyState
- `DataTable`, `Pagination`, `CrudPage` shell
- `ProtectedRoute` / `GuestRoute` with role guards

### Frontend page without backend API

| Page | Current behavior |
|------|------------------|
| Audit Logs | Renders UI shell and empty state explaining no audit read API exists. Backend only writes JPA audit fields on entities (`createdBy`, `updatedBy`, timestamps)—no log query endpoint. |

### Validation and cross-cutting behavior

- Password rules: 8–72 characters, upper, lower, digit, special character (`@ValidPassword`)
- Username: no whitespace (`@NoWhitespace`)
- Global duplicate detection (409) for unique constraints
- JPA auditing populates audit columns on persist/update
- Async email pool isolated from HTTP request threads

### What is not implemented

The following exist in code or config but have **no operational end-to-end behavior** today:

- Token refresh API (refresh JWT is returned and stored; clients must re-login after access token expiry)
- `MODERATOR`-specific permissions or routes
- Audit log read API or populated audit log UI
- Spring Actuator endpoints beyond `/actuator/health` being listed as a public path (Actuator dependency not present)
- Server-side session management (API is stateless JWT only)

---

## Current Status Verification

This document describes the JavaT repository **as it exists in the codebase today**: a dual-project template with a JWT-secured Spring Boot API, PostgreSQL persistence, Brevo-powered transactional email, Flyway-managed schema, OpenAPI documentation, and a React SPA that implements the full auth lifecycle plus admin user management. Only implemented, deployable behavior is listed above. Partial UI (Audit Logs) is documented strictly as a non-integrated shell. No planned or future work is included.

*Generated from repository inspection. Backend artifact: `com.spring:JavaT:0.0.1-SNAPSHOT`. Frontend package: `frontend@0.0.0`.*

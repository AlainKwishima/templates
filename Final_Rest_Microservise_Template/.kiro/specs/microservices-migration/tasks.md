# Implementation Plan: Microservices Migration

## Overview

Migrate the Institution Management Starter Kit from a monolithic Node.js/TypeScript/Express application to a pure microservices architecture. The work is broken into 15 tasks progressing from shared infrastructure outward to individual services, orchestration, cleanup, and final verification.

## Tasks

- [ ] 1. Bootstrap npm Workspaces and Shared Library
  - Replace the root `package.json` with an npm workspaces manifest declaring `["packages/*", "services/*"]` and add a root `test:all` script
  - Create `packages/shared/package.json` with `name: "@shared/lib"` and required dev-dependencies (`typescript`, `jest`, `ts-jest`, `fast-check`)
  - Create `packages/shared/tsconfig.json` outputting to `dist/`
  - Migrate `src/utils/AppError.ts` → `packages/shared/src/AppError.ts`
  - Migrate `src/utils/response.ts` (`sendSuccess`, `sendError`) → `packages/shared/src/response.ts`
  - Migrate `src/utils/pagination.ts` (`paginate`, `buildPaginatedResult`) → `packages/shared/src/pagination.ts`
  - Migrate `src/middleware/authenticate.ts` → `packages/shared/src/middleware/authenticate.ts`; keep JWT verification intact, reading `JWT_SECRET` from `process.env`
  - Migrate `src/utils/asyncHandler.ts` → `packages/shared/src/asyncHandler.ts`
  - Migrate `src/shared/zod/common.schemas.ts` (`uuidParamSchema`, `paginationQuerySchema`) → `packages/shared/src/schemas.ts`
  - Migrate `src/types/express.d.ts` (`JwtPayload`) → `packages/shared/src/types.ts`; export `JwtPayload` interface
  - Create `packages/shared/src/index.ts` re-exporting all of the above
  - Create `packages/shared/jest.config.ts` and migrate `src/utils/pagination.test.ts` → `packages/shared/tests/pagination.test.ts`; ensure property-based tests with `fast-check` pass
  - Run `tsc` inside `packages/shared` and confirm zero errors
  - **Requirements:** 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 11.3

- [ ] 2. Create auth-service
  - Scaffold `services/auth-service/` with `package.json` (dependency: `@shared/lib`), `tsconfig.json`, `.env.example`
  - Create `services/auth-service/prisma/schema.prisma` with `schemaName = "auth"` and models `User`, `RefreshToken`, `Role` (read-only projection)
  - Create `services/auth-service/src/config/env.ts` using Zod to validate all required vars (`PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET` min 32 chars, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`, `CLIENT_URL`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`); exit code 1 on failure logging `[auth-service] Configuration error: <field>: <issue>`
  - Migrate `src/modules/auth/repository/` → `services/auth-service/src/repository/`
  - Migrate `src/modules/auth/service/` → `services/auth-service/src/service/`; replace internal notification calls with HTTP call to `NOTIFICATION_SERVICE_URL` (fire-and-forget, 5s timeout)
  - Migrate `src/modules/auth/controller/`, `validation/`, `routes/` → `services/auth-service/src/`; import `authenticate`, `asyncHandler` from `@shared/lib`
  - Create `services/auth-service/src/app.ts` mounting the auth router and `errorHandler`
  - Create `services/auth-service/src/server.ts` that validates env, logs `[auth-service] Running on port <PORT> (NODE_ENV)`, and starts HTTP server
  - Create `services/auth-service/Dockerfile` with `builder` (compiles TS) and `runner` (runs `node dist/server.js`) stages
  - Create `services/auth-service/jest.config.ts` and migrate `src/modules/auth/tests/auth.service.unit.test.ts` → `services/auth-service/tests/auth.service.unit.test.ts`; mock Prisma and HTTP calls; confirm tests pass
  - **Requirements:** 1.1, 1.5, 1.6, 2.1, 4.1, 4.6, 7.1, 7.2, 7.5, 8.4, 9.9, 11.1, 11.2, 12.1, 12.4

- [ ] 3. Create user-service
  - Scaffold `services/user-service/` with `package.json`, `tsconfig.json`, `.env.example`
  - Create `services/user-service/prisma/schema.prisma` with `schemaName = "users"` and models `User`, `Role` (projection)
  - Create `services/user-service/src/config/env.ts` validating `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET` (min 32 chars)
  - Migrate `src/modules/users/` (repository, service, controller, validation, routes) → `services/user-service/src/`; import `authenticate`, `authorise`, `asyncHandler` from `@shared/lib`
  - Create `services/user-service/src/app.ts` and `src/server.ts` with `[user-service]` logging
  - Create `services/user-service/Dockerfile` with `builder` and `runner` stages
  - Create `services/user-service/jest.config.ts` and `tests/user.service.unit.test.ts` with mocked Prisma; confirm tests pass
  - **Requirements:** 1.1, 1.6, 2.2, 7.1, 7.7, 8.4, 9.11, 11.1, 12.1, 12.4

- [ ] 4. Create role-service
  - Scaffold `services/role-service/` with `package.json`, `tsconfig.json`, `.env.example`
  - Create `services/role-service/prisma/schema.prisma` with `schemaName = "roles"` and authoritative `Role` model
  - Create `services/role-service/src/config/env.ts` validating `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`
  - Migrate `src/modules/roles/` (repository, service, controller, validation, routes) → `services/role-service/src/`
  - Create `services/role-service/src/app.ts` and `src/server.ts` with `[role-service]` logging
  - Create `services/role-service/Dockerfile` with `builder` and `runner` stages
  - Create `services/role-service/jest.config.ts` and `tests/role.service.unit.test.ts`; confirm tests pass
  - **Requirements:** 1.1, 1.6, 2.3, 7.1, 7.7, 8.4, 9.11, 11.1, 12.1, 12.4

- [ ] 5. Create department-service
  - Scaffold `services/department-service/` with `package.json`, `tsconfig.json`, `.env.example`
  - Create `services/department-service/prisma/schema.prisma` with `schemaName = "departments"` and authoritative `Department` model
  - Create `services/department-service/src/config/env.ts` validating `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`
  - Migrate `src/modules/departments/` (repository, service, controller, validation, routes) → `services/department-service/src/`
  - Create `services/department-service/src/app.ts` and `src/server.ts` with `[department-service]` logging
  - Create `services/department-service/Dockerfile` with `builder` and `runner` stages
  - Create `services/department-service/jest.config.ts` and `tests/department.service.unit.test.ts`; confirm tests pass
  - **Requirements:** 1.1, 1.6, 2.4, 7.1, 7.7, 8.4, 9.11, 11.1, 12.1, 12.4

- [ ] 6. Create resource-service
  - Scaffold `services/resource-service/` with `package.json`, `tsconfig.json`, `.env.example`
  - Create `services/resource-service/prisma/schema.prisma` with `schemaName = "resources"` and `Resource` model; `departmentId` is a plain UUID string (no cross-schema relation)
  - Create `services/resource-service/src/config/env.ts` validating `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`
  - Migrate `src/modules/resources/` (repository, service, controller, validation, routes) → `services/resource-service/src/`
  - Create `services/resource-service/src/app.ts` and `src/server.ts` with `[resource-service]` logging
  - Create `services/resource-service/Dockerfile` with `builder` and `runner` stages
  - Create `services/resource-service/jest.config.ts` and `tests/resource.service.unit.test.ts`; confirm tests pass
  - **Requirements:** 1.1, 1.6, 2.5, 7.1, 7.7, 8.4, 9.11, 11.1, 12.1, 12.4

- [ ] 7. Create notification-service
  - Scaffold `services/notification-service/` with `package.json`, `tsconfig.json`, `.env.example`
  - Create `services/notification-service/prisma/schema.prisma` with `schemaName = "notifications"` and `Notification` model
  - Create `services/notification-service/src/config/env.ts` validating `PORT`, `NODE_ENV`, `DATABASE_URL`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `CLIENT_URL`
  - Migrate `src/modules/notifications/service/` and `src/modules/notifications/templates/` → `services/notification-service/src/`
  - Expose `POST /api/v1/notifications/send` accepting `{ userId?, type, subject, body }`, sending email via Brevo and persisting a `Notification` record
  - Create `services/notification-service/src/app.ts` and `src/server.ts` with `[notification-service]` logging
  - Create `services/notification-service/Dockerfile` with `builder` and `runner` stages
  - Create `services/notification-service/jest.config.ts` and migrate `src/modules/notifications/templates/emailTemplates.test.ts` → `services/notification-service/tests/emailTemplates.test.ts`; mock Brevo; confirm tests pass
  - **Requirements:** 1.1, 1.6, 2.7, 7.1, 7.6, 8.4, 11.1, 11.4, 12.1, 12.4

- [ ] 8. Create transaction-service
  - Scaffold `services/transaction-service/` with `package.json`, `tsconfig.json`, `.env.example`
  - Create `services/transaction-service/prisma/schema.prisma` with `schemaName = "transactions"`, `TransactionStatus` enum, and `Transaction` model
  - Create `services/transaction-service/src/config/env.ts` validating `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `USER_SERVICE_URL`, `RESOURCE_SERVICE_URL`, `NOTIFICATION_SERVICE_URL` as valid URLs
  - Migrate `src/modules/transactions/repository/` and `src/modules/transactions/utils/` → `services/transaction-service/src/`
  - Migrate `src/modules/transactions/service/` → `services/transaction-service/src/service/`; on POST add: `GET /api/v1/users/:userId` call (5s timeout, HTTP 422 on failure), `GET /api/v1/resources/:resourceId` call (5s timeout, HTTP 422 on failure), `POST /api/v1/notifications/send` call (3s timeout, log and continue on failure)
  - Migrate `src/modules/transactions/controller/`, `validation/`, `routes/` → `services/transaction-service/src/`; preserve status-transition rules exactly (`Pending→Active`, `Active→Completed|Cancelled`, terminal states)
  - Create `services/transaction-service/src/app.ts` and `src/server.ts` with `[transaction-service]` logging
  - Create `services/transaction-service/Dockerfile` with `builder` and `runner` stages
  - Create `services/transaction-service/jest.config.ts` and `tests/transaction.service.unit.test.ts`; mock Prisma and all inter-service HTTP calls; test all valid and invalid status transitions; confirm tests pass
  - **Requirements:** 1.1, 1.6, 2.6, 6.2, 6.3, 7.1, 7.8, 8.4, 9.10, 11.1, 12.1, 12.4

- [ ] 9. Create report-service
  - Scaffold `services/report-service/` with `package.json`, `tsconfig.json`, `.env.example`
  - Create `services/report-service/src/config/env.ts` validating `PORT`, `NODE_ENV`, `JWT_SECRET`, `USER_SERVICE_URL`, `RESOURCE_SERVICE_URL`, `TRANSACTION_SERVICE_URL`, `DEPARTMENT_SERVICE_URL` as valid URLs
  - Migrate `src/modules/reports/service/` → `services/report-service/src/service/`; replace direct Prisma queries with HTTP calls to domain services (5s timeout each); return HTTP 503 if any required call fails
  - Migrate `src/modules/reports/controller/` and `routes/` → `services/report-service/src/`
  - Create `services/report-service/src/app.ts` and `src/server.ts` with `[report-service]` logging
  - Create `services/report-service/Dockerfile` with `builder` and `runner` stages
  - Create `services/report-service/jest.config.ts` and `tests/report.service.unit.test.ts`; mock all HTTP calls; confirm tests pass
  - **Requirements:** 1.1, 1.6, 6.5, 7.1, 7.8, 8.4, 11.1, 12.1, 12.4

- [ ] 10. Create dashboard-service
  - Scaffold `services/dashboard-service/` with `package.json`, `tsconfig.json`, `.env.example`
  - Create `services/dashboard-service/src/config/env.ts` validating `PORT`, `NODE_ENV`, `JWT_SECRET`, `USER_SERVICE_URL`, `RESOURCE_SERVICE_URL`, `TRANSACTION_SERVICE_URL`, `DEPARTMENT_SERVICE_URL` as valid URLs
  - Migrate `src/modules/dashboard/service/` → `services/dashboard-service/src/service/`; replace direct Prisma queries with HTTP calls (5s timeout each); on partial failure return summary with `unavailableServices` array
  - Migrate `src/modules/dashboard/controller/` and `routes/` → `services/dashboard-service/src/`
  - Create `services/dashboard-service/src/app.ts` and `src/server.ts` with `[dashboard-service]` logging
  - Create `services/dashboard-service/Dockerfile` with `builder` and `runner` stages
  - Create `services/dashboard-service/jest.config.ts` and `tests/dashboard.service.unit.test.ts`; mock all HTTP calls including partial-failure scenario; confirm tests pass
  - **Requirements:** 1.1, 1.6, 6.4, 7.1, 7.8, 8.4, 11.1, 12.1, 12.4

- [ ] 11. Create api-gateway
  - Scaffold `services/api-gateway/` with `package.json` (dependencies: `express`, `http-proxy-middleware`, `@shared/lib`), `tsconfig.json`, `.env.example`
  - Create `services/api-gateway/src/config/env.ts` validating `PORT`, `NODE_ENV`, and all nine downstream service URL vars (`AUTH_SERVICE_URL` through `DASHBOARD_SERVICE_URL`) as valid URLs
  - Create `services/api-gateway/src/app.ts`: mount `http-proxy-middleware` for each path prefix with `changeOrigin: true`, `proxyTimeout: 30000`, and a custom `on.error` returning HTTP 503 Envelope on unreachable downstream; forward `Authorization` header unchanged; relay 4xx/5xx unchanged; mount `GET /health`; mount 404 catch-all with Envelope error
  - Create `services/api-gateway/src/server.ts` with `[api-gateway]` startup logging
  - Create `services/api-gateway/Dockerfile` with `builder` and `runner` stages
  - Create `services/api-gateway/jest.config.ts` and `tests/gateway.routing.test.ts` verifying routing and error responses with mocked downstreams; confirm tests pass
  - **Requirements:** 1.1, 1.5, 1.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13, 7.1, 7.9, 8.4, 8.5, 11.1, 12.1, 12.4

- [ ] 12. Docker Compose orchestration
  - Create root-level `docker-compose.yml` defining all 11 services (`db`, `api-gateway`, and the nine microservices)
  - Configure `db` with `postgres:15-alpine` and healthcheck (`interval: 10s`, `timeout: 5s`, `retries: 5`, `start_period: 30s`) with a named volume
  - Configure each domain microservice with `build.context`, `env_file`, `depends_on: db: condition: service_healthy`, `networks: microservices-network`, no host port bindings
  - Set each microservice `command` to `npx prisma migrate deploy && node dist/server.js` (services without Prisma schema skip migrate step)
  - Configure `api-gateway` with `ports: ["3000:3000"]` and `depends_on` with `condition: service_healthy` on all downstream microservices
  - Define `microservices-network` as an internal bridge network
  - Add `HEALTHCHECK` instructions in each `Dockerfile` so Docker Compose `service_healthy` conditions work
  - Create root-level `.env.example` documenting all variables grouped by service with comments
  - **Requirements:** 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 6.1, 7.3, 13.2, 13.3

- [ ] 13. Database seeding and migration wiring
  - Create `scripts/seed.ts` at repository root connecting to the shared PostgreSQL instance; upsert the default admin user and default roles idempotently (re-running does not create duplicates)
  - Add `"seed": "ts-node scripts/seed.ts"` to the root `package.json` scripts
  - Update the `auth-service` Docker Compose `command` to run migrations, then seed, then start: `npx prisma migrate deploy && npx ts-node /app/scripts/seed.ts && node dist/server.js`
  - Verify each service's `prisma/schema.prisma` specifies the correct `schemaName` matching the namespace in its `.env.example`
  - **Requirements:** 13.1, 13.2, 13.4, 13.5, 2.9, 2.10

- [ ] 14. Remove monolithic artifacts
  - Delete `src/app.ts`, `src/server.ts`, `src/routes/index.ts`
  - Delete `src/middleware/`, `src/utils/`, `src/shared/`, `src/types/` (all migrated to `packages/shared/`)
  - Delete `src/modules/` (all modules migrated to individual service directories)
  - Delete `src/config/`, `src/database/`, `src/docs/`
  - Delete root-level `jest.config.ts`, `jest.setup.ts`, `nodemon.json`, `tsconfig.json`, `Dockerfile`, `.dockerignore`
  - Delete root-level `coverage/` and `dist/` directories
  - For any file that cannot yet be deleted, add a `// TODO: remove after migration` comment and an entry in `MIGRATION_CLEANUP.md` with file path, reason, and blocking dependency
  - Update root-level `README.md` with architecture overview table (all services + ports + responsibilities), `docker compose up` instructions, API path prefix → service mapping table, links to per-service READMEs
  - Create `services/<service-name>/README.md` in each service documenting port, endpoints, env vars, and how to run tests
  - **Requirements:** 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 1.3

- [ ] 15. End-to-end verification
  - Run `tsc` inside every `services/<service-name>/` and `packages/shared/`; confirm zero TypeScript errors
  - Run `npm test` inside `packages/shared/` and every `services/<service-name>/`; confirm all suites pass
  - Run root `npm run test:all`; confirm it aggregates results and exits 0
  - Run `docker compose up --build`; wait up to 120 seconds and confirm all `GET /health` endpoints return HTTP 200
  - Confirm all API paths route correctly through the gateway
  - Confirm stopping any single microservice container does not crash the remaining containers
  - Confirm no file under any `services/<service-name>/` imports a path from another service directory
  - **Requirements:** 1.2, 1.4, 5.5, 8.6, 9.1, 9.3, 11.5, 11.6

## Task Dependency Graph

```
1 (Shared Library)
├── 2 (auth-service)
├── 3 (user-service)
├── 4 (role-service)
├── 5 (department-service)
├── 6 (resource-service)
├── 7 (notification-service)
├── 8 (transaction-service) → depends on 3, 6, 7
├── 9 (report-service) → depends on 3, 5, 6, 8
├── 10 (dashboard-service) → depends on 3, 5, 6, 8
└── 11 (api-gateway) → depends on 2, 3, 4, 5, 6, 7, 8, 9, 10

12 (Docker Compose) → depends on 2–11
13 (Seeding) → depends on 2, 12
14 (Remove monolith) → depends on 2–13
15 (Verification) → depends on 14
```

## Notes

- Tasks 2–7 (auth, user, role, department, resource, notification services) are independent of each other and can be implemented in parallel after Task 1 completes.
- Tasks 8–10 (transaction, report, dashboard services) depend on the services they call via HTTP; implement after Tasks 3, 5, 6, 7 are done.
- Task 11 (api-gateway) can be implemented in parallel with domain services once the routing table is known; final wiring requires all services to exist.
- Do not delete monolithic source files (Task 14) until all services and their tests are passing (Tasks 2–13).
- The `packages/shared/` package must be built (`tsc`) before any service that imports from it can be compiled or tested.

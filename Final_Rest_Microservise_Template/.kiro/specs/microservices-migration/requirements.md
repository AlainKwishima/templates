# Requirements Document

## Introduction

This document captures the requirements for migrating the Institution Management Starter Kit from its current monolithic architecture to a pure microservices architecture. The existing system is a single Node.js/TypeScript/Express application (`src/app.ts` + `src/server.ts`) that shares one PostgreSQL database, one Prisma client, one middleware stack, and one process for all eight domain modules: **auth**, **users**, **roles**, **departments**, **resources**, **transactions**, **reports**, and **dashboard**.

The migration must decompose this monolith into independently deployable services, each owning its own data store and process, while preserving all existing API contracts, business logic, and workflows. Every monolithic artifact — shared entrypoints, the single Dockerfile, the single `docker-compose.yml` API service, and the shared `src/` tree — must be replaced or restructured. The final system must be clean, stable, and fully operational using only the microservices architecture.

---

## Glossary

- **Monolith**: The current single-process Express application located at `src/app.ts` and `src/server.ts` that hosts all eight modules.
- **Microservice**: An independently deployable Node.js/TypeScript/Express process responsible for one bounded domain, with its own database schema, Prisma client, configuration, and Dockerfile.
- **API_Gateway**: A reverse-proxy service that receives all inbound HTTP traffic on a single public port and routes requests to the appropriate downstream microservice.
- **Auth_Service**: The microservice responsible for registration, login, logout, email verification, password reset, and JWT/refresh-token lifecycle.
- **User_Service**: The microservice responsible for CRUD management of user accounts.
- **Role_Service**: The microservice responsible for CRUD management of roles.
- **Department_Service**: The microservice responsible for CRUD management of departments.
- **Resource_Service**: The microservice responsible for CRUD management of institutional resources.
- **Transaction_Service**: The microservice responsible for creating, updating, and tracking resource transactions including status-transition enforcement.
- **Notification_Service**: The microservice responsible for sending transactional emails via Brevo and persisting notification records.
- **Report_Service**: The microservice responsible for generating aggregated statistical reports across domains.
- **Dashboard_Service**: The microservice responsible for assembling cross-domain summary metrics for the admin dashboard.
- **Shared_Library**: A local npm package (or shared TypeScript module) containing types, response helpers, error classes, pagination utilities, and Zod schemas reused across microservices.
- **Service_Registry**: A Docker Compose network or equivalent mechanism that allows microservices to discover and call each other by hostname.
- **JWT**: A JSON Web Token issued by Auth_Service and verified by each microservice independently using a shared `JWT_SECRET`.
- **Inter_Service_Call**: An HTTP request made from one microservice to another to retrieve or mutate data.
- **Health_Check**: An HTTP `GET /health` endpoint on each microservice that returns `{ success: true, data: { status: "ok" } }`.
- **Prisma_Schema**: The `.prisma` schema file owned by a specific microservice that defines only the database models within that service's bounded context.
- **Envelope**: The standard JSON response format `{ success: boolean, message: string, data: unknown }` used across all services.

---

## Requirements

---

### Requirement 1: Decompose Monolith into Independent Microservices

**User Story:** As a developer, I want the monolithic application replaced by independently deployable microservices, so that each service can be developed, tested, scaled, and deployed without affecting others.

#### Acceptance Criteria

1. THE System SHALL be decomposed into exactly the following microservices, each located at `services/<service-name>/` with its own `src/server.ts` entry point and `Dockerfile`: `auth-service`, `user-service`, `role-service`, `department-service`, `resource-service`, `transaction-service`, `notification-service`, `report-service`, `dashboard-service`, and `api-gateway`.
2. WHEN any single microservice process is stopped, THE System SHALL continue to serve requests to all other running microservices without any of them crashing or restarting.
3. THE System SHALL delete the monolithic files `src/app.ts`, `src/server.ts`, and `src/routes/index.ts` from the repository once all domain logic has been migrated to the corresponding service directories.
4. THE System SHALL ensure no file under any `services/<service-name>/` directory contains an import statement that resolves to a path under a different `services/<other-service-name>/` directory.
5. FOR ALL microservices, THE Microservice SHALL expose a `GET /health` endpoint that returns HTTP 200 with the JSON body `{ "success": true, "data": { "status": "ok" } }`.
6. EACH microservice `services/<service-name>/` directory SHALL contain at minimum: `src/server.ts`, `src/app.ts`, `package.json`, `tsconfig.json`, `Dockerfile`, and `.env.example`.

---

### Requirement 2: Service-Owned Data Stores

**User Story:** As a developer, I want each microservice to own its own database schema, so that services are loosely coupled and schema changes in one domain do not require coordinated deployments.

#### Acceptance Criteria

1. THE Auth_Service SHALL own a PostgreSQL schema namespace named `auth` containing the Prisma models `User`, `RefreshToken`, and a read-only `Role` projection required for authentication flows.
2. THE User_Service SHALL own a PostgreSQL schema namespace named `users` containing `User` and `Role` domain projections scoped to user management.
3. THE Role_Service SHALL own a PostgreSQL schema namespace named `roles` containing the authoritative `Role` model.
4. THE Department_Service SHALL own a PostgreSQL schema namespace named `departments` containing the authoritative `Department` model.
5. THE Resource_Service SHALL own a PostgreSQL schema namespace named `resources` containing the `Resource` model; any `Department` reference SHALL be a foreign-key-only field with no write migrations permitted in this schema.
6. THE Transaction_Service SHALL own a PostgreSQL schema namespace named `transactions` containing the authoritative `Transaction` model.
7. THE Notification_Service SHALL own a PostgreSQL schema namespace named `notifications` containing the authoritative `Notification` model.
8. WHEN a microservice requires data owned by another service, THE Microservice SHALL obtain it via an Inter_Service_Call; no microservice SHALL import the Prisma client of another service.
9. THE System SHALL retain a single shared PostgreSQL instance managed by the existing `db` Docker Compose service; each microservice SHALL connect via its own `DATABASE_URL` environment variable pointing to its dedicated schema namespace (e.g. `?schema=auth`).
10. EACH microservice's schema namespace name SHALL follow the pattern `<service-short-name>` (e.g. `auth`, `users`, `roles`) and SHALL be documented in that service's `.env.example`.

---

### Requirement 3: API Gateway for Unified Inbound Routing

**User Story:** As a client application, I want a single entry point for all API calls, so that I do not need to know the individual port or hostname of each microservice.

#### Acceptance Criteria

1. THE API_Gateway SHALL listen on a single public port (default `3000`) and proxy all requests to the appropriate downstream microservice based on path prefix; downstream requests SHALL be completed or fail within 30 seconds of receiving the client request.
2. THE API_Gateway SHALL route requests with path prefix `/api/v1/auth` to Auth_Service.
3. THE API_Gateway SHALL route requests with path prefix `/api/v1/users` to User_Service.
4. THE API_Gateway SHALL route requests with path prefix `/api/v1/roles` to Role_Service.
5. THE API_Gateway SHALL route requests with path prefix `/api/v1/departments` to Department_Service.
6. THE API_Gateway SHALL route requests with path prefix `/api/v1/resources` to Resource_Service.
7. THE API_Gateway SHALL route requests with path prefix `/api/v1/transactions` to Transaction_Service.
8. THE API_Gateway SHALL route requests with path prefix `/api/v1/reports` to Report_Service.
9. THE API_Gateway SHALL route requests with path prefix `/api/v1/dashboard` to Dashboard_Service.
10. WHEN a downstream microservice is unavailable (connection refused, request timeout after 30 seconds, or failure to respond), THE API_Gateway SHALL return HTTP 503 with an Envelope error message describing the service unavailability.
11. WHEN API_Gateway receives a request matching no defined route, THE API_Gateway SHALL return HTTP 404 with an Envelope error message.
12. THE API_Gateway SHALL forward the client's `Authorization` header unchanged to downstream microservices.
13. WHEN a downstream microservice returns an HTTP error response (4xx or 5xx), THE API_Gateway SHALL relay the response status code and body to the client unchanged.

---

### Requirement 4: JWT Authentication Across Services

**User Story:** As a microservice, I want to independently verify JWT tokens without calling Auth_Service on every request, so that authentication does not create a single point of failure or a performance bottleneck.

#### Acceptance Criteria

1. THE Auth_Service SHALL issue JWT access tokens signed with `JWT_SECRET` that include `userId`, `email`, and `role` claims, matching the existing `JwtPayload` interface.
2. WHEN a protected endpoint receives a request with a valid Bearer token, THE Microservice SHALL verify the token locally using the shared `JWT_SECRET` environment variable without making an Inter_Service_Call to Auth_Service; the decoded payload SHALL be attached to `req.user` as a `JwtPayload` object for access by the endpoint handler.
3. IF a request arrives without an `Authorization` header or with a malformed Bearer token, THEN THE Microservice SHALL return HTTP 401 with the Envelope error format `{ success: false, message: "Unauthorized - invalid or missing token" }`.
4. IF a request arrives with a Bearer token that has an invalid signature or is expired, THEN THE Microservice SHALL return HTTP 401 with the Envelope error format `{ success: false, message: "Unauthorized - token expired or invalid signature" }`.
5. THE Shared_Library authentication middleware function SHALL verify the Bearer token signature, check expiry, decode the payload, attach it to `req.user`, and return HTTP 401 with the appropriate Envelope error message if verification fails; each microservice SHALL import and apply this middleware to protected routes.
6. WHEN a client requests a new access token via the Auth_Service refresh-token endpoint, THE Auth_Service SHALL invalidate the prior refresh token in the database, issue a new access token and a new refresh token, return both tokens in the response, and record the new refresh token in the `RefreshToken` table.

---

### Requirement 5: Shared Library for Common Code

**User Story:** As a developer, I want shared utilities, types, and schemas in one place, so that I avoid duplicating error handling, response formatting, and validation logic across services.

#### Acceptance Criteria

1. THE Shared_Library SHALL contain: `AppError` class, `sendSuccess` and `sendError` response helpers, `paginate` and `buildPaginatedResult` utilities, `authenticate` middleware, `asyncHandler` wrapper, `uuidParamSchema` and `paginationQuerySchema` Zod schemas, and the `JwtPayload` TypeScript type.
2. THE Shared_Library SHALL be consumable by each microservice without circular dependencies; each microservice SHALL successfully import and use Shared_Library exports without runtime errors.
3. THE System SHALL remove all per-service copies of the utilities listed in criterion 1 and replace them with import statements referencing the Shared_Library.
4. THE Shared_Library SHALL be located at `packages/shared/` as an npm workspace package with its own `package.json` defining `name: "@shared/lib"` or equivalent; each microservice `package.json` SHALL list it as a dependency.
5. WHEN any microservice runs `npm run build` or `tsc`, THE build SHALL complete without TypeScript compilation errors related to Shared_Library imports.
6. THE System SHALL verify that no file in the Shared_Library imports any module from a microservice directory.

---

### Requirement 6: Inter-Service Communication

**User Story:** As a microservice, I want a reliable way to call other microservices, so that cross-domain operations (e.g. Transaction_Service fetching user details) work correctly at runtime.

#### Acceptance Criteria

1. THE System SHALL configure a Docker Compose network named `microservices-network` so that each microservice can resolve other services by hostname (e.g. `http://user-service:PORT`).
2. WHEN Transaction_Service creates a transaction, THE Transaction_Service SHALL call User_Service and Resource_Service via Inter_Service_Call with a 5-second timeout to validate the referenced `userId` and `resourceId` exist; IF either validation call returns non-200 or times out, THEN THE Transaction_Service SHALL reject the creation request with HTTP 422 and a descriptive Envelope message.
3. WHEN Transaction_Service creates or updates a transaction successfully, THE Transaction_Service SHALL call Notification_Service via Inter_Service_Call with a 3-second timeout to trigger the appropriate email notification; IF the notification call fails or times out, THE Transaction_Service SHALL log the failure and return the transaction response to the client without blocking.
4. WHEN Dashboard_Service assembles a summary, THE Dashboard_Service SHALL call User_Service, Resource_Service, Transaction_Service, and Department_Service via Inter_Service_Call with a 5-second timeout per call to aggregate counts and records from the last 30 days; IF a partial set of services responds successfully, THE Dashboard_Service SHALL return a partial summary with a field indicating which services were unavailable.
5. WHEN Report_Service generates a report, THE Report_Service SHALL call the relevant domain services via Inter_Service_Call with a 5-second timeout per call to retrieve aggregated statistics; IF any required call fails, THE Report_Service SHALL return HTTP 503 with a descriptive Envelope message.
6. THE System SHALL define environment variables for each service to locate downstream services (e.g. `USER_SERVICE_URL`, `RESOURCE_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`, `TRANSACTION_SERVICE_URL`, `DEPARTMENT_SERVICE_URL`), validated on startup.
7. IF an Inter_Service_Call fails due to a network error or non-2xx response, THEN THE calling Microservice SHALL return HTTP 502 with the Envelope error format `{ success: false, message: "Bad Gateway - <service-name> unavailable" }` unless a more specific behavior is defined for that call.

---

### Requirement 7: Per-Service Configuration and Environment Variables

**User Story:** As a developer, I want each microservice to validate its own environment variables on startup, so that misconfigured services fail fast with clear error messages.

#### Acceptance Criteria

1. EACH Microservice SHALL validate its required environment variables on process startup using Zod before opening its HTTP server, matching the pattern established in `src/config/env.ts`.
2. IF any required environment variable is missing, an empty string, or fails Zod type validation, THEN THE Microservice SHALL log `[service-name] Configuration error: <field>: <issue>` for each invalid variable to `console.error` and exit with process code 1 before binding to any port.
3. THE System SHALL provide a root-level `.env.example` file that documents all environment variables for all microservices, with comments grouping variables by service name.
4. EACH Microservice SHALL have its own `.env.example` file at `services/<service-name>/.env.example` documenting only the variables that service requires, with a comment explaining the purpose of each variable.
5. THE Auth_Service configuration SHALL require and validate: `PORT` (integer 1–65535), `NODE_ENV` (enum: `development`, `production`, `test`), `DATABASE_URL` (non-empty string), `JWT_SECRET` (string, minimum 32 characters), `JWT_ACCESS_EXPIRY` (non-empty string), `JWT_REFRESH_EXPIRY` (non-empty string), `CLIENT_URL` (non-empty string), `BREVO_API_KEY` (non-empty string), `BREVO_SENDER_EMAIL` (valid email format), `BREVO_SENDER_NAME` (non-empty string).
6. THE Notification_Service configuration SHALL require and validate: `PORT` (integer 1–65535), `NODE_ENV` (enum: `development`, `production`, `test`), `DATABASE_URL` (non-empty string), `BREVO_API_KEY` (non-empty string), `BREVO_SENDER_EMAIL` (valid email format), `BREVO_SENDER_NAME` (non-empty string), `CLIENT_URL` (non-empty string).
7. EACH non-auth, non-notification Microservice configuration SHALL require and validate at minimum: `PORT` (integer 1–65535), `NODE_ENV` (enum: `development`, `production`, `test`), `DATABASE_URL` (non-empty string), `JWT_SECRET` (string, minimum 32 characters).
8. THE Transaction_Service, Dashboard_Service, and Report_Service configurations SHALL additionally require and validate the relevant inter-service URL variables (e.g. `USER_SERVICE_URL`, `RESOURCE_SERVICE_URL`) as non-empty strings with a valid URL format.
9. THE API_Gateway configuration SHALL require and validate: `PORT` (integer 1–65535), `NODE_ENV`, and one URL variable per downstream microservice (e.g. `AUTH_SERVICE_URL`, `USER_SERVICE_URL`, etc.) as non-empty URL strings.

---

### Requirement 8: Docker Compose Orchestration

**User Story:** As a developer, I want a single `docker-compose.yml` that starts all microservices and their dependencies, so that the entire system can be run locally with one command.

#### Acceptance Criteria

1. THE System SHALL provide a root-level `docker-compose.yml` that defines services for: `db` (PostgreSQL), `api-gateway`, `auth-service`, `user-service`, `role-service`, `department-service`, `resource-service`, `transaction-service`, `notification-service`, `report-service`, and `dashboard-service`.
2. EACH microservice Docker Compose service SHALL declare a `depends_on` condition on `db` with `condition: service_healthy` and SHALL not start until the `db` health check passes.
3. THE `db` service SHALL use the `postgres:15-alpine` image and include a health check with `interval: 10s`, `timeout: 5s`, `retries: 5`, and `start_period: 30s`.
4. EACH Microservice SHALL have its own `Dockerfile` at `services/<service-name>/Dockerfile` using exactly two build stages: a `builder` stage that compiles TypeScript using `npm run build` and a `runner` stage that copies the compiled output and runs `node dist/server.js`.
5. THE docker-compose `api-gateway` service SHALL be the only service that publishes a port to the host machine (default `3000:3000`); all other microservices SHALL communicate only via the internal Docker network.
6. WHEN `docker compose up` is executed, THE System SHALL start all services such that all Health_Check endpoints return HTTP 200 within `HEALTHCHECK_STARTUP_TIMEOUT` seconds (default: 120 seconds) of the command being issued.
7. THE `api-gateway` Docker Compose service SHALL declare `depends_on` with `condition: service_healthy` on each downstream microservice service to ensure it does not start before any upstream service is ready.

---

### Requirement 9: Preserve All Existing API Contracts

**User Story:** As an API client, I want all existing endpoints, request schemas, and response formats to remain unchanged, so that no breaking changes are introduced during the migration.

#### Acceptance Criteria

1. THE System SHALL preserve all existing REST endpoint paths: `POST /api/v1/auth/register`, `POST /api/v1/auth/verify-email`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`, `POST /api/v1/auth/refresh-token`, `GET /api/v1/users`, `POST /api/v1/users`, `GET /api/v1/users/:id`, `PUT /api/v1/users/:id`, `DELETE /api/v1/users/:id`, `GET /api/v1/roles`, `POST /api/v1/roles`, `GET /api/v1/roles/:id`, `PUT /api/v1/roles/:id`, `DELETE /api/v1/roles/:id`, `GET /api/v1/departments`, `POST /api/v1/departments`, `GET /api/v1/departments/:id`, `PUT /api/v1/departments/:id`, `DELETE /api/v1/departments/:id`, `GET /api/v1/resources`, `POST /api/v1/resources`, `GET /api/v1/resources/:id`, `PUT /api/v1/resources/:id`, `DELETE /api/v1/resources/:id`, `GET /api/v1/transactions`, `POST /api/v1/transactions`, `GET /api/v1/transactions/:id`, `PUT /api/v1/transactions/:id`, `DELETE /api/v1/transactions/:id`, `GET /api/v1/reports/users`, `GET /api/v1/reports/resources`, `GET /api/v1/reports/transactions`, `GET /api/v1/reports/departments`, and `GET /api/v1/dashboard`.
2. THE System SHALL preserve the HTTP method for each endpoint as defined in the current module route files.
3. WHEN a request succeeds, THE System SHALL return the Envelope format `{ success: true, message: string, data: unknown }` with HTTP 200 for retrieval operations, HTTP 201 for creation operations, or the status code defined by the existing endpoint implementation.
4. WHEN a paginated endpoint returns results, THE System SHALL include `page`, `limit`, `total`, and `totalPages` as numeric values at the root level of the JSON response alongside `success`, `message`, and `data`.
5. IF request validation fails, THEN THE System SHALL return HTTP 400 with the Envelope error format `{ success: false, message: string, errors: array }` where `errors` contains the validation failure details.
6. IF a request lacks a valid Bearer token for a protected endpoint, THEN THE System SHALL return HTTP 401 with the Envelope error format.
7. IF a request has a valid Bearer token but the user's role lacks authorization for the endpoint, THEN THE System SHALL return HTTP 403 with the Envelope error format.
8. THE System SHALL preserve existing Zod validation schemas for all request bodies, query parameters, and path parameters, migrating domain-specific schemas into the respective microservice and shared schemas into the Shared_Library.
9. THE Auth_Service SHALL preserve all authentication flows: register, login, logout, verify-email, forgot-password, reset-password, and refresh-token with their existing request schemas and response formats.
10. THE Transaction_Service SHALL preserve the existing status-transition logic: `Pending` transitions only to `Active`; `Active` transitions only to `Completed` or `Cancelled`; `Completed` and `Cancelled` are terminal states with no valid transitions.
11. THE System SHALL preserve role-based authorization: all `/api/v1/users` and `/api/v1/roles` endpoints require `Admin` role; `POST`, `PUT`, and `DELETE` on `/api/v1/departments` and `/api/v1/resources` require `Admin` role; `POST` and `PUT` on `/api/v1/transactions` require `Admin` or `Staff` role; `DELETE` on `/api/v1/transactions` requires `Admin` role.

---

### Requirement 10: Remove All Monolithic Artifacts

**User Story:** As a developer, I want all monolithic code, configuration, and documentation removed or replaced, so that there is no architectural ambiguity or risk of accidentally running the old system.

#### Acceptance Criteria

1. WHEN all microservice Health_Check endpoints return HTTP 200 and the existing test suite passes against API_Gateway, THE System SHALL remove the root-level monolithic `src/` directory.
2. THE System SHALL remove the root-level monolithic configuration files `jest.config.ts`, `jest.setup.ts`, `nodemon.json`, `tsconfig.json`, `Dockerfile`, and `.dockerignore`, replacing them with per-service equivalents under `services/<service-name>/`.
3. THE System SHALL remove the root-level monolithic `package.json` dependency manifest, replacing it with a workspace-level `package.json` (npm workspaces) or per-service `package.json` files.
4. THE System SHALL update the root-level `README.md` to document the microservices architecture including: an architecture overview listing all microservices and their responsibilities, instructions for running with `docker compose up`, a table mapping API path prefixes to services, and links to per-service README files.
5. THE System SHALL remove the `coverage/` and `dist/` directories belonging to the monolithic build.
6. IF a monolithic file or directory is still imported or referenced by any active microservice code or docker-compose definition, THEN THE System SHALL mark it with a `// TODO: remove after migration` comment and add an entry to a root-level `MIGRATION_CLEANUP.md` file listing the file path, reason for retention, and the blocking dependency.
7. THE updated root-level `README.md` SHALL include at minimum: an architecture diagram or description listing all microservices, instructions for running with `docker compose up`, a table mapping API path prefixes to services, and links to per-service README files.

---

### Requirement 11: Per-Service Testing

**User Story:** As a developer, I want each microservice to have its own test suite, so that I can verify a service in isolation without standing up the entire system.

#### Acceptance Criteria

1. EACH Microservice SHALL have its own `jest.config.ts` at `services/<service-name>/jest.config.ts` and a `tests/` directory containing unit tests for the service layer.
2. THE Auth_Service test suite SHALL include unit tests migrated from the existing `src/modules/auth/tests/auth.service.unit.test.ts`; the original file SHALL be deleted after migration.
3. THE Shared_Library test suite SHALL include the property-based tests currently in `src/utils/pagination.test.ts`; the tests SHALL use the `fast-check` library; the original file SHALL be deleted after migration.
4. THE Notification_Service test suite SHALL include tests migrated from the existing `src/modules/notifications/templates/emailTemplates.test.ts`; the original file SHALL be deleted after migration.
5. WHEN `npm test` is run within any microservice directory (`services/<service-name>/`), THE Microservice test suite SHALL execute all tests and produce a coverage report in the `coverage/` subdirectory without requiring any other service to be running.
6. THE System SHALL provide a root-level `package.json` script `test:all` that runs the test suite for every microservice and the Shared_Library; IF any individual test suite exits with a non-zero code, THEN THE `test:all` script SHALL also exit with a non-zero code and report which services failed.
7. WHEN `npm test` fails in any microservice, THE test runner SHALL output the service name, the test file path, and the test case name for each failing test.
8. EACH microservice test suite SHALL mock all external dependencies (database, other services, Brevo API) so that tests run without network access.

---

### Requirement 12: Logging and Observability Standards

**User Story:** As an operator, I want consistent structured logging across all microservices, so that I can correlate events and diagnose issues in a distributed system.

#### Acceptance Criteria

1. EACH Microservice SHALL prefix all console output (`console.log`, `console.error`, `console.warn`, `console.info`) with a service identifier tag in the format `[service-name]`, where `service-name` uniquely identifies the microservice (e.g. `[auth-service]`, `[transaction-service]`).
2. WHEN an unhandled error occurs in any Microservice, THE Microservice SHALL log using `console.error` the service name, HTTP method, request path, error message, and error stack trace (if available), before returning an HTTP 500 Envelope response.
3. WHEN the `errorHandler` middleware in a Microservice processes an unhandled error, THE Microservice SHALL include the service name in the `console.error` output.
4. WHEN a microservice starts successfully, THE Microservice SHALL log using `console.log` its service name, listening port number, and `NODE_ENV` value.
5. IF a microservice fails to start, THEN THE Microservice SHALL log the service name and failure reason using `console.error` before terminating.

---

### Requirement 13: Database Migration and Seeding

**User Story:** As a developer, I want each microservice to manage its own Prisma migrations, so that schema changes can be deployed independently per service.

#### Acceptance Criteria

1. EACH Microservice that owns a database schema SHALL contain a `prisma/schema.prisma` file at `services/<service-name>/prisma/schema.prisma` defining only the models within its bounded context and specifying `schemaName = "<service-short-name>"` in the datasource block to namespace all tables.
2. THE System SHALL configure each microservice's Docker Compose `command` to run `npx prisma migrate deploy` before starting the HTTP server, ensuring migrations complete before the service accepts requests.
3. IF `prisma migrate deploy` fails for any microservice, THEN that service SHALL log the error with `console.error` and exit with code 1 without binding to any port.
4. THE System SHALL provide a `scripts/seed.ts` script at the repository root that connects to the shared database and inserts the initial data defined in `src/database/seed.ts`: the default admin user and default roles; the script SHALL be idempotent (re-running it SHALL not create duplicate records).
5. THE Auth_Service Docker Compose service SHALL execute the root seed script after its own migrations succeed and before it accepts HTTP requests.
6. WHEN `prisma migrate deploy` is run for a microservice, THE System SHALL apply only the migration files located in `services/<service-name>/prisma/migrations/` and SHALL not affect tables in other schema namespaces.
7. EACH microservice migration set SHALL be independently versioned; adding a migration to one service SHALL not require changes to any other service's migration files.

---

### Requirement 14: Notification Service Email Flows

**User Story:** As a user, I want to continue receiving transactional emails (welcome, email verification, password reset, transaction notifications), so that all communication workflows remain functional after the migration.

#### Acceptance Criteria

1. THE Notification_Service SHALL expose a single HTTP endpoint `POST /api/v1/notifications/send` that accepts a JSON payload containing fields: `userId` (UUID), `type` (string), `subject` (string, max 200 characters), `body` (string, max 10,000 characters), and optional `metadata` (object).
2. THE Notification_Service SHALL validate the `type` field against the enumeration: `welcome`, `email-verification`, `verification-success`, `password-reset`, `transaction-created`, `transaction-status-update`; IF the type is not in this list, THEN it SHALL return HTTP 400 with an Envelope error message.
3. WHEN Notification_Service receives a valid `/send` request, THE Service SHALL first persist a `Notification` record to its database schema with `userId`, `type`, `subject`, `body`, and a `null` `sentAt` timestamp, then attempt to deliver the email via Brevo; IF the email delivery succeeds, THE Service SHALL update the `Notification` record's `sentAt` to the current timestamp and return HTTP 200 with the notification ID; IF the email delivery fails, THE Service SHALL leave `sentAt` as `null` and still return HTTP 200 with the notification ID.
4. WHEN Notification_Service calls the Brevo API to send an email, THE Service SHALL time out the request after 10 seconds; IF the request times out or Brevo returns an error response, THE Service SHALL log the error with `console.error` including the notification ID and user ID.
5. THE Notification_Service SHALL validate `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `BREVO_SENDER_NAME` on startup and exit with code 1 and a descriptive error message if any are missing or fail Zod validation.
6. IF the Brevo API returns an error indicating a malformed email address or rate limit, THEN THE Notification_Service SHALL return HTTP 200 with the notification ID and a field in the response indicating the email was not sent; the calling service SHALL not be blocked by this failure.
7. THE Notification_Service SHALL preserve the existing email template patterns from `src/modules/notifications/templates/emailTemplates.ts` for each notification type.

---

### Requirement 15: API Documentation per Service

**User Story:** As a developer, I want Swagger/OpenAPI documentation available for each microservice, so that I can explore and test individual service APIs independently.

#### Acceptance Criteria

1. WHEN `DISABLE_SWAGGER` is not set to `"true"`, EACH Microservice SHALL serve a Swagger UI at `GET /api-docs` that renders the OpenAPI specification for that service's endpoints, following the existing Swagger configuration pattern from `src/config/swagger.ts`.
2. WHEN `DISABLE_SWAGGER` is set to `"true"` for a Microservice, THE Microservice SHALL not initialize Swagger UI and SHALL return HTTP 404 for any request to `/api-docs`.
3. THE API_Gateway SHALL serve a unified OpenAPI specification at `GET /api-docs` that aggregates all downstream microservice endpoints; each endpoint SHALL be tagged with its originating service name (e.g. `Auth`, `Users`, `Transactions`); the aggregated spec SHALL include all path definitions, schemas, and security requirements from each microservice.
4. IF a downstream microservice's `/api-docs.json` endpoint is unavailable or returns an error when API_Gateway attempts to aggregate, THE API_Gateway SHALL log the failure with `console.warn` and SHALL exclude that service's routes from the aggregated specification; the aggregated spec SHALL still be served with the endpoints from available services.
5. THE API_Gateway aggregated Swagger UI SHALL display endpoints grouped by service tag, allowing a developer to filter by service name in the Swagger interface.

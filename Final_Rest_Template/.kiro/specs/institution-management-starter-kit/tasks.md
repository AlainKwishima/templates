# Implementation Plan: Institution Management Starter Kit

## Overview

Implement a production-ready REST API backend scaffold in TypeScript/Express.js with PostgreSQL and Prisma ORM. The build order follows strict dependency sequencing: project scaffolding → shared utilities → database layer → middleware → feature modules → tests → documentation artifacts.

## Tasks

- [x] 1. Project scaffolding and configuration
  - [x] 1.1 Initialise project structure and TypeScript configuration
    - Create `src/` directory tree: `config/`, `modules/`, `middleware/`, `utils/`, `shared/zod/`, `database/`, `docs/`, `routes/`
    - Write `tsconfig.json` with `strict: true`, `target: ES2020`, `module: CommonJS`, `outDir: dist`, `rootDir: src`
    - Write `package.json` with all runtime and dev dependencies (express, prisma, @prisma/client, zod, jsonwebtoken, bcrypt, @getbrevo/brevo, swagger-jsdoc, swagger-ui-express, jest, ts-jest, supertest, fast-check, eslint, prettier, nodemon, ts-node)
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Write tooling configuration files
    - Write `.eslintrc.json` (TypeScript ESLint rules) and `.prettierrc` (consistent formatting)
    - Write `nodemon.json` watching `src/**/*.ts` and executing via `ts-node`
    - Write `jest.config.ts` with `ts-jest` preset, `testEnvironment: node`, coverage from `src/`
    - Write `.gitignore` excluding `node_modules/`, `dist/`, `.env`, Prisma migration lock files
    - _Requirements: 1.5, 1.6, 17.1, 17.9, 18.2_

  - [x] 1.3 Write Docker and environment configuration files
    - Write `Dockerfile` (Node 20 LTS, multi-stage build)
    - Write `docker-compose.yml` starting API server and PostgreSQL 15 instance
    - Write `.env.example` listing every required variable with placeholder values and inline comments
    - _Requirements: 1.3, 1.7_

  - [x] 1.4 Write npm scripts in `package.json`
    - Add scripts: `dev`, `build`, `start`, `lint`, `format`, `test`, `db:migrate`, `db:generate`, `db:seed`, `db:studio`
    - _Requirements: 18.1_

- [ ] 2. Environment validation and Prisma configuration
  - [ ] 2.1 Implement `src/config/env.ts` — environment variable validation
    - Use Zod to parse `process.env` and export a typed `env` object
    - Exit with a descriptive error message if any required variable is missing or invalid
    - Variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `PORT`, `NODE_ENV`, `CLIENT_URL`, optional `DISABLE_SWAGGER`
    - _Requirements: 1.4_

  - [ ] 2.2 Implement `src/config/database.ts` — Prisma client singleton
    - Export a single `PrismaClient` instance, reusing the global instance in development to avoid connection exhaustion during hot-reload
    - _Requirements: 2.1_

- [ ] 3. Prisma schema, migrations, and seeder
  - [ ] 3.1 Write the complete Prisma schema
    - Define models: `User`, `Role`, `Department`, `Resource`, `Transaction`, `Notification`, `RefreshToken`
    - Add all fields, types, defaults, nullable markers, and foreign-key relations exactly as specified in the design
    - Define enums `ResourceStatus` (`Active`, `Inactive`) and `TransactionStatus` (`Pending`, `Active`, `Completed`, `Cancelled`)
    - Add `@@index` directives on `User.email`, `Resource.code`, `Resource.departmentId`, `Transaction.userId`, `Transaction.resourceId`, `Transaction.status`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ] 3.2 Run initial Prisma migration
    - Execute `prisma migrate dev --name init` to generate and apply the initial migration SQL
    - Run `prisma generate` to produce the typed Prisma client
    - _Requirements: 2.1_

  - [ ] 3.3 Implement `src/database/seed.ts` — idempotent database seeder
    - Seed at minimum: 3 Roles (`Admin`, `Staff`, `User`), 2 Departments, 4 Resources, 1 admin User (hashed password), 2 sample Transactions
    - Before inserting each model, check existing record count and skip if minimum is already met
    - Log inserted vs skipped count per model
    - _Requirements: 2.9, 2.10_

  - [ ]* 3.4 Write property test for seeder idempotency (Property 26)
    - **Property 26: Seeder Idempotency**
    - Run seeder twice against a test database; assert final record counts equal counts after first run
    - **Validates: Requirements 2.9, 2.10**

- [ ] 4. Shared utilities and Zod schemas
  - [ ] 4.1 Implement `src/utils/AppError.ts`
    - Define `AppError extends Error` with `statusCode: number`, `errors?: { field: string; message: string }[]`, `isOperational: boolean`
    - Capture stack trace via `Error.captureStackTrace`
    - _Requirements: 14.1_

  - [ ] 4.2 Implement `src/utils/asyncHandler.ts`
    - Wrap async route handlers to forward rejected promises to `next(error)`
    - _Requirements: 14.2_

  - [ ] 4.3 Implement `src/utils/response.ts`
    - Export `sendSuccess(res, data, message, statusCode?)` producing `{ success: true, message, data }`
    - Export `sendError(res, message, statusCode, errors?)` producing `{ success: false, message, errors }`
    - _Requirements: 12.2, 12.3_

  - [ ] 4.4 Implement `src/utils/pagination.ts`
    - Export `paginate(params)` returning `{ skip, take }`
    - Export `buildPaginatedResult<T>(data, total, params)` returning `{ data, page, limit, total, totalPages }`
    - _Requirements: 12.5_

  - [ ] 4.5 Implement `src/shared/zod/common.schemas.ts`
    - Export `uuidParamSchema` (validates `:id` route param as UUID)
    - Export `paginationQuerySchema` (validates `page`, `limit`, `search` with defaults)
    - Export `emailSchema` and `passwordSchema` (min 8 chars) for reuse across modules
    - _Requirements: 13.3_

  - [ ]* 4.6 Write property test for pagination helper (Property 10)
    - **Property 10: Pagination Correctness**
    - Use `fc.integer({ min: 1 })` for `page` and `limit`; assert `data.length ≤ limit`, `totalPages = ceil(total/limit)`, response `page` and `limit` match inputs
    - **Validates: Requirements 4.1, 6.1, 7.1, 8.1, 12.5**

- [ ] 5. Middleware layer
  - [ ] 5.1 Implement `src/middleware/validate.ts` — Zod validation middleware
    - Accept a Zod schema and return an Express middleware that validates `req.body`, `req.params`, and/or `req.query`
    - On failure, format Zod errors into the standard error envelope and return `400` with per-field messages
    - _Requirements: 13.1, 13.2, 13.4_

  - [ ] 5.2 Implement `src/middleware/authenticate.ts`
    - Extract Bearer token from `Authorization` header
    - Verify with `jsonwebtoken` using `JWT_SECRET`; attach decoded `{ userId, email, role }` to `req.user`
    - Return `401` if header absent, token malformed, or token expired/invalid
    - Extend Express `Request` interface with `user?: JwtPayload`
    - _Requirements: 15.1, 15.2_

  - [ ] 5.3 Implement `src/middleware/authorise.ts`
    - Export `authorise(...roles: string[])` factory returning middleware that checks `req.user.role`
    - Return `403` if role not in permitted list
    - _Requirements: 15.3, 15.4_

  - [ ] 5.4 Implement `src/middleware/errorHandler.ts` — Global Error Handler
    - Handle `AppError` → return `err.statusCode` + `err.message` + `err.errors`
    - Handle Prisma `P2002` → `409` with human-readable message
    - Handle Prisma `P2025` → `404` with human-readable message
    - Handle all other errors → log full stack, return `500` with generic message
    - _Requirements: 14.2, 14.3, 14.4, 14.5, 14.6_

  - [ ]* 5.5 Write property test for error handler status code preservation (Property 22)
    - **Property 22: Error Handler Status Code Preservation**
    - Use `fc.integer({ min: 400, max: 599 })` for `statusCode`; assert `AppError` with that code produces matching HTTP status; assert P2002 → 409, P2025 → 404
    - **Validates: Requirements 14.3, 14.4, 14.5**

  - [ ]* 5.6 Write property test for validation error field reporting (Property 21)
    - **Property 21: Validation Error Field Reporting**
    - Generate invalid payloads with `fc.record`; assert `400` response contains `errors` array with field names and messages
    - **Validates: Requirements 13.1, 13.2**

  - [ ]* 5.7 Write property test for authentication enforcement (Property 19)
    - **Property 19: Authentication Enforcement**
    - For each protected route, send requests with missing/invalid/expired tokens; assert `401` in all cases
    - **Validates: Requirements 4.8, 15.1, 15.2, 15.5**

  - [ ]* 5.8 Write property test for RBAC enforcement (Property 20)
    - **Property 20: Role-Based Access Control Enforcement**
    - For each Admin-only endpoint, send requests with non-Admin valid tokens; assert `403`
    - **Validates: Requirements 4.9, 5.1, 8.7, 10.5, 11.2, 15.3, 15.4**

  - [ ]* 5.9 Write property test for standard response envelope (Property 18)
    - **Property 18: Standard Response Envelope**
    - For any `2xx` response assert `{ success: true, message, data }`; for any non-`2xx` assert `{ success: false, message, errors }`
    - **Validates: Requirements 12.2, 12.3, 12.4**

- [ ] 6. App entry points
  - [ ] 6.1 Implement `src/app.ts`
    - Initialise Express app with `express.json()`, `cors`, and `helmet` middleware
    - Mount the `/api/v1` router from `src/routes/index.ts`
    - Register the `404` catch-all route after all route definitions
    - Register the Global Error Handler as the last `app.use()` call
    - Conditionally mount Swagger UI at `/api-docs` unless `DISABLE_SWAGGER=true`
    - _Requirements: 14.7, 16.1, 16.4_

  - [ ] 6.2 Implement `src/server.ts`
    - Import `env` from `config/env.ts` (triggers validation on startup)
    - Import the Prisma client and call `$connect()`
    - Start the HTTP server on `env.PORT`
    - Log startup confirmation with port and environment
    - _Requirements: 1.4_

  - [ ] 6.3 Implement `src/config/swagger.ts`
    - Configure `swagger-jsdoc` options: OpenAPI 3.0, API info, Bearer auth security scheme, glob pattern for JSDoc annotations
    - _Requirements: 16.1, 16.2, 16.3_

- [ ] 7. Checkpoint — core infrastructure
  - Ensure `npm run build` compiles without TypeScript errors.
  - Ensure `npm run db:migrate` and `npm run db:seed` complete successfully.
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Auth module
  - [ ] 8.1 Implement Auth repository (`src/modules/auth/repository/auth.repository.ts`)
    - Methods: `findUserByEmail`, `findUserById`, `createUser`, `updateUser`, `createRefreshToken`, `findRefreshToken`, `deleteRefreshToken`
    - _Requirements: 3.1, 3.5, 3.7, 3.12_

  - [ ] 8.2 Implement Auth service (`src/modules/auth/service/auth.service.ts`)
    - `register`: hash password (bcrypt cost ≥ 10), assign default `User` role, generate email verification token, call notification service (fire-and-forget)
    - `verifyEmail`: validate token, set `isEmailVerified: true`, clear token
    - `login`: verify credentials, sign Access Token (JWT, `JWT_ACCESS_EXPIRY`), create Refresh Token record (`JWT_REFRESH_EXPIRY`)
    - `logout`: delete Refresh Token record
    - `forgotPassword`: generate reset token, store hash + expiry (1 hour), call notification service
    - `resetPassword`: validate token + expiry, hash new password, clear reset fields
    - `refreshToken`: validate Refresh Token record, sign new Access Token
    - _Requirements: 3.1–3.14_

  - [ ] 8.3 Implement Auth Zod validation schemas (`src/modules/auth/validation/auth.schemas.ts`)
    - `registerSchema`, `loginSchema`, `verifyEmailSchema`, `forgotPasswordSchema`, `resetPasswordSchema`, `refreshTokenSchema`
    - _Requirements: 13.1_

  - [ ] 8.4 Implement Auth controller (`src/modules/auth/controller/auth.controller.ts`)
    - One handler per endpoint; use `asyncHandler`; call service; use `sendSuccess`
    - _Requirements: 3.1–3.12_

  - [ ] 8.5 Implement Auth routes (`src/modules/auth/routes/auth.routes.ts`)
    - Register public routes: `POST /register`, `POST /verify-email`, `POST /login`, `POST /logout`, `POST /forgot-password`, `POST /reset-password`, `POST /refresh-token`
    - Apply `validate` middleware to each route with the corresponding schema
    - Add Swagger JSDoc annotations for all routes
    - _Requirements: 3.1–3.12, 15.5, 16.2_

  - [ ] 8.6 Write unit tests for Auth service (`src/modules/auth/tests/auth.service.unit.test.ts`)
    - Mock repository; cover: successful registration, duplicate email → `AppError(409)`, successful login, invalid credentials → `AppError(401)`, password reset flow, email verification flow
    - _Requirements: 17.3_

  - [ ]* 8.7 Write property test — password hashing (Property 1)
    - **Property 1: Password Hashing Irreversibility and Verifiability**
    - Use `fc.string({ minLength: 1 })` for passwords; assert stored hash ≠ plaintext and `bcrypt.compare` returns `true`
    - **Validates: Requirements 3.13**

  - [ ]* 8.8 Write property test — registration round-trip (Property 2)
    - **Property 2: Registration Round-Trip**
    - Use `fc.record({ firstName, lastName, email: fc.emailAddress(), password: fc.string({ minLength: 8 }) })`; assert `201`, matching public fields, no `password` in response
    - **Validates: Requirements 3.1, 4.5**

  - [ ]* 8.9 Write property test — duplicate email rejection (Property 3)
    - **Property 3: Duplicate Email Rejection**
    - Register once with `fc.emailAddress()`; attempt second registration with same email; assert `409`
    - **Validates: Requirements 3.2, 5.5, 6.6, 7.9**

  - [ ]* 8.10 Write property test — email verification round-trip (Property 4)
    - **Property 4: Email Verification Round-Trip**
    - Register user, submit correct token → assert `isEmailVerified: true`; submit same token again → assert `400`
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 8.11 Write property test — login produces valid tokens (Property 5)
    - **Property 5: Login Produces Valid Tokens**
    - For any registered verified user, submit correct credentials; assert `200`, non-empty `accessToken` and `refreshToken`
    - **Validates: Requirements 3.5, 3.14**

  - [ ]* 8.12 Write property test — invalid credentials rejection (Property 6)
    - **Property 6: Invalid Credentials Rejection**
    - Use `fc.string()` for wrong passwords; assert `401` for wrong password and for unregistered email
    - **Validates: Requirements 3.6**

  - [ ]* 8.13 Write property test — refresh token invalidation after logout (Property 7)
    - **Property 7: Refresh Token Invalidation After Logout**
    - Login → logout → attempt refresh with same token; assert non-`200` response
    - **Validates: Requirements 3.7**

  - [ ]* 8.14 Write property test — password reset round-trip (Property 8)
    - **Property 8: Password Reset Round-Trip**
    - Request reset → reset with new password → login with new password succeeds; login with old password fails
    - **Validates: Requirements 3.10**

  - [ ]* 8.15 Write property test — invalid token rejection (Property 9)
    - **Property 9: Invalid Token Rejection**
    - Use `fc.string()` for random tokens; assert `400` for both verify-email and reset-password endpoints
    - **Validates: Requirements 3.4, 3.11**

  - [ ] 8.16 Write Auth integration tests (`src/modules/auth/tests/auth.integration.test.ts`)
    - Cover: register, login, logout, verify-email, forgot-password, reset-password, refresh-token (happy paths and error cases)
    - _Requirements: 17.3_

- [ ] 9. User management module
  - [ ] 9.1 Implement Users repository, service, Zod schemas, controller, and routes
    - Repository: `findAll(params)`, `findById`, `create`, `update`, `delete`; support `search` filter (case-insensitive on `firstName`, `lastName`, `email`)
    - Service: `getAll` (paginated), `getById` (throws `404` if not found), `create` (hash password), `update`, `delete`
    - Zod schemas: `createUserSchema`, `updateUserSchema`, `userQuerySchema` (extends pagination + search)
    - Controller: one handler per endpoint using `asyncHandler` and `sendSuccess`
    - Routes: apply `authenticate` + `authorise('Admin')` to all routes; apply `validate` middleware; add Swagger JSDoc annotations
    - _Requirements: 4.1–4.9, 13.1, 15.1–15.5, 16.2_

  - [ ]* 9.2 Write property test — CRUD round-trip for Users (Property 15)
    - **Property 15: CRUD Round-Trip Consistency**
    - Create user via POST; GET by returned id; assert response fields match creation payload (excluding server-generated fields)
    - **Validates: Requirements 4.3, 4.5, 4.6**

  - [ ]* 9.3 Write property test — delete then not-found for Users (Property 16)
    - **Property 16: Delete Then Not-Found**
    - Create user, delete it, GET by same id; assert `404`
    - **Validates: Requirements 4.7**

  - [ ]* 9.4 Write property test — search filter completeness for Users (Property 11)
    - **Property 11: Search Filter Completeness**
    - Use `fc.string()` for search terms; assert every item in `data` contains the term in `firstName`, `lastName`, or `email`
    - **Validates: Requirements 4.2**

  - [ ] 9.5 Write Users integration tests (`src/modules/users/tests/users.integration.test.ts`)
    - Cover: list with pagination, search, get by ID (found/not found), create, update, delete, `401`/`403` enforcement
    - _Requirements: 17.4_

- [ ] 10. Role management module
  - [ ] 10.1 Implement Roles repository, service, Zod schemas, controller, and routes
    - Repository: `findAll`, `findById`, `findByName`, `create`, `update`, `delete`; check user count before delete
    - Service: `getAll`, `getById`, `create` (conflict on duplicate name → `409`), `update`, `delete` (conflict if users assigned → `409`)
    - Zod schemas: `createRoleSchema`, `updateRoleSchema`
    - Routes: apply `authenticate` + `authorise('Admin')`; add Swagger JSDoc annotations
    - _Requirements: 5.1–5.8, 13.1, 15.1–15.5, 16.2_

  - [ ]* 10.2 Write property test — CRUD round-trip for Roles (Property 15)
    - **Property 15: CRUD Round-Trip Consistency**
    - Create role via POST; GET by returned id; assert fields match
    - **Validates: Requirements 5.2, 5.4**

  - [ ]* 10.3 Write property test — referential integrity conflict on delete for Roles (Property 17)
    - **Property 17: Referential Integrity Conflict on Delete**
    - Create role, assign to a user, attempt DELETE; assert `409` and role still exists
    - **Validates: Requirements 5.8**

  - [ ] 10.4 Write Roles integration tests (`src/modules/roles/tests/roles.integration.test.ts`)
    - Cover: list, get by ID, create, duplicate name conflict, update, delete, delete-with-users conflict
    - _Requirements: 17.4_

- [ ] 11. Department management module
  - [ ] 11.1 Implement Departments repository, service, Zod schemas, controller, and routes
    - Repository: `findAll(params)`, `findById`, `create`, `update`, `delete`; support `search` on `name` and `description`; check resource count before delete
    - Service: `getAll` (paginated), `getById`, `create` (conflict on duplicate name), `update`, `delete` (conflict if resources exist → `409`)
    - Zod schemas: `createDepartmentSchema`, `updateDepartmentSchema`, `departmentQuerySchema`
    - Routes: GET endpoints require `authenticate`; write endpoints require `authenticate` + `authorise('Admin')`; add Swagger JSDoc annotations
    - _Requirements: 6.1–6.9, 13.1, 15.1–15.5, 16.2_

  - [ ]* 11.2 Write property test — CRUD round-trip for Departments (Property 15)
    - **Property 15: CRUD Round-Trip Consistency**
    - Create department via POST; GET by returned id; assert fields match
    - **Validates: Requirements 6.3, 6.5**

  - [ ]* 11.3 Write property test — referential integrity conflict on delete for Departments (Property 17)
    - **Property 17: Referential Integrity Conflict on Delete**
    - Create department with a resource, attempt DELETE; assert `409` and department still exists
    - **Validates: Requirements 6.9**

  - [ ]* 11.4 Write property test — search filter completeness for Departments (Property 11)
    - **Property 11: Search Filter Completeness**
    - Use `fc.string()` for search terms; assert every item in `data` contains the term in `name` or `description`
    - **Validates: Requirements 6.2**

  - [ ] 11.5 Write Departments integration tests (`src/modules/departments/tests/departments.integration.test.ts`)
    - Cover: list, search, create, update, delete, delete-with-resources conflict
    - _Requirements: 17.5_

- [ ] 12. Resource management module
  - [ ] 12.1 Implement Resources repository, service, Zod schemas, controller, and routes
    - Repository: `findAll(params)`, `findById`, `create`, `update`, `delete`; support `search` on `name`, `code`, `description`; filter by `departmentId` and `status`; sort by `name`, `code`, or `createdAt`; check transaction count before delete; include department name in results
    - Service: `getAll` (paginated), `getById`, `create` (conflict on duplicate code → `409`; 404 if departmentId not found), `update`, `delete` (conflict if transactions exist → `409`)
    - Zod schemas: `createResourceSchema`, `updateResourceSchema`, `resourceQuerySchema` (extends pagination + search + departmentId + status + sortBy + sortOrder)
    - Routes: GET endpoints require `authenticate`; write endpoints require `authenticate` + `authorise('Admin')`; add Swagger JSDoc annotations
    - _Requirements: 7.1–7.13, 13.1, 15.1–15.5, 16.2_

  - [ ]* 12.2 Write property test — CRUD round-trip for Resources (Property 15)
    - **Property 15: CRUD Round-Trip Consistency**
    - Create resource via POST; GET by returned id; assert fields match including department name
    - **Validates: Requirements 7.6, 7.8**

  - [ ]* 12.3 Write property test — field filter exactness for Resources (Property 12)
    - **Property 12: Field Filter Exactness**
    - Filter by `departmentId` and `status`; assert every item in `data` has exactly matching field values
    - **Validates: Requirements 7.3, 7.4**

  - [ ]* 12.4 Write property test — sort order correctness for Resources (Property 13)
    - **Property 13: Sort Order Correctness**
    - Use `fc.constantFrom('asc', 'desc')` and `fc.constantFrom('name', 'code', 'createdAt')`; assert adjacent pairs satisfy sort order
    - **Validates: Requirements 7.5**

  - [ ]* 12.5 Write property test — referential integrity conflict on delete for Resources (Property 17)
    - **Property 17: Referential Integrity Conflict on Delete**
    - Create resource with a transaction, attempt DELETE; assert `409` and resource still exists
    - **Validates: Requirements 7.13**

  - [ ] 12.6 Write Resources integration tests (`src/modules/resources/tests/resources.integration.test.ts`)
    - Cover: list with pagination, filter by department/status, sort, create, update, delete, delete-with-transactions conflict
    - _Requirements: 17.6_

- [ ] 13. Transaction management module
  - [ ] 13.1 Implement Transactions repository, service, Zod schemas, controller, and routes
    - Repository: `findAll(params)`, `findById`, `create`, `update`, `delete`; filter by `userId`, `resourceId`, `status`; include user name and resource name in results; validate `userId` and `resourceId` existence before create
    - Service: `getAll` (paginated), `getById`, `create` (status defaults to `Pending`; 404 if userId/resourceId not found), `update` (enforce valid status transitions: `Pending→Active`, `Active→Completed`, `Active→Cancelled`; return `400` for invalid transitions), `delete`
    - Zod schemas: `createTransactionSchema`, `updateTransactionSchema`, `transactionQuerySchema`
    - Routes: GET endpoints require `authenticate`; POST/PUT require `authenticate` + `authorise('Admin', 'Staff')`; DELETE requires `authenticate` + `authorise('Admin')`; add Swagger JSDoc annotations
    - _Requirements: 8.1–8.11, 13.1, 15.1–15.5, 16.2_

  - [ ]* 13.2 Write property test — valid status transitions (Property 14)
    - **Property 14: Valid Transaction Status Transitions**
    - Use `fc.constantFrom` for all status pairs; assert `200` for valid transitions and `400` for invalid ones (including terminal states and same-status updates)
    - **Validates: Requirements 8.10**

  - [ ]* 13.3 Write property test — field filter exactness for Transactions (Property 12)
    - **Property 12: Field Filter Exactness**
    - Filter by `userId`, `resourceId`, `status`; assert every item in `data` has exactly matching field values
    - **Validates: Requirements 8.2, 8.3, 8.4**

  - [ ]* 13.4 Write property test — CRUD round-trip for Transactions (Property 15)
    - **Property 15: CRUD Round-Trip Consistency**
    - Create transaction via POST; GET by returned id; assert fields match
    - **Validates: Requirements 8.5, 8.7**

  - [ ]* 13.5 Write property test — delete then not-found for Transactions (Property 16)
    - **Property 16: Delete Then Not-Found**
    - Create transaction, delete it, GET by same id; assert `404`
    - **Validates: Requirements 8.11**

  - [ ] 13.6 Write Transactions integration tests (`src/modules/transactions/tests/transactions.integration.test.ts`)
    - Cover: list with filter by user/resource/status, create, update status (valid/invalid transitions), delete
    - _Requirements: 17.7_

- [ ] 14. Notification module
  - [ ] 14.1 Implement HTML email templates
    - Create template strings (or files) for: Welcome Email, Password Reset Email, Account Verified Email, Transaction Created Email, Transaction Status Update Email
    - Each template uses `{{placeholder}}` syntax for dynamic values (e.g., `{{firstName}}`, `{{resetLink}}`, `{{transactionId}}`, `{{resourceName}}`, `{{status}}`)
    - Implement a `renderTemplate(template, data)` helper that replaces all placeholders with resolved values
    - _Requirements: 9.6_

  - [ ] 14.2 Implement Notification service (`src/modules/notifications/service/notification.service.ts`)
    - Initialise Brevo SDK with `BREVO_API_KEY`
    - Implement `sendWelcomeEmail`, `sendVerificationSuccessEmail`, `sendPasswordResetEmail`, `sendTransactionCreatedEmail`, `sendTransactionStatusUpdateEmail`
    - Each method: render template → call Brevo SDK → persist `Notification` record → on Brevo error: log (recipient + type), do NOT rethrow
    - _Requirements: 9.1–9.8_

  - [ ]* 14.3 Write property test — email template placeholder substitution (Property 24)
    - **Property 24: Email Template Placeholder Substitution**
    - Use `fc.record` to generate data objects; assert rendered HTML contains resolved values and no unresolved `{{...}}` tokens
    - **Validates: Requirements 9.6**

  - [ ]* 14.4 Write property test — notification record persistence (Property 23)
    - **Property 23: Notification Record Persistence**
    - Trigger each email-sending event; assert a `Notification` record exists in DB with correct `type`, `subject`, `body`, `userId` regardless of Brevo API outcome
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.8**

- [ ] 15. Reports module
  - [ ] 15.1 Implement Reports service, controller, and routes
    - Service methods: `getUserReport()` → `{ totalUsers, byRole, recentUsers (≤10) }`, `getResourceReport()` → `{ totalResources, byStatus, byDepartment, recentResources (≤10) }`, `getTransactionReport()` → `{ totalTransactions, byStatus, recentTransactions (≤10) }`, `getDepartmentReport()` → `{ totalDepartments, resourceCountPerDepartment }`
    - Routes: all four endpoints require `authenticate` + `authorise('Admin')`; add Swagger JSDoc annotations
    - _Requirements: 10.1–10.5, 15.1–15.5, 16.2_

  - [ ]* 15.2 Write property test — report totals consistency (Property 25)
    - **Property 25: Report Totals Consistency**
    - For various DB states, assert `total` counts in report responses equal actual `prisma.model.count()` at time of request
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

  - [ ] 15.3 Write Reports integration tests (`src/modules/reports/tests/reports.integration.test.ts`)
    - Cover: all four report endpoints, `403` for non-Admin
    - _Requirements: 17.4_

- [ ] 16. Dashboard module
  - [ ] 16.1 Implement Dashboard service, controller, and routes
    - Service method: `getSummary()` → `{ totalUsers, totalResources, totalTransactions, totalDepartments, recentTransactions (last 5), recentUsers (last 5), departmentStats }`
    - Route: `GET /api/v1/dashboard` requires `authenticate` + `authorise('Admin')`; add Swagger JSDoc annotation
    - _Requirements: 11.1, 11.2, 15.1–15.5, 16.2_

  - [ ]* 16.2 Write property test — dashboard totals consistency (Property 25)
    - **Property 25: Report Totals Consistency**
    - Assert dashboard `totalUsers`, `totalResources`, `totalTransactions`, `totalDepartments` equal actual DB counts
    - **Validates: Requirements 11.1**

  - [ ] 16.3 Write Dashboard integration tests (`src/modules/dashboard/tests/dashboard.integration.test.ts`)
    - Cover: summary endpoint, `403` for non-Admin
    - _Requirements: 17.4_

- [ ] 17. Route registration
  - [ ] 17.1 Implement `src/routes/index.ts` — central route registry
    - Import and mount all module routers under `/api/v1`: `/auth`, `/users`, `/roles`, `/departments`, `/resources`, `/transactions`, `/reports`, `/dashboard`
    - _Requirements: 12.1_

- [ ] 18. Checkpoint — all modules wired
  - Ensure `npm run build` compiles without errors.
  - Ensure all integration tests pass against the test database.
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Test helpers and test database setup
  - [ ] 19.1 Implement `src/utils/testHelpers.ts`
    - Export `setupTestDb` and `teardownTestDb` wrapping tests in a transaction that is rolled back after each test
    - Export helper factories for creating test users, roles, departments, resources, and transactions with minimal required fields
    - _Requirements: 17.1, 17.2_

  - [ ] 19.2 Write `src/utils/testHelpers.ts` test database configuration
    - Configure Jest `globalSetup` / `globalTeardown` to connect/disconnect Prisma against `TEST_DATABASE_URL`
    - _Requirements: 17.1_

- [ ] 20. Documentation artifacts
  - [ ] 20.1 Write `src/docs/er-diagram.md`
    - Embed the Mermaid `erDiagram` block from the design document showing all 7 models and their relationships
    - _Requirements: 18.4_

  - [ ] 20.2 Write implementation roadmap document (`docs/implementation-roadmap.md`)
    - Describe the recommended order for adapting the starter kit into a specific domain system (rename entities, extend schema, add domain-specific business rules, customise email templates, update seed data)
    - _Requirements: 18.5_

  - [ ] 20.3 Write `README.md`
    - Sections: project overview, prerequisites, setup steps (clone → install → env → migrate → seed → run), environment variables table, available npm scripts, folder structure, API overview, Docker usage
    - _Requirements: 1.8_

  - [ ] 20.4 Write Postman Collection JSON (`docs/postman-collection.json`)
    - Document all API endpoints with example request bodies, headers (including `Authorization: Bearer {{token}}`), and expected responses
    - Organise into folders: Auth, Users, Roles, Departments, Resources, Transactions, Reports, Dashboard
    - _Requirements: 18.3_

- [ ] 21. Final checkpoint — full suite
  - Run `npm run test` and confirm all test suites pass with coverage summary output.
  - Run `npm run lint` and confirm no ESLint errors.
  - Run `npm run build` and confirm TypeScript compiles without errors.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP delivery
- Each task references specific requirements for full traceability
- Checkpoints at tasks 7, 18, and 21 ensure incremental validation at key milestones
- Property tests use `fast-check` with `numRuns: 100` minimum per property
- Each property test includes the comment: `// Feature: institution-management-starter-kit, Property N: <property_text>`
- Integration tests use a dedicated `TEST_DATABASE_URL` with transaction rollback for isolation
- The notification service is always fire-and-forget — Brevo errors must never disrupt the primary request flow
- All 26 correctness properties from the design document are covered by property-based test sub-tasks

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["3.1", "4.1", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 3, "tasks": ["3.2", "5.1", "5.2", "5.3", "5.4"] },
    { "id": 4, "tasks": ["3.3", "6.1", "6.2", "6.3"] },
    { "id": 5, "tasks": ["3.4", "4.6", "5.5", "5.6", "5.7", "5.8", "5.9", "17.1"] },
    { "id": 6, "tasks": ["8.1", "19.1", "19.2"] },
    { "id": 7, "tasks": ["8.2", "8.3"] },
    { "id": 8, "tasks": ["8.4", "8.5"] },
    { "id": 9, "tasks": ["8.6", "8.7", "8.8", "8.9", "8.10", "8.11", "8.12", "8.13", "8.14", "8.15", "8.16"] },
    { "id": 10, "tasks": ["9.1", "10.1", "11.1", "14.1"] },
    { "id": 11, "tasks": ["9.2", "9.3", "9.4", "9.5", "10.2", "10.3", "10.4", "11.2", "11.3", "11.4", "11.5", "14.2"] },
    { "id": 12, "tasks": ["12.1", "13.1"] },
    { "id": 13, "tasks": ["12.2", "12.3", "12.4", "12.5", "12.6", "13.2", "13.3", "13.4", "13.5", "13.6", "14.3", "14.4"] },
    { "id": 14, "tasks": ["15.1", "16.1"] },
    { "id": 15, "tasks": ["15.2", "15.3", "16.2", "16.3"] },
    { "id": 16, "tasks": ["20.1", "20.2", "20.3", "20.4"] }
  ]
}
```

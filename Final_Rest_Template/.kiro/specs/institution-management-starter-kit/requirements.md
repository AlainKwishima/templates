# Requirements Document

## Introduction

The Institution Management Starter Kit is a generic, reusable REST API backend built with Node.js, TypeScript, Express.js, PostgreSQL, and Prisma ORM. It provides a clean, modular foundation that can be rapidly adapted into domain-specific management systems such as a School Management System, Library Management System, Student Registration System, Course Management System, Inventory Management System, Asset Management System, or Examination Management System.

The kit emphasises clean architecture, feature-based modularity, code quality, maintainability, and exam/assessment readiness. It ships with JWT authentication, Brevo email integration, Swagger API documentation, Zod validation, Jest + Supertest testing, ESLint, Prettier, Nodemon, Docker, and seed data.

---

## Glossary

- **System**: The Institution Management Starter Kit API server.
- **Client**: Any HTTP consumer of the API (browser, mobile app, Postman, etc.).
- **User**: A registered account in the system with an assigned Role.
- **Role**: A named permission group (e.g., Admin, Staff, User, Teacher, Student, Librarian).
- **Department**: A generic grouping entity representing Classes, Faculties, Categories, Sections, or Product Categories.
- **Resource**: A generic domain entity representing a Subject, Course, Book, Product, Equipment, or similar item.
- **Transaction**: A generic activity record linking a User to a Resource (e.g., Enrollment, Borrowing, Stock Movement, Assignment).
- **Notification**: An outbound email message sent via the Brevo Email Service.
- **JWT**: JSON Web Token used for stateless authentication.
- **Access_Token**: A short-lived JWT issued on successful login.
- **Refresh_Token**: A longer-lived token used to obtain a new Access_Token without re-authentication.
- **Prisma**: The ORM used to interact with the PostgreSQL database.
- **Zod**: The schema validation library used to validate request payloads.
- **Brevo**: The third-party transactional email service.
- **Swagger**: The OpenAPI documentation UI served at `/api-docs`.
- **Seeder**: A script that populates the database with initial/demo data.
- **DTO**: Data Transfer Object — a typed shape for request or response payloads.
- **Repository**: The data-access layer that wraps Prisma queries.
- **Service**: The business-logic layer that orchestrates Repository calls.
- **Controller**: The HTTP handler layer that parses requests and delegates to Services.
- **Middleware**: Express middleware functions (auth guard, validation, error handler, etc.).
- **Global_Error_Handler**: The centralised Express error-handling middleware.
- **Pagination**: Splitting large result sets into pages using `page` and `limit` query parameters.
- **Status**: The lifecycle state of a Transaction: `Pending`, `Active`, `Completed`, or `Cancelled`.

---

## Requirements

---

### Requirement 1: Project Bootstrapping and Configuration

**User Story:** As a developer, I want a fully configured project scaffold, so that I can start building domain-specific features without spending time on boilerplate setup.

#### Acceptance Criteria

1. THE System SHALL expose a `src/` directory organised into `config/`, `modules/`, `middleware/`, `utils/`, `shared/`, `database/`, `docs/`, `routes/`, `app.ts`, and `server.ts`.
2. THE System SHALL include a `tsconfig.json` configured for strict TypeScript compilation targeting Node.js.
3. THE System SHALL include an `.env.example` file listing every required environment variable with placeholder values and inline comments.
4. WHEN the application starts, THE System SHALL validate all required environment variables and exit with a descriptive error message if any are missing or invalid.
5. THE System SHALL include ESLint and Prettier configuration files so that running `npm run lint` and `npm run format` enforces consistent code style.
6. THE System SHALL include a `nodemon.json` or equivalent configuration so that running `npm run dev` restarts the server on TypeScript source changes.
7. THE System SHALL include a `Dockerfile` and `docker-compose.yml` that start the API server and a PostgreSQL instance with a single `docker-compose up` command.
8. THE System SHALL include a `README.md` describing setup steps, environment variables, available npm scripts, and folder structure.

---

### Requirement 2: Database Schema and Prisma Setup

**User Story:** As a developer, I want a complete Prisma schema with all entities, relationships, and indexes, so that I can run migrations and have a production-ready database structure immediately.

#### Acceptance Criteria

1. THE System SHALL define a Prisma schema containing models: `User`, `Role`, `Department`, `Resource`, `Transaction`, and `Notification`.
2. THE `User` model SHALL contain fields: `id` (UUID), `firstName`, `lastName`, `email` (unique), `password`, `roleId` (FK → Role), `isEmailVerified` (boolean, default false), `emailVerificationToken` (nullable), `passwordResetToken` (nullable), `passwordResetExpiry` (nullable), `createdAt`, `updatedAt`.
3. THE `Role` model SHALL contain fields: `id` (UUID), `name` (unique), `description` (nullable), `createdAt`, `updatedAt`.
4. THE `Department` model SHALL contain fields: `id` (UUID), `name` (unique), `description` (nullable), `createdAt`, `updatedAt`.
5. THE `Resource` model SHALL contain fields: `id` (UUID), `name`, `code` (unique), `description` (nullable), `status` (enum: `Active`, `Inactive`), `departmentId` (FK → Department), `createdAt`, `updatedAt`.
6. THE `Transaction` model SHALL contain fields: `id` (UUID), `userId` (FK → User), `resourceId` (FK → Resource), `transactionDate`, `returnDate` (nullable), `status` (enum: `Pending`, `Active`, `Completed`, `Cancelled`), `notes` (nullable), `createdAt`, `updatedAt`.
7. THE `Notification` model SHALL contain fields: `id` (UUID), `userId` (FK → User), `type` (string), `subject`, `body`, `sentAt` (nullable), `createdAt`.
8. THE System SHALL define database indexes on `User.email`, `Resource.code`, `Resource.departmentId`, `Transaction.userId`, `Transaction.resourceId`, and `Transaction.status`.
9. THE System SHALL include a Seeder script that inserts at least three Roles (`Admin`, `Staff`, `User`), two Departments, four Resources, one admin User, and two sample Transactions.
10. WHEN `npm run db:seed` is executed, THE System SHALL check for existing data and skip seeding for any model that already meets the minimum record count, then log the number of records inserted (or skipped) per model.

---

### Requirement 3: Authentication Module

**User Story:** As a user, I want to register, verify my email, log in, log out, and reset my password, so that I can securely access the system.

#### Acceptance Criteria

1. WHEN a Client sends a `POST /api/v1/auth/register` request with valid `firstName`, `lastName`, `email`, and `password` fields, THE System SHALL create a new User record, assign the default `User` Role, send a verification email via Brevo, and return a `201` response with the created User's public fields.
2. IF a Client sends a `POST /api/v1/auth/register` request with an email that already exists, THEN THE System SHALL return a `409` response with a descriptive error message.
3. WHEN a Client sends a `POST /api/v1/auth/verify-email` request with a valid `token`, THE System SHALL mark the User's `isEmailVerified` field as `true`, clear the `emailVerificationToken`, and return a `200` response.
4. IF a Client sends a `POST /api/v1/auth/verify-email` request with an expired or invalid `token`, THEN THE System SHALL return a `400` response with a descriptive error message.
5. WHEN a Client sends a `POST /api/v1/auth/login` request with valid `email` and `password` credentials, THE System SHALL return a `200` response containing an `accessToken` and a `refreshToken`.
6. IF a Client sends a `POST /api/v1/auth/login` request with invalid credentials, THEN THE System SHALL return a `401` response with a descriptive error message.
7. WHEN a Client sends a `POST /api/v1/auth/logout` request with a valid `refreshToken`, THE System SHALL invalidate the token and return a `200` response.
8. WHEN a Client sends a `POST /api/v1/auth/forgot-password` request with a registered `email`, THE System SHALL generate a password-reset token, store its hash and expiry on the User record, send a reset email via Brevo, and return a `200` response.
9. IF a Client sends a `POST /api/v1/auth/forgot-password` request with an unregistered email, THEN THE System SHALL return a `200` response without revealing whether the email exists.
10. WHEN a Client sends a `POST /api/v1/auth/reset-password` request with a valid `token` and a new `password`, THE System SHALL update the User's hashed password, clear the reset token fields, and return a `200` response.
11. IF a Client sends a `POST /api/v1/auth/reset-password` request with an expired or invalid `token`, THEN THE System SHALL return a `400` response with a descriptive error message.
12. WHEN a Client sends a `POST /api/v1/auth/refresh-token` request with a valid `refreshToken`, THE System SHALL return a new `accessToken` and a `200` response.
13. THE System SHALL hash all passwords using bcrypt with a minimum cost factor of 10 before persisting them.
14. THE System SHALL sign Access_Tokens with a configurable expiry (default 15 minutes) and Refresh_Tokens with a configurable expiry (default 7 days).

---

### Requirement 4: User Management Module

**User Story:** As an Admin, I want to create, read, update, delete, and search Users, so that I can manage all accounts in the system.

#### Acceptance Criteria

1. WHEN an authenticated Admin sends a `GET /api/v1/users` request, THE System SHALL return a paginated list of Users with `page`, `limit`, `total`, and `data` fields.
2. WHEN an authenticated Admin sends a `GET /api/v1/users` request with a `search` query parameter, THE System SHALL return a `200` response containing only Users whose `firstName`, `lastName`, or `email` contains the search term (case-insensitive).
3. WHEN an authenticated Admin sends a `GET /api/v1/users/:id` request with a valid User ID, THE System SHALL return the User's public fields excluding `password`.
4. IF an authenticated Admin sends a `GET /api/v1/users/:id` request with a non-existent ID, THEN THE System SHALL return a `404` response.
5. WHEN an authenticated Admin sends a `POST /api/v1/users` request with valid fields, THE System SHALL create a new User, hash the password, and return a `201` response with the created User's public fields.
6. WHEN an authenticated Admin sends a `PUT /api/v1/users/:id` request with valid fields, THE System SHALL update the User record and return a `200` response with the updated User's public fields.
7. WHEN an authenticated Admin sends a `DELETE /api/v1/users/:id` request with a valid User ID, THE System SHALL soft-delete or permanently delete the User and return a `200` response.
8. WHILE a request is not accompanied by a valid Access_Token, THE System SHALL return a `401` response for all `/api/v1/users` endpoints.
9. WHILE a request is accompanied by a valid Access_Token belonging to a non-Admin Role, THE System SHALL return a `403` response for all `/api/v1/users` endpoints.

---

### Requirement 5: Role Management Module

**User Story:** As an Admin, I want to create, read, update, delete, and list Roles, so that I can define permission groups for Users.

#### Acceptance Criteria

1. WHEN an authenticated Admin sends a `GET /api/v1/roles` request, THE System SHALL return a `200` response with a list of all Roles.
2. WHEN an authenticated Admin sends a `GET /api/v1/roles/:id` request with a valid Role ID, THE System SHALL return a `200` response with the Role's fields.
3. IF an authenticated Admin sends a `GET /api/v1/roles/:id` request with a non-existent ID, THEN THE System SHALL return a `404` response.
4. WHEN an authenticated Admin sends a `POST /api/v1/roles` request with a unique `name`, THE System SHALL create the Role and return a `201` response.
5. IF an authenticated Admin sends a `POST /api/v1/roles` request with a `name` that already exists, THEN THE System SHALL return a `409` response.
6. IF an authenticated Admin sends a `PUT /api/v1/roles/:id` request for a Role that does not exist, THEN THE System SHALL return a `404` response. WHEN an authenticated Admin sends a `PUT /api/v1/roles/:id` request with valid fields for an existing Role, THE System SHALL update the Role and return a `200` response.
7. WHEN an authenticated Admin sends a `DELETE /api/v1/roles/:id` request, THE System SHALL delete the Role and return a `200` response.
8. IF an authenticated Admin sends a `DELETE /api/v1/roles/:id` request for a Role that is assigned to one or more Users, THEN THE System SHALL return a `409` response with a descriptive error message.

---

### Requirement 6: Department Management Module

**User Story:** As an Admin or Staff member, I want to create, read, update, delete, and search Departments, so that I can organise Resources into logical groups.

#### Acceptance Criteria

1. WHEN an authenticated User sends a `GET /api/v1/departments` request, THE System SHALL return a `200` response with a paginated list of Departments.
2. WHEN an authenticated User sends a `GET /api/v1/departments` request with a `search` query parameter, THE System SHALL return a `200` response containing only Departments whose `name` or `description` contains the search term (case-insensitive), or an empty `data` array if no Departments match.
3. WHEN an authenticated User sends a `GET /api/v1/departments/:id` request with a valid Department ID, THE System SHALL return the Department's fields.
4. IF an authenticated User sends a `GET /api/v1/departments/:id` request with a non-existent ID, THEN THE System SHALL return a `404` response.
5. WHEN an authenticated Admin sends a `POST /api/v1/departments` request with a unique `name`, THE System SHALL create the Department and return a `201` response.
6. IF an authenticated Admin sends a `POST /api/v1/departments` request with a `name` that already exists, THEN THE System SHALL return a `409` response.
7. WHEN an authenticated Admin sends a `PUT /api/v1/departments/:id` request with valid fields, THE System SHALL update the Department and return a `200` response.
8. WHEN an authenticated Admin sends a `DELETE /api/v1/departments/:id` request, THE System SHALL delete the Department and return a `200` response.
9. IF an authenticated Admin sends a `DELETE /api/v1/departments/:id` request for a Department that has one or more associated Resources, THEN THE System SHALL return a `409` response with a descriptive error message.

---

### Requirement 7: Resource Management Module

**User Story:** As an Admin or Staff member, I want full CRUD with search, pagination, filtering, and sorting on Resources, so that I can manage the domain entities of the system.

#### Acceptance Criteria

1. WHEN an authenticated User sends a `GET /api/v1/resources` request, THE System SHALL return a paginated list of Resources including the associated Department name.
2. WHEN an authenticated User sends a `GET /api/v1/resources` request with a `search` query parameter, THE System SHALL return only Resources whose `name`, `code`, or `description` contains the search term (case-insensitive).
3. WHEN an authenticated User sends a `GET /api/v1/resources` request with a `departmentId` query parameter, THE System SHALL return only Resources belonging to that Department.
4. WHEN an authenticated User sends a `GET /api/v1/resources` request with a `status` query parameter of `Active` or `Inactive`, THE System SHALL return only Resources matching that status.
5. WHEN an authenticated User sends a `GET /api/v1/resources` request with `sortBy` and `sortOrder` query parameters, THE System SHALL return Resources sorted by the specified field in the specified direction (`asc` or `desc`).
6. WHEN an authenticated User sends a `GET /api/v1/resources/:id` request with a valid Resource ID, THE System SHALL return the Resource's fields including the associated Department name.
7. IF an authenticated User sends a `GET /api/v1/resources/:id` request with a non-existent ID, THEN THE System SHALL return a `404` response.
8. WHEN an authenticated Admin sends a `POST /api/v1/resources` request with valid fields including a unique `code` and a valid `departmentId`, THE System SHALL create the Resource and return a `201` response.
9. IF an authenticated Admin sends a `POST /api/v1/resources` request with a `code` that already exists, THEN THE System SHALL return a `409` response.
10. IF an authenticated Admin sends a `POST /api/v1/resources` request with a non-existent `departmentId`, THEN THE System SHALL return a `404` response.
11. WHEN an authenticated Admin sends a `PUT /api/v1/resources/:id` request with valid fields, THE System SHALL update the Resource and return a `200` response.
12. WHEN an authenticated Admin sends a `DELETE /api/v1/resources/:id` request, THE System SHALL delete the Resource and return a `200` response.
13. IF an authenticated Admin sends a `DELETE /api/v1/resources/:id` request for a Resource that has one or more associated Transactions, THEN THE System SHALL return a `409` response with a descriptive error message.

---

### Requirement 8: Transaction Management Module

**User Story:** As an Admin or Staff member, I want to create, read, update, delete, and search Transactions, so that I can track all activities linking Users to Resources.

#### Acceptance Criteria

1. WHEN an authenticated User sends a `GET /api/v1/transactions` request, THE System SHALL return a paginated list of Transactions including the associated User's name and the associated Resource's name.
2. WHEN an authenticated User sends a `GET /api/v1/transactions` request with a `userId` query parameter, THE System SHALL return only Transactions belonging to that User.
3. WHEN an authenticated User sends a `GET /api/v1/transactions` request with a `resourceId` query parameter, THE System SHALL return only Transactions for that Resource.
4. WHEN an authenticated User sends a `GET /api/v1/transactions` request with a `status` query parameter, THE System SHALL return only Transactions matching that status (`Pending`, `Active`, `Completed`, or `Cancelled`).
5. WHEN an authenticated User sends a `GET /api/v1/transactions/:id` request with a valid Transaction ID, THE System SHALL return the Transaction's fields including the associated User's name and Resource's name.
6. IF an authenticated User sends a `GET /api/v1/transactions/:id` request with a non-existent ID, THEN THE System SHALL return a `404` response.
7. WHEN an authenticated Admin or Staff sends a `POST /api/v1/transactions` request with valid `userId`, `resourceId`, `transactionDate`, and `status` fields, THE System SHALL create the Transaction with status `Pending` and return a `201` response. WHILE a request is accompanied by a valid Access_Token belonging to a non-Admin and non-Staff Role, THE System SHALL return a `403` response for `POST /api/v1/transactions`.
8. IF an authenticated Admin or Staff sends a `POST /api/v1/transactions` request with a non-existent `userId` or `resourceId`, THEN THE System SHALL return a `404` response with a descriptive error message.
9. WHEN an authenticated Admin or Staff sends a `PUT /api/v1/transactions/:id` request with valid fields, THE System SHALL update the Transaction and return a `200` response.
10. WHEN an authenticated Admin or Staff sends a `PUT /api/v1/transactions/:id` request updating the `status` field, THE System SHALL accept only valid status transitions and return a `400` response for invalid transitions.
11. WHEN an authenticated Admin sends a `DELETE /api/v1/transactions/:id` request, THE System SHALL delete the Transaction and return a `200` response.

---

### Requirement 9: Notification Module (Email)

**User Story:** As a system operator, I want the system to send transactional emails via Brevo, so that users receive timely notifications about account events and transactions.

#### Acceptance Criteria

1. WHEN a new User registers, THE System SHALL send a Welcome Email to the User's email address containing the User's first name and an email verification link.
2. WHEN a User requests a password reset, THE System SHALL send a Password Reset Email containing a reset link valid for 1 hour.
3. WHEN a User's email is successfully verified, THE System SHALL send an Account Verified confirmation email.
4. WHEN a Transaction is created, THE System SHALL send a Transaction Notification email to the associated User containing the Transaction ID, Resource name, and status.
5. WHEN a Transaction status is updated, THE System SHALL send a Transaction Status Update email to the associated User containing the new status.
6. THE System SHALL use HTML email templates with named dynamic placeholders (e.g., `{{firstName}}`, `{{resetLink}}`) for all outbound emails.
7. IF the Brevo API returns an error, THEN THE System SHALL log the error with the recipient address and email type, and SHALL NOT throw an unhandled exception that disrupts the primary request flow.
8. THE System SHALL record each outbound email as a Notification record in the database with `type`, `subject`, `body`, and `sentAt` fields.

---

### Requirement 10: Reports Module

**User Story:** As an Admin, I want REST endpoints that return aggregated statistics, so that I can monitor system activity without writing custom queries.

#### Acceptance Criteria

1. WHEN an authenticated Admin sends a `GET /api/v1/reports/users` request, THE System SHALL return total User count, count by Role, and a list of up to 10 of the most recently created Users (returning fewer if fewer than 10 exist).
2. WHEN an authenticated Admin sends a `GET /api/v1/reports/resources` request, THE System SHALL return total Resource count, count by status, count by Department, and a list of up to 10 of the most recently created Resources (returning fewer if fewer than 10 exist).
3. WHEN an authenticated Admin sends a `GET /api/v1/reports/transactions` request, THE System SHALL return total Transaction count, count by status, and a list of up to 10 of the most recent Transactions (returning fewer if fewer than 10 exist).
4. WHEN an authenticated Admin sends a `GET /api/v1/reports/departments` request, THE System SHALL return total Department count and the Resource count per Department.
5. WHILE a request is not accompanied by a valid Admin Access_Token, THE System SHALL return a `403` response for all `/api/v1/reports` endpoints.

---

### Requirement 11: Dashboard Module

**User Story:** As an Admin, I want a single dashboard endpoint that returns key metrics, so that I can display a summary view in a front-end application.

#### Acceptance Criteria

1. WHEN an authenticated Admin sends a `GET /api/v1/dashboard` request, THE System SHALL return a single JSON object containing: `totalUsers`, `totalResources`, `totalTransactions`, `totalDepartments`, `recentTransactions` (last 5), `recentUsers` (last 5), and `departmentStats` (Resource count per Department).
2. WHILE a request is not accompanied by a valid Admin Access_Token, THE System SHALL return a `403` response for the `/api/v1/dashboard` endpoint.

---

### Requirement 12: API Design and Standard Response Format

**User Story:** As a Client developer, I want all API endpoints to follow a consistent structure and response format, so that I can integrate with the API predictably.

#### Acceptance Criteria

1. THE System SHALL prefix all API routes with `/api/v1`.
2. WHEN a request succeeds, THE System SHALL return a JSON response with the shape `{ "success": true, "message": "...", "data": {} }`.
3. WHEN a request fails, THE System SHALL return a JSON response with the shape `{ "success": false, "message": "...", "errors": [] }`.
4. THE System SHALL return HTTP status codes consistent with REST conventions: `200` for success, `201` for creation, `400` for validation errors, `401` for unauthenticated, `403` for unauthorised, `404` for not found, `409` for conflicts, and `500` for unexpected server errors. THE System SHALL return a non-`2xx` status code for every request that fails for any reason, including business logic errors.
5. WHEN a paginated endpoint is called, THE System SHALL include `page`, `limit`, `total`, and `totalPages` fields alongside the `data` array in the response.

---

### Requirement 13: Validation

**User Story:** As a Client developer, I want all request inputs to be validated with clear error messages, so that I can quickly identify and fix malformed requests.

#### Acceptance Criteria

1. THE System SHALL use Zod schemas to validate all request bodies, route parameters, and query parameters before they reach the Controller layer.
2. IF a request body fails Zod validation, THEN THE System SHALL return a `400` response listing each invalid field and its error message.
3. THE System SHALL define reusable Zod schemas for common patterns such as UUID parameters, pagination query parameters, and email/password fields.
4. THE System SHALL define a reusable validation middleware function that accepts a Zod schema and returns an Express middleware.

---

### Requirement 14: Error Handling

**User Story:** As a developer, I want a centralised error handling strategy, so that all errors are caught, logged, and returned in a consistent format.

#### Acceptance Criteria

1. THE System SHALL define a custom `AppError` class extending `Error` with `statusCode`, `message`, and optional `errors` fields.
2. THE System SHALL register a Global_Error_Handler as the last Express middleware that catches all errors passed via `next(error)`.
3. WHEN the Global_Error_Handler receives an `AppError`, THE System SHALL return the error's `statusCode` and `message` in the standard error response format.
4. WHEN the Global_Error_Handler receives a Prisma `P2002` (unique constraint) error, THE System SHALL return a `409` response with a human-readable message.
5. WHEN the Global_Error_Handler receives a Prisma `P2025` (record not found) error, THE System SHALL return a `404` response with a human-readable message.
6. WHEN the Global_Error_Handler receives any other unhandled error, THE System SHALL attempt to log the full error stack and return a `500` response with a generic message. IF logging fails, THE System SHALL still return the `500` response. WHEN an unhandled error occurs during processing of a request that already has a non-`500` status code set, THE System SHALL preserve the original status code rather than overriding it with `500`.
7. THE System SHALL include a `404` catch-all route handler that returns a `404` response for any unmatched route.

---

### Requirement 15: Authentication Middleware and Route Protection

**User Story:** As a system operator, I want all non-public routes to be protected by JWT authentication and role-based access control, so that only authorised users can access sensitive endpoints.

#### Acceptance Criteria

1. THE System SHALL provide an `authenticate` middleware that extracts the Bearer token from the `Authorization` header, verifies it against the JWT secret, and attaches the decoded User payload to `req.user`.
2. IF the `Authorization` header is absent or the token is invalid or expired, THEN THE System SHALL return a `401` response. THE System SHALL enforce authentication on all protected routes regardless of the order in which middleware is applied.
3. THE System SHALL provide an `authorise(...roles)` middleware factory that checks whether `req.user.role` is included in the allowed roles list.
4. IF `req.user.role` is not in the allowed roles list, THEN THE System SHALL return a `403` response.
5. THE System SHALL apply the `authenticate` middleware to all routes except `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`, and `POST /api/v1/auth/verify-email`.

---

### Requirement 16: Swagger API Documentation

**User Story:** As a developer, I want interactive API documentation available at `/api-docs`, so that I can explore and test all endpoints without a separate tool.

#### Acceptance Criteria

1. THE System SHALL serve a Swagger UI at `/api-docs` using `swagger-ui-express` and `swagger-jsdoc`.
2. THE System SHALL document all endpoints with their HTTP method, path, request body schema, query parameters, response schemas, and required authentication.
3. THE Swagger UI SHALL include a Bearer token authentication scheme so that developers can authorise requests directly from the documentation page.
4. WHEN the application runs in any mode (development or production), THE System SHALL serve the Swagger UI at `/api-docs` unless the `DISABLE_SWAGGER` environment variable is set to `true`. IF the Swagger UI fails to initialise due to a technical issue, THE System SHALL log a warning and continue starting normally without the Swagger UI.

---

### Requirement 17: Testing

**User Story:** As a developer, I want unit and integration tests for all core modules, so that I can verify correctness and prevent regressions.

#### Acceptance Criteria

1. THE System SHALL include Jest as the test runner with `ts-jest` for TypeScript support.
2. THE System SHALL include Supertest for HTTP integration testing against the Express application.
3. THE System SHALL include unit tests for the Authentication Service covering: successful registration, duplicate email rejection, successful login, invalid credentials rejection, password reset flow, and email verification flow.
4. THE System SHALL include integration tests for the Users module covering: list with pagination, search, get by ID (found and not found), create, update, and delete.
5. THE System SHALL include integration tests for the Departments module covering: list, search, create, update, delete, and conflict on delete with associated Resources.
6. THE System SHALL include integration tests for the Resources module covering: list with pagination, filtering by department and status, sorting, create, update, and delete.
7. THE System SHALL include integration tests for the Transactions module covering: list with filtering by user and status, create, update status, and delete.
8. WHEN `npm run test` is executed, THE System SHALL run all test suites and output a coverage summary.
9. THE System SHALL include a `jest.config.ts` or `jest.config.js` that configures coverage collection for the `src/` directory.

---

### Requirement 18: Developer Experience and Tooling

**User Story:** As a developer, I want a complete set of developer tooling scripts and configuration, so that I can be productive from the first `npm install`.

#### Acceptance Criteria

1. THE System SHALL include the following npm scripts: `dev` (nodemon), `build` (tsc), `start` (node dist/server.js), `lint` (eslint), `format` (prettier), `test` (jest), `db:migrate` (prisma migrate dev), `db:generate` (prisma generate), `db:seed` (ts-node seeder), `db:studio` (prisma studio).
2. THE System SHALL include a `.gitignore` file excluding `node_modules/`, `dist/`, `.env`, and Prisma migration lock files.
3. THE System SHALL include a Postman Collection JSON file documenting all API endpoints with example request bodies and headers.
4. THE System SHALL include an ER diagram (as a Mermaid diagram in a Markdown file) illustrating all database models and their relationships.
5. THE System SHALL include an implementation roadmap document describing the recommended order for adapting the starter kit into a specific domain system.

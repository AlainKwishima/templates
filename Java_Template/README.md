# JavaT — Spring Boot Template

A production-ready Spring Boot template with authentication, user management, email notifications, database migrations, and a clean API layer built in. Clone it, configure it, and start building your feature — not the boilerplate.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Spring Boot 3.4.5 |
| Language | Java 22 |
| Security | Spring Security + JWT (jjwt 0.12.6) |
| Database | PostgreSQL |
| ORM | Spring Data JPA + Hibernate |
| Migrations | Flyway |
| Mapping | MapStruct 1.6.3 |
| Validation | Jakarta Bean Validation |
| Email | Brevo transactional API (RestClient) |
| API Docs | SpringDoc OpenAPI (Swagger UI) |
| Utilities | Lombok |

---

## Prerequisites

- Java 22+
- Maven 3.9+
- PostgreSQL 12+

---

## Getting Started

### 1. Clone and create the database

```bash
git clone https://github.com/orestengabo0/JavaT.git
cd JavaT
```

```sql
CREATE DATABASE javat;
```

### 2. Configure credentials

`application.properties` (committed to git) contains only placeholder values. Put your real credentials in `application-local.properties` which is gitignored:

```properties
# src/main/resources/application-local.properties  ← gitignored, never committed

spring.datasource.url=jdbc:postgresql://127.0.0.1:5432/javat
spring.datasource.username=your_postgres_username
spring.datasource.password=your_postgres_password

app.jwt.secret=your-base64-encoded-secret

app.brevo.api-key=your-brevo-api-key
app.mail.from=verified-sender@yourdomain.com
app.mail.from-name=YourAppName
app.mail.api-base-url=http://localhost:8080
app.mail.frontend-base-url=http://localhost:5173
```

Then activate the `local` profile when running:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Or set the environment variable in your IDE run configuration:
```
SPRING_PROFILES_ACTIVE=local
```

> **Generating a JWT secret:**
> ```bash
> openssl rand -base64 32
> ```

### 3. Run

```bash
mvn spring-boot:run
```

Flyway runs automatically on startup and creates all tables. A default admin account is seeded.

### 4. Open Swagger UI

```
http://localhost:8080/swagger-ui.html
```

### 5. Start the frontend (optional)

A React + TypeScript starter kit lives in `frontend/`:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). See `frontend/README.md` for details.

---

## Default Admin Account

Seeded by Flyway migration `V2`. Use this to test admin endpoints immediately.

| Field | Value |
|---|---|
| Email | `admin@javat.com` |
| Password | *(set by your V5 migration hash)* |
| Role | `ADMIN` |

> Change this password before deploying anywhere.

---

## Project Structure

```
src/main/java/com/spring/JavaT/
├── auth/                        # Authentication & authorization
│   ├── dto/                     # Request/response DTOs
│   │   ├── RegisterRequest
│   │   ├── LoginRequest
│   │   ├── AuthResponse
│   │   ├── ForgotPasswordRequest
│   │   ├── ResetPasswordRequest
│   ├── AuthController           # Public auth endpoints
│   ├── AuthService              # Register, login, password reset, email verification
│   ├── AuthMapper               # RegisterRequest → User (MapStruct)
│   ├── PasswordResetToken       # Entity: time-limited password reset tokens
│   ├── PasswordResetTokenRepository
│   ├── EmailVerificationToken   # Entity: time-limited email verification tokens
│   └── EmailVerificationTokenRepository
│
├── user/                        # User management
│   ├── dto/
│   │   ├── UserDto              # Safe read-only projection (no password)
│   │   ├── UpdateProfileRequest
│   │   ├── UpdatePasswordRequest
│   │   └── UpdateRoleRequest
│   ├── User                     # Entity (extends BaseEntity, implements UserDetails)
│   ├── Role                     # Enum: USER, MODERATOR, ADMIN
│   ├── UserRepository           # JpaRepository + JpaSpecificationExecutor
│   ├── UserService              # Profile, password, role, deactivation
│   ├── UserController           # /api/v1/users endpoints
│   └── UserMapper               # User → UserDto (MapStruct)
│
├── common/                      # Shared infrastructure
│   ├── ApiResponse              # Standard response envelope
│   ├── ApiError                 # Single error entry
│   ├── ResponseBuilder          # Static factory for ResponseEntity
│   ├── BaseEntity               # Abstract JPA base with audit fields
│   ├── EntityStatus             # Enum: ACTIVE, INACTIVE, SUSPENDED, PENDING
│   ├── pagination/
│   │   ├── PaginationMeta       # Extracted page metadata
│   │   ├── PageResponse         # Generic paginated response
│   │   └── PaginationUtil       # Defaults, caps, sort validation
│   ├── filter/
│   │   ├── SearchCriteria       # Single filter condition (field, op, value)
│   │   └── BaseSpecification    # Generic JPA Specification builder
│   └── validation/
│       ├── ValidationMessages   # All validation message strings
│       ├── ValidationGroups     # OnCreate, OnUpdate, OnPatch, OnDelete
│       ├── ValidPassword        # Custom: password strength annotation
│       ├── ValidPasswordValidator
│       ├── NoWhitespace         # Custom: no leading/trailing spaces
│       ├── NoWhitespaceValidator
│       ├── ValidEnum            # Custom: string must match enum constant
│       └── ValidEnumValidator
│
├── security/                    # Spring Security wiring
│   ├── JwtService               # Token generation, validation, extraction
│   ├── JwtProperties            # Typed config: app.jwt.*
│   ├── JwtAuthenticationFilter  # Per-request JWT filter
│   ├── UserDetailsServiceImpl   # Loads user by email
│   ├── SecurityEntryPoint       # 401 handler → ApiResponse JSON
│   ├── AccessDeniedHandlerImpl  # 403 handler → ApiResponse JSON
│   └── SecurityProperties       # Typed config: app.security.*
│
├── notification/                # Email module
│   ├── EmailService             # Async send, verification email, password reset email
│   ├── EmailRequest             # Value object: to, subject, body, html flag
│   └── MailProperties           # Typed config: app.mail.*
│
├── config/                      # Spring configuration classes
│   ├── SecurityConfig           # SecurityFilterChain, AuthenticationManager, BCrypt
│   ├── JpaConfig                # @EnableJpaAuditing + AuditAwareImpl bean
│   ├── AsyncConfig              # @EnableAsync + email thread pool
│   └── SwaggerConfig            # OpenAPI definition + bearerAuth scheme
│
├── audit/
│   └── AuditAwareImpl           # Resolves current principal for @CreatedBy/@LastModifiedBy
│
└── exception/                   # Global exception handling
    ├── GlobalExceptionHandler   # @RestControllerAdvice — all exception → ApiResponse
    ├── BusinessException        # Base runtime exception with HttpStatus
    ├── ResourceNotFoundException # 404
    ├── DuplicateResourceException # 409
    ├── UnauthorizedException    # 401
    └── ForbiddenException       # 403

src/main/resources/
├── application.properties
├── db/migration/
│   ├── V1__create_users_table.sql
│   ├── V2__seed_admin_user.sql
│   ├── V3__create_password_reset_tokens_table.sql
│   ├── V4__create_email_verification_tokens_table.sql
│   └── V5__update_admin_password.sql
└── templates/email/
    ├── verification.html
    └── password-reset.html
```

---

## API Reference

All responses follow this envelope:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "errors": null,
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/v1/users"
}
```

Error responses populate `errors` instead of `data`:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "must be a valid email address", "code": "Email" }
  ]
}
```

### Authentication — `/api/v1/auth` (public)

| Method | Path | Description |
|---|---|---|
| `POST` | `/register` | Register a new account. Sends a verification email. Returns tokens. |
| `POST` | `/login` | Login with email + password. Returns tokens. Blocked if email unverified. |
| `GET` | `/verify-email?token=` | Verify email address from the link in the verification email. |
| `POST` | `/resend-verification` | Resend the verification email. |
| `POST` | `/forgot-password` | Request a password reset email. Always returns 200. |
| `POST` | `/reset-password` | Complete password reset using the token from email. |

**Register request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "Secret@123"
}
```

**Login request:**
```json
{
  "email": "john.doe@example.com",
  "password": "Secret@123"
}
```

**Auth response:**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "email": "john.doe@example.com",
  "role": "USER"
}
```

### User Management — `/api/v1/users` (requires JWT)

| Method | Path | Role | Description |
|---|---|---|---|
| `GET` | `/me` | Any | Get own profile |
| `PATCH` | `/me` | Any | Update own name / username |
| `PATCH` | `/me/password` | Any | Change own password |
| `GET` | `/` | ADMIN | List all users (paginated + filtered) |
| `GET` | `/{id}` | ADMIN | Get any user by ID |
| `PATCH` | `/{id}/role` | ADMIN | Change a user's role |
| `PATCH` | `/{id}/deactivate` | ADMIN | Soft-deactivate a user |
| `PATCH` | `/{id}/activate` | ADMIN | Restore a deactivated user |

**Authenticated requests** — add the header:
```
Authorization: Bearer <accessToken>
```

**List users with filtering:**
```
GET /api/v1/users?page=0&size=10&sortBy=createdAt&sortDir=desc&role=USER&status=ACTIVE&search=gmail
```

All filter params are optional. `search` does a partial match on email.

---

## Features In Detail

### API Response Wrapper

Every endpoint returns the same JSON shape. `data` is `null` on errors; `errors` is `null` on success. Both are omitted from JSON when null (`@JsonInclude(NON_NULL)`).

Use `ResponseBuilder` in controllers:
```java
return ResponseBuilder.ok(dto, "User retrieved", request);
return ResponseBuilder.created(dto, "Account created", request);
return ResponseBuilder.noContent();
```

### JWT Authentication

- Tokens are signed with HMAC-SHA256 using a Base64-encoded secret.
- Access token default: 24 hours. Refresh token default: 7 days.
- The `sub` claim is the user's **email** (not username).
- A custom `role` claim is embedded so role checks don't require a DB lookup.
- The `JwtAuthenticationFilter` runs before every request, extracts the token, validates it, and populates `SecurityContextHolder`.

### Email Verification Flow

1. User registers → status set to `PENDING` → verification email sent async.
2. User clicks link → `GET /api/v1/auth/verify-email?token=...` → status set to `ACTIVE`.
3. Login with `PENDING` status → `403` with code `EMAIL_NOT_VERIFIED`.
4. Token expires after 24 hours → user can request a new one via `/resend-verification`.

### Password Reset Flow

1. `POST /forgot-password` → token created (15 min expiry) → email sent async.
2. `POST /reset-password` with token + new password → password updated, token marked used.
3. Always returns 200 on `/forgot-password` regardless of whether the email exists (prevents enumeration).

### Base Entity

Every entity that extends `BaseEntity` automatically gets:

| Column | Type | Description |
|---|---|---|
| `id` | `BIGINT` | Auto-generated primary key |
| `created_at` | `TIMESTAMPTZ` | Set on INSERT, never updated |
| `updated_at` | `TIMESTAMPTZ` | Updated on every UPDATE |
| `created_by` | `VARCHAR(100)` | Principal who created the record |
| `updated_by` | `VARCHAR(100)` | Principal who last modified it |
| `deleted` | `BOOLEAN` | Soft-delete flag |
| `deleted_at` | `TIMESTAMPTZ` | When it was soft-deleted |
| `deleted_by` | `VARCHAR(100)` | Who soft-deleted it |
| `status` | `VARCHAR(20)` | `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING` |

Soft-delete a record:
```java
entity.softDelete(currentUserEmail);
repository.save(entity);
```

Restore it:
```java
entity.restore();
repository.save(entity);
```

### Validation Layer

Custom annotations in `common/validation/`:

| Annotation | What it validates |
|---|---|
| `@ValidPassword` | 8–72 chars, upper + lower + digit + special char |
| `@NoWhitespace` | No leading or trailing spaces |
| `@ValidEnum` | String matches a given enum's constants |

All validation messages are constants in `ValidationMessages` — change once, applies everywhere.

Use `ValidationGroups` to apply different rules per operation:
```java
// Controller — only OnCreate constraints fire
@Validated(ValidationGroups.OnCreate.class) @RequestBody RegisterRequest body

// Controller — only OnPatch constraints fire
@Validated(ValidationGroups.OnPatch.class) @RequestBody UpdateProfileRequest body
```

### Pagination & Filtering

**Paginated response shape:**
```json
{
  "content": [...],
  "meta": {
    "page": 0,
    "size": 10,
    "totalElements": 47,
    "totalPages": 5,
    "first": true,
    "last": false,
    "empty": false
  }
}
```

**In a service:**
```java
Specification<User> spec = new BaseSpecification<>(criteria);
Page<User> page = userRepository.findAll(spec, pageable);
return PageResponse.of(page, userMapper::toDto);
```

**In a controller:**
```java
Pageable pageable = PaginationUtil.toPageable(page, size, sortBy, sortDir, ALLOWED_SORT_FIELDS);
```

Defaults: page=0, size=10, sortBy=id, sortDir=asc. Max size: 100.

**Adding a filter to any entity:**
1. Make the repository extend `JpaSpecificationExecutor<YourEntity>`.
2. Build a `List<SearchCriteria>` from request params.
3. Pass to `new BaseSpecification<>(criteria)`.

### Email Service (Brevo)

All outbound mail is sent through the **[Brevo](https://www.brevo.com/) transactional email API** (`POST /v3/smtp/email`). SMTP/JavaMail has been removed.

| Component | Role |
|---|---|
| `BrevoConfig` | `RestClient` wired with `api-key` header |
| `BrevoEmailDeliveryService` | API transport, retries, delivery status (`messageId`) |
| `EmailService` | Verification, password reset, notifications (`@Async`) |
| `EmailTemplateRenderer` | Renders `templates/email/*.html` with `{{placeholders}}` |
| `MailStartupRunner` | Optional startup API check + one-shot test email |

**Configuration** — use environment variables or `application-local.properties` (see `application-brevo.example.properties`):

| Variable | Description |
|---|---|
| `BREVO_API_KEY` | Transactional API key (`xkeysib-…`) from Brevo → SMTP & API → API Keys |
| `BREVO_SENDER_EMAIL` | Verified sender address in Brevo (maps to `app.mail.from`) |
| `MAIL_FROM_NAME` | Display name in the From header |
| `MAIL_FRONTEND_BASE_URL` | SPA URL for links in emails (`http://localhost:5173`) |
| `MAIL_TEST_RECIPIENT` | Sends one test email on startup when set |
| `BREVO_API_URL` | Optional API base URL (default `https://api.brevo.com`) |

**Brevo setup checklist:**

1. Create an API key in the [Brevo dashboard](https://app.brevo.com/).
2. Add and verify a sender under **Senders, Domains & Dedicated IPs**.
3. If **authorised IPs** is enabled, add your server IP at [Security → Authorised IPs](https://app.brevo.com/security/authorised_ips) or disable IP restriction for local dev.
4. Export credentials (never commit `BREVO_API_KEY`):

```bash
export BREVO_API_KEY=xkeysib-your-key
export BREVO_SENDER_EMAIL=noreply@yourdomain.com
export MAIL_TEST_RECIPIENT=you@example.com
```

**Smoke test on startup** — set `MAIL_TEST_RECIPIENT` and restart the app. Logs will include the Brevo `messageId` on success.

**Manual integration test:**

```bash
mvn test -Dtest=BrevoEmailIntegrationTest \
  -Dmail.it.recipient=you@example.com
```

**Sending a custom email:**

```java
emailService.sendAsync(EmailRequest.builder()
    .to("user@example.com")
    .subject("Welcome")
    .body("<h1>Hello!</h1>")
    .html(true)
    .build());
```

**Email link targets (SPA):**

- Verification: `{frontend}/verify-email?token=...`
- Password reset: `{frontend}/reset-password?token=...`

**Disable email** (CI/local without Brevo):

```properties
app.mail.enabled=false
```

### Global Exception Handling

`GlobalExceptionHandler` catches everything and returns a consistent `ApiResponse`. You never need to write try/catch in controllers or services for these cases:

| Exception | HTTP |
|---|---|
| `MethodArgumentNotValidException` | 400 — validation errors with field details |
| `ConstraintViolationException` | 400 — path/query param violations |
| `ResourceNotFoundException` | 404 |
| `DuplicateResourceException` | 409 |
| `UnauthorizedException` | 401 |
| `ForbiddenException` | 403 |
| `DataIntegrityViolationException` | 409 — DB unique constraint (parses field name from PostgreSQL/MySQL error) |
| `TransactionSystemException` | 400 — entity-level validation at commit time |
| `AuthenticationException` | 401 |
| `AccessDeniedException` | 403 |
| `HttpMessageNotReadableException` | 400 — malformed JSON |
| `NoResourceFoundException` | 404 — unknown URL |
| `Exception` | 500 — catch-all, real cause logged server-side only |

**Throwing domain errors in services:**
```java
throw new ResourceNotFoundException("User", "id", id);
throw new DuplicateResourceException("User", "email", email);
throw new ForbiddenException("You can only modify your own resources");
throw new BusinessException("Account is suspended", HttpStatus.FORBIDDEN);
```

### Flyway Migrations

Migrations live in `src/main/resources/db/migration/` and follow the naming convention `V{version}__{description}.sql`.

| File | What it does |
|---|---|
| `V1` | Creates the `users` table |
| `V2` | Seeds the default admin user |
| `V3` | Creates `password_reset_tokens` table |
| `V4` | Creates `email_verification_tokens` table |
| `V5` | Updates admin password hash |

**Adding a new migration:**
1. Create `V6__your_description.sql` in `db/migration/`.
2. Write your SQL.
3. Restart the app — Flyway runs it automatically.

> Never modify an existing migration file after it has been applied. Flyway checksums every file and will refuse to start if a checksum changes.

### Role-Based Access Control

Three roles: `USER`, `MODERATOR`, `ADMIN`.

**Coarse-grained** — on controller methods:
```java
@PreAuthorize("hasRole('ADMIN')")
@GetMapping
public ResponseEntity<?> listAll(...) { ... }
```

**Fine-grained** — inside service methods:
```java
if (!currentUser.getId().equals(resourceOwnerId)) {
    throw new ForbiddenException("You can only modify your own resources");
}
```

`@EnableMethodSecurity` is active in `SecurityConfig`, so `@PreAuthorize` works on any Spring-managed bean.

---

## Configuration Reference

All custom properties are prefixed with `app.*`:

```properties
# JWT
app.jwt.secret=                          # Base64-encoded HMAC-SHA256 key (min 32 bytes)
app.jwt.expiration-ms=86400000           # Access token TTL in ms (default: 24h)
app.jwt.refresh-expiration-ms=604800000  # Refresh token TTL in ms (default: 7d)
app.jwt.issuer=JavaT                     # JWT iss claim

# Security
app.security.public-paths[0]=/api/v1/auth/**   # Paths that bypass JWT

# Mail (Brevo — see application-brevo.example.properties)
app.brevo.api-key=${BREVO_API_KEY}
app.mail.from=${BREVO_SENDER_EMAIL}
app.mail.from-name=YourAppName
app.mail.api-base-url=http://localhost:8080
app.mail.frontend-base-url=http://localhost:5173
app.mail.test-recipient=   # optional startup smoke test

# Async thread pool
app.async.core-pool-size=2
app.async.max-pool-size=5
app.async.queue-capacity=100
app.async.thread-name-prefix=async-email-

# Token expiry
app.auth.password-reset-token-expiry-minutes=15
app.auth.verification-token-expiry-hours=24
```

---

## Using This Template for a New Project

1. Clone the repository.
2. Rename the package from `com.spring.JavaT` to `com.yourcompany.yourapp` (IDE refactor → rename package).
3. Update `spring.application.name` in `application.properties`.
4. Update `pom.xml` `<groupId>`, `<artifactId>`, and `<name>`.
5. Create your database and update the datasource credentials.
6. Generate a new JWT secret: `openssl rand -base64 32`.
7. Configure your Brevo API key and verified sender email.
8. Run `mvn spring-boot:run` — Flyway creates the schema automatically.
9. Start building your domain features on top.

---

## Extending the Template

### Adding a new entity

```java
@Entity
@Table(name = "products")
public class Product extends BaseEntity {
    // Your fields — id, timestamps, audit, soft-delete, status come from BaseEntity
    private String name;
    private BigDecimal price;
}
```

### Adding a new paginated + filtered endpoint

```java
// Repository
public interface ProductRepository extends JpaRepository<Product, Long>,
        JpaSpecificationExecutor<Product> { }

// Service
public PageResponse<ProductDto> findAll(List<SearchCriteria> criteria, Pageable pageable) {
    Specification<Product> spec = new BaseSpecification<>(criteria);
    return PageResponse.of(productRepository.findAll(spec, pageable), productMapper::toDto);
}

// Controller
@GetMapping
public ResponseEntity<ApiResponse<PageResponse<ProductDto>>> list(
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size,
        @RequestParam(required = false) String sortBy,
        @RequestParam(required = false) String sortDir,
        @RequestParam(required = false) String name,
        HttpServletRequest request) {

    Pageable pageable = PaginationUtil.toPageable(page, size, sortBy, sortDir,
            Set.of("id", "name", "price", "createdAt"));

    List<SearchCriteria> criteria = new ArrayList<>();
    if (name != null) criteria.add(new SearchCriteria("name", SearchCriteria.Op.LIKE, name));

    return ResponseBuilder.ok(
            productService.findAll(criteria, pageable),
            "Products retrieved successfully",
            request);
}
```

### Adding a new email type

```java
// 1. Create templates/email/welcome.html with {{firstName}}, {{appName}} placeholders

// 2. Add to EmailService
@Async("emailTaskExecutor")
public void sendWelcomeEmail(String toEmail, String firstName) {
    String body = templateRenderer.render("welcome.html", Map.of(
            "appName",   mailProperties.getFromName(),
            "firstName", firstName
    ));
    sendAsync(EmailRequest.builder()
            .to(toEmail)
            .subject("Welcome to " + mailProperties.getFromName())
            .body(body)
            .html(true)
            .build());
}
```

---

## License

MIT — use freely for personal and commercial projects.

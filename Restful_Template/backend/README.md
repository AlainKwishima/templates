# National_Examination

Lean backend starter built with:

- Express.js
- TypeScript
- PostgreSQL
- Prisma
- JWT auth
- Zod validation
- Pino logging
- Swagger/OpenAPI

## What is included

- Auth: register, login, refresh, logout, password reset, email verification
- Users: profile, roles, admin status/role management
- Health checks: `/health`, `/health/live`, `/health/ready`
- File upload support with local storage
- Brevo transactional email for verification and password reset flows
- Strict TypeScript, linting, formatting, and Prisma seeding

## What was intentionally removed

- Docker
- Tests
- Redis
- Cron jobs
- Queues
- Advanced audit systems
- DTO mapping layers
- Repository abstractions

## Quick start

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Make sure PostgreSQL is running locally.
4. Run Prisma generate/migrate:
   - `npm run prisma:generate`
   - `npm run prisma:migrate:dev`
5. Seed the database:
   - `npm run db:seed`
6. Start the app:
   - `npm run dev`

## Brevo email setup

1. Create a Brevo account and generate an API key from **SMTP & API → API Keys**.
2. Verify a sender email or domain under **Senders, Domains & Dedicated IPs**.
3. Add the following to `.env`:

```env
EMAIL_ENABLED=true
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=verified-sender@yourdomain.com
BREVO_SENDER_NAME=National_Examination
FRONTEND_URL=http://localhost:5173
BREVO_TEST_RECIPIENT=recipient@example.com
```

4. Send a test email:

```bash
npm run email:test
```

When `EMAIL_ENABLED=false` or `BREVO_API_KEY` is empty, emails are logged in preview mode and not sent.

### Email workflows

- **Registration** sends a verification email with a frontend link.
- **Forgot password** sends a reset link email.
- Delivery attempts are retried automatically for transient Brevo/network failures.
- Each successful send logs the Brevo `messageId` for traceability.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run typecheck`
- `npm run lint`
- `npm run format`
- `npm run prisma:generate`
- `npm run prisma:migrate:dev`
- `npm run prisma:migrate:deploy`
- `npm run prisma:migrate:reset`
- `npm run prisma:studio`
- `npm run db:seed`
- `npm run email:test`

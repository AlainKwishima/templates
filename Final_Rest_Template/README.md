# Institution Management Starter Kit

A production-ready REST API backend built with Node.js, TypeScript, Express.js, PostgreSQL, and Prisma ORM. Use it as a foundation for school, library, inventory, or other institution management systems.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Docker)

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Start PostgreSQL (Docker)
docker compose up -d db

# Run migrations and seed
npm run db:generate
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

API base URL: `http://localhost:3000/api/v1`  
Swagger UI: `http://localhost:3000/api-docs`

### Default admin (after seed)

- Email: `admin@institution.local`
- Password: `Admin123!`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default 3000) |
| `NODE_ENV` | `development` \| `production` \| `test` |
| `CLIENT_URL` | Front-end URL for CORS and email links |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT access tokens |
| `JWT_ACCESS_EXPIRY` | Access token lifetime (e.g. `15m`) |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime (e.g. `7d`) |
| `BREVO_API_KEY` | Brevo transactional email API key |
| `BREVO_SENDER_EMAIL` | Verified sender email |
| `BREVO_SENDER_NAME` | Sender display name |
| `DISABLE_SWAGGER` | Set `true` to disable `/api-docs` |

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm test` | Jest with coverage |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |

## Project Structure

```
src/
├── config/          # env, database, swagger
├── middleware/      # auth, validation, errors
├── modules/         # feature modules (auth, users, …)
├── database/        # seed script
├── routes/          # API route registry
├── shared/zod/      # reusable validation schemas
├── utils/           # helpers (AppError, pagination, …)
├── app.ts           # Express application
└── server.ts        # HTTP server entry point
```

## API Modules

- **Auth** — register, login, logout, email verification, password reset, refresh token
- **Users** — CRUD (Admin only)
- **Roles** — CRUD (Admin only)
- **Departments** — CRUD with search
- **Resources** — CRUD with search, filters, sorting
- **Transactions** — CRUD with status workflow
- **Reports** — aggregated statistics (Admin)
- **Dashboard** — summary metrics (Admin)

All endpoints use the standard envelope: `{ success, message, data }` with appropriate HTTP status codes.

## Docker

```bash
docker compose up
```

Starts PostgreSQL and the API service together.

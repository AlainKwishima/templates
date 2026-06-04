# Institution Management Starter Kit

This repository is implemented as a microservices-based institution management platform.

## Architecture

| Service | Port | Responsibility |
|---|---:|---|
| `api-gateway` | `3000` | Public entry point and path-based request routing |
| `auth-service` | `3001` | Register, login, logout, email verification, password reset, token refresh |
| `user-service` | `3002` | User CRUD and admin-facing user management |
| `role-service` | `3003` | Role CRUD |
| `department-service` | `3004` | Department CRUD |
| `resource-service` | `3005` | Resource CRUD |
| `transaction-service` | `3006` | Transaction lifecycle and status transitions |
| `notification-service` | `3007` | Transactional email persistence and dispatch |
| `report-service` | `3008` | Cross-domain aggregated reports |
| `dashboard-service` | `3009` | Admin summary dashboard |

## Run

```bash
npm install
cp .env.example .env   # set JWT_SECRET and POSTGRES_PASSWORD (default: mukabareke)
docker compose up --build -d
npm run smoke:e2e      # optional: verify gateway + auth + core APIs
```

The gateway is available at `http://localhost:3000`.

**Swagger UI:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs) (aggregated API for all services). Set `DISABLE_SWAGGER=true` to disable.

**Default admin:** `admin@institution.local` / `Admin123!`

See [SETUP.md](./SETUP.md) for full installation, configuration, validation notes, and troubleshooting.

## API Routing

| Path prefix | Service |
|---|---|
| `/api/v1/auth` | `auth-service` |
| `/api/v1/users` | `user-service` |
| `/api/v1/roles` | `role-service` |
| `/api/v1/departments` | `department-service` |
| `/api/v1/resources` | `resource-service` |
| `/api/v1/transactions` | `transaction-service` |
| `/api/v1/reports` | `report-service` |
| `/api/v1/dashboard` | `dashboard-service` |

## Testing

Run all workspace tests:

```bash
npm run test:all
```

## Service Guides

- [API Gateway](./services/api-gateway/README.md)
- [Auth Service](./services/auth-service/README.md)
- [User Service](./services/user-service/README.md)
- [Role Service](./services/role-service/README.md)
- [Department Service](./services/department-service/README.md)
- [Resource Service](./services/resource-service/README.md)
- [Transaction Service](./services/transaction-service/README.md)
- [Notification Service](./services/notification-service/README.md)
- [Report Service](./services/report-service/README.md)
- [Dashboard Service](./services/dashboard-service/README.md)

# API Gateway

- Port: `3000`
- Responsibility: public entry point and path-based routing

## Endpoints

- `GET /health`
- `GET /api-docs` — aggregated Swagger UI (all microservices)
- `GET /api-docs.json` — aggregated OpenAPI 3.0 specification

## Environment

- `PORT`
- `NODE_ENV`
- `AUTH_SERVICE_URL`
- `USER_SERVICE_URL`
- `ROLE_SERVICE_URL`
- `DEPARTMENT_SERVICE_URL`
- `RESOURCE_SERVICE_URL`
- `TRANSACTION_SERVICE_URL`
- `NOTIFICATION_SERVICE_URL`
- `REPORT_SERVICE_URL`
- `DASHBOARD_SERVICE_URL`

## Test

```bash
npm test
```

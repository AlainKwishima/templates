# Report Service

- Port: `3008`
- Responsibility: aggregated cross-domain reporting

## Endpoints

- `GET /api/v1/reports/users`
- `GET /api/v1/reports/resources`
- `GET /api/v1/reports/transactions`
- `GET /api/v1/reports/departments`
- `GET /health`

## Environment

- `PORT`
- `NODE_ENV`
- `JWT_SECRET`
- `USER_SERVICE_URL`
- `RESOURCE_SERVICE_URL`
- `TRANSACTION_SERVICE_URL`
- `DEPARTMENT_SERVICE_URL`

## Test

```bash
npm test
```

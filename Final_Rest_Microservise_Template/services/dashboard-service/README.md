# Dashboard Service

- Port: `3009`
- Responsibility: cross-domain admin summary and operational metrics

## Endpoints

- `GET /api/v1/dashboard`
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

# Transaction Service

- Port: `3006`
- Responsibility: transaction lifecycle, validation, and notifications

## Endpoints

- `GET /api/v1/transactions`
- `POST /api/v1/transactions`
- `GET /api/v1/transactions/:id`
- `PUT /api/v1/transactions/:id`
- `DELETE /api/v1/transactions/:id`
- `GET /health`

## Environment

- `PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `JWT_SECRET`
- `USER_SERVICE_URL`
- `RESOURCE_SERVICE_URL`
- `NOTIFICATION_SERVICE_URL`

## Test

```bash
npm test
```

# Role Service

- Port: `3003`
- Responsibility: role CRUD and authorization reference data

## Endpoints

- `GET /api/v1/roles`
- `POST /api/v1/roles`
- `GET /api/v1/roles/:id`
- `PUT /api/v1/roles/:id`
- `DELETE /api/v1/roles/:id`
- `GET /health`

## Environment

- `PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `JWT_SECRET`

## Test

```bash
npm test
```

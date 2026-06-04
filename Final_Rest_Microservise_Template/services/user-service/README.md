# User Service

- Port: `3002`
- Responsibility: user CRUD and admin-facing management

## Endpoints

- `GET /api/v1/users`
- `POST /api/v1/users`
- `GET /api/v1/users/:id`
- `PUT /api/v1/users/:id`
- `DELETE /api/v1/users/:id`
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

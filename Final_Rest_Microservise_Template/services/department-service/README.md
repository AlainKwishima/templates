# Department Service

- Port: `3004`
- Responsibility: department CRUD and reference data

## Endpoints

- `GET /api/v1/departments`
- `POST /api/v1/departments`
- `GET /api/v1/departments/:id`
- `PUT /api/v1/departments/:id`
- `DELETE /api/v1/departments/:id`
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

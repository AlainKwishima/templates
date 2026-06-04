# Resource Service

- Port: `3005`
- Responsibility: resource CRUD and department-linked inventory data

## Endpoints

- `GET /api/v1/resources`
- `POST /api/v1/resources`
- `GET /api/v1/resources/:id`
- `PUT /api/v1/resources/:id`
- `DELETE /api/v1/resources/:id`
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

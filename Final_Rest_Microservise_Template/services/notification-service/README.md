# Notification Service

- Port: `3007`
- Responsibility: transactional email dispatch and notification persistence

## Endpoints

- `POST /api/v1/notifications/send`
- `GET /health`

## Environment

- `PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `CLIENT_URL`

## Test

```bash
npm test
```

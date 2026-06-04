# Frontend

React + Vite SPA for the microservices API gateway.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Set `VITE_API_BASE_URL=http://localhost:3000/api/v1` (gateway).

## Structure

- `src/features/` — API modules and React Query hooks per domain
- `src/lib/api/` — Typed HTTP client and error handling
- `src/lib/auth/` — Session storage and bootstrap refresh

# JavaT Frontend

A minimal, production-ready React + TypeScript starter kit integrated with the JavaT Spring Boot backend.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Routing | React Router 7 |
| Server State | TanStack Query |
| HTTP | Axios |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 20+
- JavaT backend running at `http://localhost:8080`

### Setup

```bash
cd frontend
npm install
cp .env.example .env   # if .env doesn't exist
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Default admin login

Use the admin account seeded by Flyway (see backend README).

## Project Structure

```
frontend/src/
├── api/              # API client, types, service modules
├── components/
│   ├── auth/         # ProtectedRoute, GuestRoute
│   ├── crud/         # Generic CrudPage shell
│   ├── layout/       # AppLayout, AuthLayout, toasts
│   ├── table/        # DataTable, Pagination
│   └── ui/           # Design system components
├── contexts/         # Auth, Theme, Notifications
├── hooks/            # useApiError, usePagination
├── pages/            # Route pages by feature
├── routes/           # Route definitions
├── styles/           # CSS variables, globals
├── utils/            # Validation, errors, storage, format
└── constants/        # Routes, roles, config
```

## Features

- **Authentication** — Login, register, forgot/reset password, email verification
- **Authorization** — JWT bearer tokens, role-based protected routes (ADMIN)
- **User Management** — Paginated list, filters, role changes, activate/deactivate
- **Profile** — View/update profile, change password
- **Dashboard** — Account overview and quick links
- **Roles & Permissions** — Role documentation with live user counts
- **Settings** — Theme (light/dark), app info
- **API Docs** — OpenAPI spec viewer + Swagger UI link
- **Audit Logs** — Placeholder ready for backend integration
- **Design System** — Button, Input, Select, Card, Badge, Modal, Alert, Skeleton, etc.
- **Generic CRUD** — Reusable `CrudPage` component for new resources

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend API base URL |
| `VITE_APP_NAME` | `JavaT` | Application display name |

## Backend Integration

The backend must allow CORS from `http://localhost:5173`. CORS is configured in `CorsConfig.java`.

All API responses use the standard envelope:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "errors": null
}
```

Authenticated requests send `Authorization: Bearer <accessToken>`.

## Extending

### Add a new API resource

1. Add types in `src/api/types.ts`
2. Create `src/api/your-resource.api.ts`
3. Export from `src/api/index.ts`
4. Build a page using `CrudPage` or custom layout
5. Add route in `src/routes/index.tsx`

### Add a new page to the sidebar

Edit `navItems` in `src/components/layout/AppLayout.tsx`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

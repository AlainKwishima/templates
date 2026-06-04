export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Restful Microservices API",
    version: "1.0.0",
    description: "Unified API documentation for the API gateway (auth, users, files services).",
  },
  servers: [{ url: "/api/v1", description: "Gateway" }],
  tags: [
    { name: "Health", description: "Gateway and service health" },
    { name: "Auth", description: "Authentication service" },
    { name: "Users", description: "User service" },
    { name: "Files", description: "File service" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Aggregated gateway health",
        security: [],
        responses: { "200": { description: "All services healthy or degraded report" } },
      },
    },
    "/auth/register": {
      post: { tags: ["Auth"], summary: "Register", security: [] },
    },
    "/auth/login": {
      post: { tags: ["Auth"], summary: "Login", security: [] },
    },
    "/auth/refresh": {
      post: { tags: ["Auth"], summary: "Refresh tokens", security: [] },
    },
    "/auth/logout": {
      post: { tags: ["Auth"], summary: "Logout", security: [] },
    },
    "/auth/me": {
      get: { tags: ["Auth"], summary: "Current user from token", security: [{ bearerAuth: [] }] },
    },
    "/users/me": {
      get: { tags: ["Users"], summary: "Profile", security: [{ bearerAuth: [] }] },
      patch: { tags: ["Users"], summary: "Update profile", security: [{ bearerAuth: [] }] },
    },
    "/users/admin": {
      get: { tags: ["Users"], summary: "List users (admin)", security: [{ bearerAuth: [] }] },
    },
    "/files": {
      get: { tags: ["Files"], summary: "List files", security: [{ bearerAuth: [] }] },
    },
    "/files/upload": {
      post: { tags: ["Files"], summary: "Upload file", security: [{ bearerAuth: [] }] },
    },
  },
} as const;

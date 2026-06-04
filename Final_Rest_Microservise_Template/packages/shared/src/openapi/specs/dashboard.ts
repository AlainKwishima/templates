import { bearerSecurity, createServiceSpec } from '../common';

export const dashboardOpenApi = createServiceSpec({
  title: 'Dashboard Service API',
  description: 'Admin dashboard summary across domains',
  tag: 'Dashboard',
  port: 3009,
  paths: {
    '/api/v1/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard summary (Admin)',
        security: bearerSecurity,
        responses: {
          '200': { description: 'Dashboard summary (may be partial if services are down)' },
          '503': { description: 'Required services unavailable' },
        },
      },
    },
  },
});

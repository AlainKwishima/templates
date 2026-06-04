import { bearerSecurity, createServiceSpec } from '../common';

const reportOp = (summary: string) => ({
  tags: ['Reports'],
  summary,
  security: bearerSecurity,
  responses: {
    '200': { description: 'Report generated' },
    '503': { description: 'Downstream service unavailable' },
  },
});

export const reportOpenApi = createServiceSpec({
  title: 'Report Service API',
  description: 'Cross-domain aggregated reports (Admin)',
  tag: 'Reports',
  port: 3008,
  paths: {
    '/api/v1/reports/users': { get: reportOp('User report') },
    '/api/v1/reports/resources': { get: reportOp('Resource report') },
    '/api/v1/reports/transactions': { get: reportOp('Transaction report') },
    '/api/v1/reports/departments': { get: reportOp('Department report') },
  },
});

import type { Express } from 'express';
import {
  authOpenApi,
  departmentOpenApi,
  dashboardOpenApi,
  mergeOpenApiSpecs,
  mountSwagger,
  notificationOpenApi,
  reportOpenApi,
  resourceOpenApi,
  roleOpenApi,
  transactionOpenApi,
  userOpenApi,
  type OpenApiDocument,
} from '@shared/lib';
import { env } from './config/env';

export const bundledSpecs: Array<{ tag: string; spec: OpenApiDocument }> = [
  { tag: 'Auth', spec: authOpenApi },
  { tag: 'Users', spec: userOpenApi },
  { tag: 'Roles', spec: roleOpenApi },
  { tag: 'Departments', spec: departmentOpenApi },
  { tag: 'Resources', spec: resourceOpenApi },
  { tag: 'Transactions', spec: transactionOpenApi },
  { tag: 'Notifications', spec: notificationOpenApi },
  { tag: 'Reports', spec: reportOpenApi },
  { tag: 'Dashboard', spec: dashboardOpenApi },
];

const remoteSources = [
  { tag: 'Auth', url: `${env.AUTH_SERVICE_URL}/api-docs.json` },
  { tag: 'Users', url: `${env.USER_SERVICE_URL}/api-docs.json` },
  { tag: 'Roles', url: `${env.ROLE_SERVICE_URL}/api-docs.json` },
  { tag: 'Departments', url: `${env.DEPARTMENT_SERVICE_URL}/api-docs.json` },
  { tag: 'Resources', url: `${env.RESOURCE_SERVICE_URL}/api-docs.json` },
  { tag: 'Transactions', url: `${env.TRANSACTION_SERVICE_URL}/api-docs.json` },
  { tag: 'Notifications', url: `${env.NOTIFICATION_SERVICE_URL}/api-docs.json` },
  { tag: 'Reports', url: `${env.REPORT_SERVICE_URL}/api-docs.json` },
  { tag: 'Dashboard', url: `${env.DASHBOARD_SERVICE_URL}/api-docs.json` },
];

async function fetchRemoteSpecs(): Promise<Array<{ tag: string; spec: OpenApiDocument }>> {
  const results = await Promise.all(
    remoteSources.map(async (source) => {
      try {
        const response = await fetch(source.url, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) {
          console.warn(`[api-gateway] Swagger: ${source.tag} spec HTTP ${response.status} from ${source.url}`);
          return null;
        }
        return { tag: source.tag, spec: (await response.json()) as OpenApiDocument };
      } catch (error) {
        console.warn(
          `[api-gateway] Swagger: ${source.tag} fetch failed (${source.url}):`,
          error instanceof Error ? error.message : error,
        );
        return null;
      }
    }),
  );

  return results.filter((entry): entry is { tag: string; spec: OpenApiDocument } => entry !== null);
}

export function mountGatewaySwagger(app: Express, specs: Array<{ tag: string; spec: OpenApiDocument }>): void {
  const aggregated = mergeOpenApiSpecs(specs, env.PUBLIC_GATEWAY_URL);
  mountSwagger(app, {
    serviceName: 'api-gateway',
    spec: aggregated,
    disabled: env.DISABLE_SWAGGER === 'true',
  });
  console.log(`[api-gateway] Swagger UI at /api-docs (${Object.keys(aggregated.paths).length} paths)`);
}

export async function initGatewaySwagger(app: Express): Promise<void> {
  if (env.DISABLE_SWAGGER === 'true') {
    mountGatewaySwagger(app, []);
    return;
  }

  const remote = await fetchRemoteSpecs();
  const specs = remote.length > 0 ? remote : bundledSpecs;
  if (remote.length === 0) {
    console.warn('[api-gateway] Swagger: using bundled OpenAPI specs (remote /api-docs.json unavailable)');
  }
  mountGatewaySwagger(app, specs);
}

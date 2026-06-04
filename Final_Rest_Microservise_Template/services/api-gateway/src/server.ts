import app from './app';
import { sendError } from '@shared/lib';
import { env } from './config/env';
import { initGatewaySwagger } from './swagger';

async function main() {
  await initGatewaySwagger(app);

  app.use((_req, res) => sendError(res, 'Route not found', 404));

  app.listen(env.PORT, () => {
    console.log(`[api-gateway] Running on port ${env.PORT} (${env.NODE_ENV})`);
    if (env.DISABLE_SWAGGER !== 'true') {
      console.log(`[api-gateway] Swagger UI: ${env.PUBLIC_GATEWAY_URL}/api-docs`);
    }
  });
}

main().catch((error) => {
  console.error('[api-gateway] failed to start:', error);
  process.exit(1);
});

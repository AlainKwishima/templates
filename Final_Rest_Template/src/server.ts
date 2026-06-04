import app from './app';
import { env } from './config/env';
import prisma from './config/database';

const start = async () => {
  try {
    await prisma.$connect();
    app.listen(env.PORT, () => {
      console.log(`[server] Running on port ${env.PORT} (${env.NODE_ENV})`);
      if (!env.DISABLE_SWAGGER) {
        console.log(`[server] Swagger UI: http://localhost:${env.PORT}/api-docs`);
      }
    });
  } catch (error) {
    console.error('[server] Failed to start:', error);
    process.exit(1);
  }
};

start();

const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

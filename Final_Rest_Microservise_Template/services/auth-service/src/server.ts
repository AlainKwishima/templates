import app from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`[auth-service] Running on port ${env.PORT} (${env.NODE_ENV})`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);


import { createServer } from "@restful/service-kit";
import { bootstrapShared } from "@/bootstrap.js";
import { createApp } from "@/app.js";
import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";
import { prisma } from "@/database/prisma.js";

bootstrapShared();

const app = createApp();
const server = createServer(app, {
  onShutdown: () => prisma.$disconnect(),
});

server.listen(env.PORT, env.HOST, () => {
  logger.info({ port: env.PORT, host: env.HOST, env: env.NODE_ENV }, `${env.APP_NAME} started`);
});

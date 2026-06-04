import { createApp } from "@/app.js";
import { env } from "@/config/env.js";
import { logger } from "@/shared/logger/logger.js";
import { createServer } from "@/server.js";

const app = createApp();
const server = createServer(app);

server.listen(env.PORT, env.HOST, () => {
  logger.info(
    {
      port: env.PORT,
      host: env.HOST,
      env: env.NODE_ENV,
    },
    `${env.APP_NAME} started`,
  );
});

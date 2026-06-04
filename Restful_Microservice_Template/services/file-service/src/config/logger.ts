import { createLogger } from "@restful/service-kit";
import { env } from "@/config/env.js";

export const logger = createLogger({
  serviceName: env.APP_NAME,
  nodeEnv: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
});

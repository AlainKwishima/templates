import pino from "pino";
import { env } from "@/config/env.js";

const baseConfig = {
  level: env.LOG_LEVEL,
  base: {
    service: env.APP_NAME,
    env: env.NODE_ENV,
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "passwordHash",
      "*.password",
      "*.token",
      "*.refreshToken",
      "*.accessToken",
    ],
    remove: true,
  },
};

export const logger =
  env.NODE_ENV === "development"
    ? pino({
        ...baseConfig,
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard", singleLine: false },
        },
      })
    : pino(baseConfig);

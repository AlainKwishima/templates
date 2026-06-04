import pino, { type Logger } from "pino";

export interface LoggerConfig {
  serviceName: string;
  nodeEnv: string;
  logLevel: string;
}

export function createLogger(config: LoggerConfig): Logger {
  const baseConfig = {
    level: config.logLevel,
    base: {
      service: config.serviceName,
      env: config.nodeEnv,
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

  return config.nodeEnv === "development"
    ? pino({
        ...baseConfig,
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard", singleLine: false },
        },
      })
    : pino(baseConfig);
}

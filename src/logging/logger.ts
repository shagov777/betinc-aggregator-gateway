import pino, { type Logger } from "pino";
import type { AppConfig } from "../config/env.js";

export function createLogger(config: Pick<AppConfig, "logLevel" | "serviceName" | "nodeEnv">): Logger {
  return pino({
    level: config.logLevel,
    base: {
      service: config.serviceName,
      environment: config.nodeEnv
    }
  });
}

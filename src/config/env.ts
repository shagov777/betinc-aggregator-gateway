import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  SERVICE_NAME: z.string().min(1).default("betinc-aggregator-gateway")
});

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
  serviceName: string;
};

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const parsed = envSchema.parse(env);

  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    logLevel: parsed.LOG_LEVEL,
    serviceName: parsed.SERVICE_NAME
  };
}

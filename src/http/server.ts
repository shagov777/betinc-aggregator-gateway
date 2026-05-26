import express, { type Express } from "express";
import { pinoHttp } from "pino-http";
import type { Logger } from "pino";
import type { AppConfig } from "../config/env.js";
import type { AdapterRegistry } from "../adapters/registry.js";
import { correlationIdHeader, correlationIdMiddleware } from "./correlation.js";
import { createHealthRouter } from "./health.js";

export type CreateAppOptions = {
  config: AppConfig;
  logger: Logger;
  adapters: AdapterRegistry;
};

type CorrelatedRequest = {
  correlationId?: string;
};

export function createApp({ config, logger }: CreateAppOptions): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());
  app.use(correlationIdMiddleware);
  app.use(
    pinoHttp<CorrelatedRequest>({
      logger,
      customProps: (req) => ({
        correlationId: req.correlationId
      }),
      customAttributeKeys: {
        reqId: correlationIdHeader
      }
    })
  );
  app.use(createHealthRouter(config));

  return app;
}

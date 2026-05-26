import express, { type Express } from "express";
import { pinoHttp } from "pino-http";
import type { Logger } from "pino";
import type { AppConfig } from "../config/env.js";
import type { AdapterRegistry } from "../adapters/registry.js";
import type { GatewayEventEmitter } from "../events/index.js";
import type { MetricsRegistry } from "../metrics/index.js";
import { correlationIdHeader, correlationIdMiddleware } from "./correlation.js";
import { createDiagnosticsRouter } from "./diagnostics.js";
import { createHealthRouter } from "./health.js";

export type CreateAppOptions = {
  config: AppConfig;
  logger: Logger;
  adapters: AdapterRegistry;
  events: GatewayEventEmitter;
  metrics: MetricsRegistry;
};

type CorrelatedRequest = {
  correlationId?: string;
};

export function createApp({ config, logger, events, metrics }: CreateAppOptions): Express {
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
  app.use(createDiagnosticsRouter({ events, metrics }));

  return app;
}

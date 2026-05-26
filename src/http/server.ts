import express, { type Express } from "express";
import { pinoHttp } from "pino-http";
import type { Logger } from "pino";
import type { AppConfig } from "../config/env.js";
import type { AdapterRegistry } from "../adapters/registry.js";
import type { GatewayEventEmitter } from "../events/index.js";
import type { MetricsRegistry } from "../metrics/index.js";
import type { ProviderCatalogueSnapshot } from "../providers/index.js";
import type { ProviderHealthTracker, ProviderRegistry, SyncSchedulerPlaceholder } from "../providers/index.js";
import type { SessionRegistry } from "../sessions/index.js";
import type { CredentialStore } from "../security/index.js";
import type { IdempotencyStore } from "../idempotency/index.js";
import type { CoreDryRunTransport } from "../coreClient/index.js";
import { correlationIdHeader, correlationIdMiddleware } from "./correlation.js";
import { createDiagnosticsRouter } from "./diagnostics.js";
import { createHealthRouter } from "./health.js";

export type CreateAppOptions = {
  config: AppConfig;
  logger: Logger;
  adapters: AdapterRegistry;
  events: GatewayEventEmitter;
  metrics: MetricsRegistry;
  providers?: ProviderRegistry;
  providerHealth?: ProviderHealthTracker;
  catalogue?: ProviderCatalogueSnapshot;
  syncScheduler?: SyncSchedulerPlaceholder;
  sessions?: SessionRegistry;
  credentials?: CredentialStore;
  idempotency?: IdempotencyStore;
  coreClient?: CoreDryRunTransport;
};

type CorrelatedRequest = {
  correlationId?: string;
};

export function createApp({
  config,
  logger,
  events,
  metrics,
  providers,
  providerHealth,
  catalogue,
  syncScheduler,
  sessions,
  credentials,
  idempotency,
  coreClient
}: CreateAppOptions): Express {
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
  app.use(
    createDiagnosticsRouter({
      events,
      metrics,
      providers,
      providerHealth,
      catalogue,
      syncScheduler,
      sessions,
      credentials,
      idempotency,
      coreClient
    })
  );

  return app;
}

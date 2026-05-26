import { Router, type Request, type Response } from "express";
import type { GatewayEventEmitter, GatewayEventQuery, GatewayEventType } from "../events/index.js";
import { gatewayEventTypes } from "../events/index.js";
import type { MetricsRegistry } from "../metrics/index.js";
import type { CallbackType } from "../domain/index.js";
import type { ProviderCatalogueSnapshot } from "../providers/index.js";
import type { ProviderHealthTracker, ProviderRegistry, SyncSchedulerPlaceholder } from "../providers/index.js";
import type { SessionRegistry } from "../sessions/index.js";

export type DiagnosticsDependencies = {
  events: GatewayEventEmitter;
  metrics: MetricsRegistry;
  providers?: ProviderRegistry;
  providerHealth?: ProviderHealthTracker;
  catalogue?: ProviderCatalogueSnapshot;
  syncScheduler?: SyncSchedulerPlaceholder;
  sessions?: SessionRegistry;
};

export function createDiagnosticsRouter({
  events,
  metrics,
  providers,
  providerHealth,
  catalogue,
  syncScheduler,
  sessions
}: DiagnosticsDependencies): Router {
  const router = Router();

  router.get("/diagnostics/events", (req: Request, res: Response) => {
    res.status(200).json({
      developmentOnly: true,
      redacted: true,
      events: events.query(toEventQuery(req.query))
    });
  });

  router.get("/diagnostics/metrics", (_req: Request, res: Response) => {
    res.status(200).json({
      developmentOnly: true,
      metrics: metrics.snapshot()
    });
  });

  router.get("/diagnostics/providers", (_req: Request, res: Response) => {
    res.status(200).json({
      developmentOnly: true,
      providers: providers?.list() ?? [],
      health: providerHealth?.listHealth() ?? [],
      outages: providerHealth?.listOutages() ?? []
    });
  });

  router.get("/diagnostics/catalogue", (_req: Request, res: Response) => {
    res.status(200).json({
      developmentOnly: true,
      catalogue: catalogue ?? null,
      scheduler: syncScheduler ?? null
    });
  });

  router.get("/diagnostics/sessions", (_req: Request, res: Response) => {
    res.status(200).json({
      developmentOnly: true,
      sessions: sessions?.listSessions() ?? [],
      lifecycleEvents: sessions?.listEvents() ?? []
    });
  });

  return router;
}

function toEventQuery(query: Request["query"]): GatewayEventQuery {
  return {
    correlationId: firstQueryValue(query.correlationId),
    callbackType: firstQueryValue(query.callbackType) as CallbackType | undefined,
    eventType: toEventType(firstQueryValue(query.eventType))
  };
}

function toEventType(value: string | undefined): GatewayEventType | undefined {
  return value !== undefined && gatewayEventTypes.includes(value as GatewayEventType)
    ? (value as GatewayEventType)
    : undefined;
}

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

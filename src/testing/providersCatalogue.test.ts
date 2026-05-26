import { describe, expect, it } from "vitest";
import { bitvilleCapabilities } from "../adapters/bitville/index.js";
import { coreClientPlaceholder } from "../coreClient/index.js";
import { createInMemoryGatewayEventEmitter } from "../events/index.js";
import { createDiagnosticsRouter } from "../http/diagnostics.js";
import { createInMemoryMetricsRegistry } from "../metrics/index.js";
import type { ProviderCatalogueSnapshot } from "../providers/index.js";
import {
  bitvilleCatalogueSyncBlocked,
  createCatalogueSyncCoordinator,
  createProviderHealthTracker,
  createProviderRegistry,
  createSyncSchedulerPlaceholder,
  detectStaleCatalogue
} from "../providers/index.js";

describe("provider orchestration and catalogue lifecycle scaffolding", () => {
  it("registers and updates provider lifecycle state", () => {
    const registry = createProviderRegistry();

    registry.register({
      aggregatorName: "bitville",
      providerId: "bitville",
      displayName: "Bitville",
      capabilities: bitvilleCapabilities
    });

    expect(registry.get("bitville")).toMatchObject({
      aggregatorName: "bitville",
      providerId: "bitville",
      state: "registered",
      syncStatus: "never_synced"
    });

    registry.updateSyncStatus("bitville", "sync_blocked");

    expect(registry.list()).toHaveLength(1);
    expect(registry.get("bitville")?.syncStatus).toBe("sync_blocked");
  });

  it("detects stale and missing catalogue snapshots", () => {
    const metrics = createInMemoryMetricsRegistry();
    const freshSnapshot = createSnapshot("2026-05-26T10:00:00.000Z");
    const staleSnapshot = createSnapshot("2026-05-25T10:00:00.000Z");
    const now = new Date("2026-05-26T11:00:00.000Z");

    expect(detectStaleCatalogue(freshSnapshot, { now, thresholdMs: 2 * 60 * 60 * 1000, metrics })).toMatchObject({
      stale: false
    });
    expect(detectStaleCatalogue(staleSnapshot, { now, thresholdMs: 2 * 60 * 60 * 1000, metrics })).toMatchObject({
      stale: true,
      reason: "Catalogue snapshot is older than the allowed threshold."
    });
    expect(detectStaleCatalogue(undefined, { now, thresholdMs: 2 * 60 * 60 * 1000, metrics })).toMatchObject({
      stale: true,
      reason: "No catalogue snapshot is available."
    });
    expect(metrics.snapshot().stale_catalogue_detected).toBe(2);
  });

  it("returns blocked Bitville sync results without external connections", async () => {
    const registry = createProviderRegistry();
    const metrics = createInMemoryMetricsRegistry();
    registry.register({
      aggregatorName: "bitville",
      providerId: "bitville",
      displayName: "Bitville",
      state: "sync_blocked",
      capabilities: bitvilleCapabilities
    });
    const coordinator = createCatalogueSyncCoordinator({
      registry,
      metrics,
      handlers: {
        bitville: bitvilleCatalogueSyncBlocked
      }
    });

    const result = await coordinator.syncCatalogue("bitville");

    expect(result).toMatchObject({
      aggregatorName: "bitville",
      status: "sync_blocked"
    });
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "provider_contract_unresolved",
      "game_ingestion_blocked",
      "live_api_blocked"
    ]);
    expect(registry.get("bitville")?.syncStatus).toBe("sync_blocked");
    expect(metrics.snapshot()).toMatchObject({
      provider_sync_started: 1,
      provider_sync_failed: 1,
      provider_sync_completed: 0
    });
  });

  it("serves provider and catalogue diagnostics routes", () => {
    const providers = createProviderRegistry();
    const metrics = createInMemoryMetricsRegistry();
    const providerHealth = createProviderHealthTracker(providers, metrics);
    const catalogue = createSnapshot("2026-05-26T10:00:00.000Z");
    const syncScheduler = createSyncSchedulerPlaceholder();
    const router = createDiagnosticsRouter({
      events: createInMemoryGatewayEventEmitter(),
      metrics,
      providers,
      providerHealth,
      catalogue,
      syncScheduler
    });

    providers.register({
      aggregatorName: "bitville",
      providerId: "bitville",
      displayName: "Bitville",
      state: "sync_blocked"
    });
    providerHealth.recordHealth({
      providerId: "bitville",
      state: "degraded",
      healthy: false,
      checkedAt: "2026-05-26T11:00:00.000Z",
      reason: "Catalogue sync blocked."
    });

    expect(callRouterGet(router, "/diagnostics/providers")).toMatchObject({
      statusCode: 200,
      body: {
        developmentOnly: true,
        providers: [
          {
            providerId: "bitville",
            state: "degraded"
          }
        ],
        health: [
          {
            providerId: "bitville",
            state: "degraded",
            healthy: false
          }
        ]
      }
    });
    expect(callRouterGet(router, "/diagnostics/catalogue")).toMatchObject({
      statusCode: 200,
      body: {
        developmentOnly: true,
        catalogue: {
          aggregatorName: "bitville",
          providers: []
        },
        scheduler: {
          enabled: false,
          lock: {
            locked: false
          }
        }
      }
    });
    expect(metrics.snapshot().provider_health_degraded).toBe(1);
  });

  it("keeps core execution disconnected", () => {
    expect(coreClientPlaceholder.connected).toBe(false);
  });
});

function createSnapshot(capturedAt: string): ProviderCatalogueSnapshot {
  return {
    aggregatorName: "bitville",
    capturedAt,
    providers: [],
    categories: [],
    games: []
  };
}

function callRouterGet(router: unknown, path: string): { statusCode: number; body: unknown } {
  const layer = (router as { stack: Array<{ route?: { path: string; stack: Array<{ handle: Function }> } }> }).stack.find(
    (candidate) => candidate.route?.path === path
  );
  const response: { statusCode: number; body: unknown; status(code: number): typeof response; json(body: unknown): typeof response } = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    }
  };

  layer?.route?.stack[0]?.handle({ query: {} }, response);
  return response;
}

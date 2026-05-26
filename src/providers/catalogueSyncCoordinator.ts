import type { AggregatorName } from "../domain/index.js";
import type { MetricsRegistry } from "../metrics/index.js";
import type { CatalogueSyncResult } from "./catalogueModels.js";
import type { ProviderRegistry } from "./providerRegistry.js";

export type CatalogueSyncCoordinator = {
  syncCatalogue(aggregatorName: AggregatorName): Promise<CatalogueSyncResult>;
};

export type CatalogueSyncHandler = (aggregatorName: AggregatorName) => Promise<CatalogueSyncResult>;

export function createCatalogueSyncCoordinator(options: {
  registry: ProviderRegistry;
  metrics?: MetricsRegistry;
  handlers?: Partial<Record<AggregatorName, CatalogueSyncHandler>>;
}): CatalogueSyncCoordinator {
  return {
    async syncCatalogue(aggregatorName: AggregatorName): Promise<CatalogueSyncResult> {
      options.metrics?.increment("provider_sync_started");

      const handler = options.handlers?.[aggregatorName] ?? blockedCatalogueSync;
      const result = await handler(aggregatorName);

      if (result.status === "synced") {
        options.metrics?.increment("provider_sync_completed");
      } else {
        options.metrics?.increment("provider_sync_failed");
      }

      for (const provider of options.registry.list().filter((provider) => provider.aggregatorName === aggregatorName)) {
        options.registry.updateSyncStatus(provider.providerId, result.status);
      }

      return result;
    }
  };
}

async function blockedCatalogueSync(aggregatorName: AggregatorName): Promise<CatalogueSyncResult> {
  return {
    aggregatorName,
    status: "sync_blocked",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    issues: [
      {
        severity: "warning",
        code: "live_api_blocked",
        message: "Catalogue sync is blocked in foundation mode; no live API calls are allowed."
      }
    ]
  };
}

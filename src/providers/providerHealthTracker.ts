import type { MetricsRegistry } from "../metrics/index.js";
import type { ProviderHealthStatus, ProviderOutageEvent } from "./lifecycle.js";
import type { ProviderRegistry } from "./providerRegistry.js";

export type ProviderHealthTracker = {
  recordHealth(status: ProviderHealthStatus): ProviderHealthStatus;
  listHealth(): ProviderHealthStatus[];
  listOutages(): ProviderOutageEvent[];
};

export function createProviderHealthTracker(registry: ProviderRegistry, metrics?: MetricsRegistry): ProviderHealthTracker {
  const health = new Map<string, ProviderHealthStatus>();
  const outages: ProviderOutageEvent[] = [];

  return {
    recordHealth(status: ProviderHealthStatus): ProviderHealthStatus {
      health.set(status.providerId, status);
      registry.updateHealth(status);

      if (status.state === "outage") {
        metrics?.increment("provider_outage_detected");
        outages.push({
          providerId: status.providerId,
          detectedAt: status.checkedAt,
          reason: status.reason ?? "Provider outage detected."
        });
      }

      if (status.state === "degraded") {
        metrics?.increment("provider_health_degraded");
      }

      return status;
    },

    listHealth(): ProviderHealthStatus[] {
      return [...health.values()];
    },

    listOutages(): ProviderOutageEvent[] {
      return [...outages];
    }
  };
}

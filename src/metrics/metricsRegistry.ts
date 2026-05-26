import { gatewayMetricNames, type GatewayMetricName, type GatewayMetricsSnapshot } from "./metricsTypes.js";

export type MetricsRegistry = {
  increment(metric: GatewayMetricName, amount?: number): number;
  snapshot(): GatewayMetricsSnapshot;
  clear(): void;
};

export function createInMemoryMetricsRegistry(): MetricsRegistry {
  const counters = Object.fromEntries(gatewayMetricNames.map((metric) => [metric, 0])) as GatewayMetricsSnapshot;

  return {
    increment(metric: GatewayMetricName, amount = 1): number {
      counters[metric] += amount;
      return counters[metric];
    },

    snapshot(): GatewayMetricsSnapshot {
      return { ...counters };
    },

    clear(): void {
      for (const metric of gatewayMetricNames) {
        counters[metric] = 0;
      }
    }
  };
}

import type { MetricsRegistry } from "../metrics/index.js";
import type { ProviderCatalogueSnapshot } from "./catalogueModels.js";

export type StaleCatalogueDetectionResult = {
  stale: boolean;
  ageMs?: number;
  thresholdMs: number;
  reason?: string;
};

export function detectStaleCatalogue(
  snapshot: ProviderCatalogueSnapshot | undefined,
  options: { now?: Date; thresholdMs: number; metrics?: MetricsRegistry }
): StaleCatalogueDetectionResult {
  if (!snapshot) {
    options.metrics?.increment("stale_catalogue_detected");
    return {
      stale: true,
      thresholdMs: options.thresholdMs,
      reason: "No catalogue snapshot is available."
    };
  }

  const now = options.now ?? new Date();
  const capturedAt = new Date(snapshot.capturedAt);
  const ageMs = now.getTime() - capturedAt.getTime();
  const stale = ageMs > options.thresholdMs;

  if (stale) {
    options.metrics?.increment("stale_catalogue_detected");
  }

  return {
    stale,
    ageMs,
    thresholdMs: options.thresholdMs,
    reason: stale ? "Catalogue snapshot is older than the allowed threshold." : undefined
  };
}

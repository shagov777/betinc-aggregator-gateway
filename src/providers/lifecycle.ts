import type { AdapterCapabilityModel } from "../normalization/index.js";

export type ProviderState = "registered" | "sync_blocked" | "available" | "degraded" | "outage" | "disabled";

export type ProviderHealthStatus = {
  providerId: string;
  state: ProviderState;
  healthy: boolean;
  checkedAt: string;
  reason?: string;
};

export type ProviderSyncStatus = "never_synced" | "sync_blocked" | "sync_pending" | "syncing" | "synced" | "failed";

export type ProviderAvailabilityWindow = {
  startsAt: string;
  endsAt?: string;
  reason?: string;
};

export type ProviderOutageEvent = {
  providerId: string;
  detectedAt: string;
  resolvedAt?: string;
  reason: string;
};

export type ProviderCapabilitySnapshot = {
  providerId: string;
  capturedAt: string;
  capabilities: AdapterCapabilityModel;
};

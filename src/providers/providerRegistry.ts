import type { AggregatorName } from "../domain/index.js";
import type { AdapterCapabilityModel } from "../normalization/index.js";
import type { ProviderCapabilitySnapshot, ProviderHealthStatus, ProviderState, ProviderSyncStatus } from "./lifecycle.js";

export type ProviderRegistration = {
  aggregatorName: AggregatorName;
  providerId: string;
  displayName: string;
  state: ProviderState;
  syncStatus: ProviderSyncStatus;
  capabilitySnapshot?: ProviderCapabilitySnapshot;
};

export type ProviderRegistry = {
  register(input: {
    aggregatorName: AggregatorName;
    providerId: string;
    displayName: string;
    state?: ProviderState;
    syncStatus?: ProviderSyncStatus;
    capabilities?: AdapterCapabilityModel;
  }): ProviderRegistration;
  get(providerId: string): ProviderRegistration | undefined;
  list(): ProviderRegistration[];
  updateHealth(status: ProviderHealthStatus): ProviderRegistration | undefined;
  updateSyncStatus(providerId: string, syncStatus: ProviderSyncStatus): ProviderRegistration | undefined;
};

export function createProviderRegistry(): ProviderRegistry {
  const registrations = new Map<string, ProviderRegistration>();

  return {
    register(input): ProviderRegistration {
      const registration: ProviderRegistration = {
        aggregatorName: input.aggregatorName,
        providerId: input.providerId,
        displayName: input.displayName,
        state: input.state ?? "registered",
        syncStatus: input.syncStatus ?? "never_synced",
        capabilitySnapshot: input.capabilities
          ? {
              providerId: input.providerId,
              capturedAt: new Date().toISOString(),
              capabilities: input.capabilities
            }
          : undefined
      };

      registrations.set(input.providerId, registration);
      return registration;
    },

    get(providerId: string): ProviderRegistration | undefined {
      return registrations.get(providerId);
    },

    list(): ProviderRegistration[] {
      return [...registrations.values()];
    },

    updateHealth(status: ProviderHealthStatus): ProviderRegistration | undefined {
      const existing = registrations.get(status.providerId);

      if (!existing) {
        return undefined;
      }

      const updated = {
        ...existing,
        state: status.state
      };
      registrations.set(status.providerId, updated);
      return updated;
    },

    updateSyncStatus(providerId: string, syncStatus: ProviderSyncStatus): ProviderRegistration | undefined {
      const existing = registrations.get(providerId);

      if (!existing) {
        return undefined;
      }

      const updated = {
        ...existing,
        syncStatus
      };
      registrations.set(providerId, updated);
      return updated;
    }
  };
}

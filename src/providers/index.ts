export type {
  ProviderAvailabilityWindow,
  ProviderCapabilitySnapshot,
  ProviderHealthStatus,
  ProviderOutageEvent,
  ProviderState,
  ProviderSyncStatus
} from "./lifecycle.js";
export type {
  AggregatorProvider,
  CatalogueSyncIssue,
  CatalogueSyncResult,
  ProviderCatalogueSnapshot,
  ProviderGame,
  ProviderGameCategory
} from "./catalogueModels.js";
export { createProviderRegistry, type ProviderRegistration, type ProviderRegistry } from "./providerRegistry.js";
export { createProviderHealthTracker, type ProviderHealthTracker } from "./providerHealthTracker.js";
export { createCatalogueSyncCoordinator, type CatalogueSyncCoordinator, type CatalogueSyncHandler } from "./catalogueSyncCoordinator.js";
export { detectStaleCatalogue, type StaleCatalogueDetectionResult } from "./staleCatalogueDetector.js";
export {
  createSyncSchedulerPlaceholder,
  type DeadLetteredSync,
  type SyncLock,
  type SyncRetryState,
  type SyncSchedulerPlaceholder
} from "./scheduler.js";
export { bitvilleCatalogueSyncBlocked } from "./bitvilleCatalogue.js";

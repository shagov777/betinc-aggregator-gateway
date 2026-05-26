import { loadConfig } from "./config/env.js";
import { createLogger } from "./logging/logger.js";
import { createApp } from "./http/server.js";
import { createAdapterRegistry } from "./adapters/registry.js";
import { createInMemoryGatewayEventEmitter } from "./events/index.js";
import { createInMemoryMetricsRegistry } from "./metrics/index.js";
import { bitvilleCapabilities, createBitvilleSandboxClient } from "./adapters/bitville/index.js";
import { createProviderHealthTracker, createProviderRegistry, createSyncSchedulerPlaceholder } from "./providers/index.js";
import { createInMemorySessionRegistry } from "./sessions/index.js";
import { createInMemoryCredentialStore } from "./security/index.js";
import { createInMemoryIdempotencyStore } from "./idempotency/index.js";
import { createCoreDryRunTransport } from "./coreClient/index.js";
import { createFilesystemRawCallbackArchive } from "./archive/filesystemArchive.js";
import { createInMemoryQuarantineStore } from "./pipeline/index.js";
import { createSimulatorRunner } from "./simulator/index.js";

const config = loadConfig();
const logger = createLogger(config);
const adapters = createAdapterRegistry();
const events = createInMemoryGatewayEventEmitter();
const metrics = createInMemoryMetricsRegistry();
const providers = createProviderRegistry();
providers.register({
  aggregatorName: "bitville",
  providerId: "bitville",
  displayName: "Bitville",
  state: "sync_blocked",
  syncStatus: "sync_blocked",
  capabilities: bitvilleCapabilities
});
const providerHealth = createProviderHealthTracker(providers, metrics);
const syncScheduler = createSyncSchedulerPlaceholder();
const sessions = createInMemorySessionRegistry(metrics);
const credentials = createInMemoryCredentialStore();
const idempotency = createInMemoryIdempotencyStore(metrics);
const coreClient = createCoreDryRunTransport(metrics);
const bitville = createBitvilleSandboxClient({ metrics });
const archive = createFilesystemRawCallbackArchive();
const quarantine = createInMemoryQuarantineStore();
const simulator = createSimulatorRunner({ archive, events, metrics, idempotency, bitville, coreClient, quarantine });
const app = createApp({
  config,
  logger,
  adapters,
  events,
  metrics,
  providers,
  providerHealth,
  syncScheduler,
  sessions,
  credentials,
  idempotency,
  coreClient,
  bitville,
  simulator
});

app.listen(config.port, () => {
  logger.info({ port: config.port }, "aggregator gateway listening");
});

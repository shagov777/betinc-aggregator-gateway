import { loadConfig } from "./config/env.js";
import { createLogger } from "./logging/logger.js";
import { createApp } from "./http/server.js";
import { createAdapterRegistry } from "./adapters/registry.js";
import { createInMemoryGatewayEventEmitter } from "./events/index.js";
import { createInMemoryMetricsRegistry } from "./metrics/index.js";

const config = loadConfig();
const logger = createLogger(config);
const adapters = createAdapterRegistry();
const events = createInMemoryGatewayEventEmitter();
const metrics = createInMemoryMetricsRegistry();
const app = createApp({ config, logger, adapters, events, metrics });

app.listen(config.port, () => {
  logger.info({ port: config.port }, "aggregator gateway listening");
});

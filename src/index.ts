import { loadConfig } from "./config/env.js";
import { createLogger } from "./logging/logger.js";
import { createApp } from "./http/server.js";
import { createAdapterRegistry } from "./adapters/registry.js";

const config = loadConfig();
const logger = createLogger(config);
const adapters = createAdapterRegistry();
const app = createApp({ config, logger, adapters });

app.listen(config.port, () => {
  logger.info({ port: config.port }, "aggregator gateway listening");
});

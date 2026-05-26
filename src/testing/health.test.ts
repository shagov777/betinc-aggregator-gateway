import { describe, expect, it } from "vitest";
import { loadConfig } from "../config/env.js";
import { createAdapterRegistry } from "../adapters/registry.js";

describe("service foundation", () => {
  it("loads default testable configuration", () => {
    const config = loadConfig({});

    expect(config.serviceName).toBe("betinc-aggregator-gateway");
    expect(config.port).toBe(3000);
  });

  it("registers Bitville as a placeholder adapter only", () => {
    const registry = createAdapterRegistry();

    expect(registry.get("bitville")).toEqual({
      name: "bitville",
      status: "placeholder"
    });
  });
});

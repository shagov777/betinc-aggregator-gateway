import { describe, expect, it } from "vitest";
import { loadConfig } from "../config/env.js";
import { createAdapterRegistry } from "../adapters/registry.js";
import { coreClientPlaceholder } from "../coreClient/index.js";
import { gatewayProcessingStates } from "../domain/index.js";
import type { DocumentationDerivedFixture } from "./simulators/index.js";
import balanceFixture from "./simulators/fixtures/balance.json" with { type: "json" };
import cancelFixture from "./simulators/fixtures/cancel.json" with { type: "json" };
import creditFixture from "./simulators/fixtures/credit.json" with { type: "json" };
import debitFixture from "./simulators/fixtures/debit.json" with { type: "json" };

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

  it("exports gateway processing states", () => {
    expect(gatewayProcessingStates).toContain("received");
    expect(gatewayProcessingStates).toContain("normalization_blocked");
    expect(gatewayProcessingStates).toContain("core_not_connected");
    expect(gatewayProcessingStates).toContain("reconciliation_required");
  });

  it("loads simulator fixtures as static JSON only", () => {
    const fixtures = [balanceFixture, debitFixture, creditFixture, cancelFixture] as DocumentationDerivedFixture[];

    expect(fixtures.map((fixture) => fixture.rawBitvilleOperation)).toEqual(["balance", "debit", "credit", "cancel"]);

    for (const fixture of fixtures) {
      expect(fixture._fixtureNotice).toContain("not production Bitville contract truth");
      expect(fixture.rawPayload).toEqual({});
      expect(fixture.rawHeaders).toEqual({});
      expect(fixture.openQuestions.length).toBeGreaterThan(0);
    }
  });

  it("does not connect a core client", () => {
    expect(coreClientPlaceholder).toEqual({
      status: "not-connected",
      connected: false
    });
  });
});

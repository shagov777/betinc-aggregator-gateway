import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createBitvilleSandboxClient } from "../adapters/bitville/index.js";
import { createFilesystemRawCallbackArchive } from "../archive/filesystemArchive.js";
import { coreClientPlaceholder, createCoreDryRunTransport } from "../coreClient/index.js";
import { createInMemoryGatewayEventEmitter } from "../events/index.js";
import { createDiagnosticsRouter } from "../http/diagnostics.js";
import { createInMemoryIdempotencyStore } from "../idempotency/index.js";
import { createInMemoryMetricsRegistry } from "../metrics/index.js";
import { createInMemoryQuarantineStore } from "../pipeline/index.js";
import { createSimulatorRunner, type SimulatorRunner } from "../simulator/index.js";

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("local simulator orchestration scaffolding", () => {
  it("runs happy-path launch dry-run without external execution", async () => {
    const { simulator, bitville, metrics } = await createHarness();

    const result = await simulator.executeScenario("happy_path_launch");

    expect(result).toMatchObject({
      scenario: "happy_path_launch",
      externalExecution: false,
      walletMutation: false,
      outcome: "blocked"
    });
    expect(bitville.diagnostics().requests).toMatchObject([
      {
        endpoint: "/api/token",
        correlationId: "sim-happy-launch",
        status: "blocked"
      }
    ]);
    expect(metrics.snapshot()).toMatchObject({
      simulator_run_started: 1,
      simulator_run_completed: 1
    });
  });

  it("handles duplicate callback simulation", async () => {
    const { simulator, metrics } = await createHarness();

    const result = await simulator.executeScenario("duplicate_callback");

    expect(result).toMatchObject({
      scenario: "duplicate_callback",
      outcome: "quarantined"
    });
    expect(metrics.snapshot()).toMatchObject({
      duplicate_detected: 1,
      simulator_duplicate_detected: 1
    });
  });

  it("handles timeout then retry simulation", async () => {
    const { simulator, metrics, bitville } = await createHarness();

    const result = await simulator.executeScenario("timeout_then_retry");

    expect(result).toMatchObject({
      scenario: "timeout_then_retry",
      outcome: "blocked"
    });
    expect(bitville.diagnostics().requests[0]).toMatchObject({
      endpoint: "/providers",
      status: "retry_simulated"
    });
    expect(metrics.snapshot()).toMatchObject({
      bitville_timeout_simulated: 1,
      bitville_retry_simulated: 1,
      simulator_timeout_executed: 1
    });
  });

  it("handles replay attack simulation through dry-run replay plan", async () => {
    const { simulator } = await createHarness();

    const result = await simulator.executeScenario("replay_attack");

    expect(result).toMatchObject({
      scenario: "replay_attack",
      outcome: "investigate",
      steps: [
        {
          name: "replay_plan_created",
          outcome: "investigate"
        }
      ]
    });
  });

  it("handles out-of-order callbacks without financial execution", async () => {
    const { simulator, metrics } = await createHarness();

    const result = await simulator.executeScenario("out_of_order_callbacks");

    expect(result).toMatchObject({
      scenario: "out_of_order_callbacks",
      outcome: "blocked",
      walletMutation: false
    });
    expect(metrics.snapshot()).toMatchObject({
      archive_success: 2,
      normalization_blocked: 2
    });
  });

  it("handles normalization blocked path", async () => {
    const { simulator, metrics } = await createHarness();

    const result = await simulator.executeScenario("normalization_blocked");

    expect(result).toMatchObject({
      scenario: "normalization_blocked",
      outcome: "blocked"
    });
    expect(metrics.snapshot().normalization_blocked).toBe(1);
  });

  it("handles uncertain core state path", async () => {
    const { simulator, metrics, coreClient } = await createHarness();

    const result = await simulator.executeScenario("uncertain_core_state");

    expect(result).toMatchObject({
      scenario: "uncertain_core_state",
      outcome: "investigate"
    });
    expect(coreClient.listDrifts()).toHaveLength(1);
    expect(metrics.snapshot()).toMatchObject({
      core_uncertain_state: 1,
      reconciliation_drift_detected: 1
    });
  });

  it("serves simulator diagnostics route", async () => {
    const { simulator, metrics } = await createHarness();
    await simulator.executeScenario("provider_degraded");
    const router = createDiagnosticsRouter({
      events: createInMemoryGatewayEventEmitter(),
      metrics,
      simulator
    });

    expect(callRouterGet(router, "/diagnostics/simulator")).toMatchObject({
      statusCode: 200,
      body: {
        developmentOnly: true,
        simulator: {
          runs: [
            {
              scenario: "provider_degraded",
              externalExecution: false,
              walletMutation: false
            }
          ]
        }
      }
    });
  });

  it("does not mutate wallets or execute externally", async () => {
    const { simulator, bitville, coreClient } = await createHarness();

    const result = await simulator.executeFailureSimulation("uncertain_core");

    expect(result.externalExecution).toBe(false);
    expect(result.walletMutation).toBe(false);
    expect(bitville.liveHttpEnabled).toBe(false);
    expect(coreClient.connected).toBe(false);
    expect(coreClientPlaceholder.connected).toBe(false);
  });

  it("executes replay wrapper in dry-run mode", async () => {
    const { simulator, metrics } = await createHarness();

    const result = await simulator.executeReplay("dry_run");

    expect(result).toMatchObject({
      scenario: "normalization_blocked",
      externalExecution: false,
      walletMutation: false
    });
    expect(metrics.snapshot().simulator_replay_executed).toBe(1);
  });
});

async function createHarness() {
  const directory = await mkdtemp(join(tmpdir(), "gateway-simulator-"));
  tempDirectories.push(directory);
  const metrics = createInMemoryMetricsRegistry();
  const archive = createFilesystemRawCallbackArchive({ directory });
  const events = createInMemoryGatewayEventEmitter();
  const idempotency = createInMemoryIdempotencyStore(metrics);
  const bitville = createBitvilleSandboxClient({ metrics });
  const coreClient = createCoreDryRunTransport(metrics);
  const quarantine = createInMemoryQuarantineStore();
  const simulator: SimulatorRunner = createSimulatorRunner({
    archive,
    events,
    metrics,
    idempotency,
    bitville,
    coreClient,
    quarantine
  });

  return {
    simulator,
    metrics,
    bitville,
    coreClient
  };
}

function callRouterGet(router: unknown, path: string): { statusCode: number; body: unknown } {
  const layer = (router as { stack: Array<{ route?: { path: string; stack: Array<{ handle: Function }> } }> }).stack.find(
    (candidate) => candidate.route?.path === path
  );
  const response: { statusCode: number; body: unknown; status(code: number): typeof response; json(body: unknown): typeof response } = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    }
  };

  layer?.route?.stack[0]?.handle({ query: {} }, response);
  return response;
}

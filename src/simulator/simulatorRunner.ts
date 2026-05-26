import type { BitvilleSandboxClient } from "../adapters/bitville/index.js";
import type { RawCallbackArchive } from "../archive/archiveTypes.js";
import type { CoreDryRunTransport } from "../coreClient/index.js";
import type { RawCallbackEnvelope } from "../domain/index.js";
import type { GatewayEventEmitter } from "../events/index.js";
import type { IdempotencyStore } from "../idempotency/index.js";
import type { MetricsRegistry } from "../metrics/index.js";
import { createInMemoryQuarantineStore, processRawCallbackDryRun, type QuarantineStore } from "../pipeline/index.js";
import { createReplayService } from "../replay/replayService.js";
import type {
  SimulatorEvent,
  SimulatorExecutionResult,
  SimulatorFailureMode,
  SimulatorOutcome,
  SimulatorReplayMode,
  SimulatorScenario,
  SimulatorStep
} from "./simulatorTypes.js";

export type SimulatorDependencies = {
  archive: RawCallbackArchive;
  events: GatewayEventEmitter;
  metrics: MetricsRegistry;
  idempotency: IdempotencyStore;
  bitville: BitvilleSandboxClient;
  coreClient: CoreDryRunTransport;
  quarantine?: QuarantineStore;
};

export type SimulatorRunner = {
  executeScenario(scenario: SimulatorScenario): Promise<SimulatorExecutionResult>;
  executeReplay(mode: SimulatorReplayMode): Promise<SimulatorExecutionResult>;
  executeFailureSimulation(mode: SimulatorFailureMode): Promise<SimulatorExecutionResult>;
  diagnostics(): { runs: SimulatorExecutionResult[] };
};

export function createSimulatorRunner(dependencies: SimulatorDependencies): SimulatorRunner {
  const runs: SimulatorExecutionResult[] = [];
  const quarantine = dependencies.quarantine ?? createInMemoryQuarantineStore();

  return {
    async executeScenario(scenario: SimulatorScenario): Promise<SimulatorExecutionResult> {
      dependencies.metrics.increment("simulator_run_started");
      const result = await executeScenarioInternal(scenario, { ...dependencies, quarantine });
      dependencies.metrics.increment("simulator_run_completed");
      runs.push(result);
      return result;
    },

    async executeReplay(mode: SimulatorReplayMode): Promise<SimulatorExecutionResult> {
      dependencies.metrics.increment("simulator_replay_executed");
      return this.executeScenario(mode === "dry_run" ? "normalization_blocked" : "replay_attack");
    },

    async executeFailureSimulation(mode: SimulatorFailureMode): Promise<SimulatorExecutionResult> {
      dependencies.metrics.increment("simulator_failure_simulated");
      const scenario = failureModeToScenario(mode);
      return this.executeScenario(scenario);
    },

    diagnostics() {
      return {
        runs: [...runs]
      };
    }
  };
}

async function executeScenarioInternal(
  scenario: SimulatorScenario,
  dependencies: Required<SimulatorDependencies>
): Promise<SimulatorExecutionResult> {
  switch (scenario) {
    case "happy_path_launch":
      return happyPathLaunch(dependencies);
    case "duplicate_callback":
      return duplicateCallback(dependencies);
    case "timeout_then_retry":
      return timeoutThenRetry(dependencies);
    case "out_of_order_callbacks":
      return outOfOrderCallbacks(dependencies);
    case "replay_attack":
      return replayAttack(dependencies);
    case "stale_callback":
      return staleCallback(dependencies);
    case "provider_degraded":
      return providerDegraded(dependencies);
    case "normalization_blocked":
      return normalizationBlocked(dependencies);
    case "uncertain_core_state":
      return uncertainCoreState(dependencies);
  }
}

async function happyPathLaunch(dependencies: Required<SimulatorDependencies>): Promise<SimulatorExecutionResult> {
  const request = dependencies.bitville.buildTokenRequest({
    correlationId: "sim-happy-launch",
    provider: "documentation-derived-provider",
    game: "documentation-derived-game",
    demoMode: true,
    demoOverlay: false
  });

  return result("happy_path_launch", "blocked", [
    step("bitville_launch_request_built", "blocked", request),
    step("external_execution_skipped", "blocked", { liveHttpEnabled: dependencies.bitville.liveHttpEnabled })
  ]);
}

async function duplicateCallback(dependencies: Required<SimulatorDependencies>): Promise<SimulatorExecutionResult> {
  dependencies.idempotency.createRecord(idempotencyInput("sim-duplicate", "external-duplicate", { amount: "10.00" }));
  const duplicate = dependencies.idempotency.detectDuplicate(
    idempotencyInput("sim-duplicate", "external-duplicate", { amount: "10.00" })
  );
  dependencies.metrics.increment("simulator_duplicate_detected");

  return result("duplicate_callback", "quarantined", [step("duplicate_detected", "quarantined", duplicate)]);
}

async function timeoutThenRetry(dependencies: Required<SimulatorDependencies>): Promise<SimulatorExecutionResult> {
  const request = dependencies.bitville.buildProvidersRequest("sim-timeout");
  dependencies.bitville.simulateTimeout(request.id);
  dependencies.bitville.simulateRetry(request.id);
  dependencies.metrics.increment("simulator_timeout_executed");

  return result("timeout_then_retry", "blocked", [step("timeout_simulated", "blocked", dependencies.bitville.diagnostics())]);
}

async function outOfOrderCallbacks(dependencies: Required<SimulatorDependencies>): Promise<SimulatorExecutionResult> {
  const credit = await processRawCallbackDryRun(envelope("credit", "sim-out-of-order-credit"), dependencies);
  const debit = await processRawCallbackDryRun(envelope("debit", "sim-out-of-order-debit"), dependencies);

  return result("out_of_order_callbacks", "blocked", [
    step("credit_processed_before_debit", "blocked", credit.status),
    step("debit_processed_after_credit", "blocked", debit.status)
  ]);
}

async function replayAttack(dependencies: Required<SimulatorDependencies>): Promise<SimulatorExecutionResult> {
  const archived = await dependencies.archive.archiveRawCallback(envelope("debit", "sim-replay-attack"));
  const replay = await createReplayService(dependencies.archive).createDryRunReplayPlan(archived.id);

  return result("replay_attack", "investigate", [step("replay_plan_created", "investigate", replay)]);
}

async function staleCallback(dependencies: Required<SimulatorDependencies>): Promise<SimulatorExecutionResult> {
  const stale = await processRawCallbackDryRun(
    {
      ...envelope("debit", "sim-stale"),
      receivedAt: "2000-01-01T00:00:00.000Z"
    },
    dependencies
  );

  return result("stale_callback", "blocked", [step("stale_callback_archived_only", "blocked", stale.status)]);
}

async function providerDegraded(dependencies: Required<SimulatorDependencies>): Promise<SimulatorExecutionResult> {
  dependencies.bitville.markProviderDegraded("simulated provider degradation");

  return result("provider_degraded", "blocked", [step("provider_degraded", "blocked", dependencies.bitville.diagnostics())]);
}

async function normalizationBlocked(dependencies: Required<SimulatorDependencies>): Promise<SimulatorExecutionResult> {
  const pipeline = await processRawCallbackDryRun(envelope("debit", "sim-normalization-blocked"), dependencies);

  return result("normalization_blocked", "blocked", [step("normalization_blocked", "blocked", pipeline.status)]);
}

async function uncertainCoreState(dependencies: Required<SimulatorDependencies>): Promise<SimulatorExecutionResult> {
  const command = dependencies.coreClient.createCommand(
    "wallet.debit",
    {
      amount: {
        rawAmount: "10.00",
        unresolvedReason: "Simulator amount is documentation-only."
      },
      correlation: {
        correlationId: "sim-core-uncertain"
      }
    },
    { correlationId: "sim-core-uncertain" }
  );
  const core = dependencies.coreClient.executeDryRun(command, "uncertain");

  return result("uncertain_core_state", "investigate", [step("core_uncertain_state", "investigate", core)]);
}

function failureModeToScenario(mode: SimulatorFailureMode): SimulatorScenario {
  const mapping: Record<SimulatorFailureMode, SimulatorScenario> = {
    timeout: "timeout_then_retry",
    duplicate: "duplicate_callback",
    replay_attack: "replay_attack",
    stale: "stale_callback",
    provider_degraded: "provider_degraded",
    uncertain_core: "uncertain_core_state"
  };

  return mapping[mode];
}

function envelope(callbackType: RawCallbackEnvelope["callbackType"], correlationId: string): RawCallbackEnvelope {
  return {
    aggregatorName: "bitville",
    callbackType,
    correlationId,
    receivedAt: "2026-05-26T00:00:00.000Z",
    method: "POST",
    path: "/simulator/bitville/callback",
    headers: {},
    rawBody: {}
  };
}

function idempotencyInput(correlationId: string, externalReference: string, rawPayload: unknown) {
  return {
    aggregatorName: "bitville" as const,
    callbackType: "debit" as const,
    correlationId,
    externalReference,
    rawPayload
  };
}

function step(name: string, outcome: SimulatorOutcome, details?: unknown): SimulatorStep {
  return { name, outcome, details };
}

function event(type: string, message: string, details?: unknown): SimulatorEvent {
  return {
    type,
    timestamp: new Date().toISOString(),
    message,
    details
  };
}

function result(scenario: SimulatorScenario, outcome: SimulatorOutcome, steps: SimulatorStep[]): SimulatorExecutionResult {
  return {
    scenario,
    outcome,
    externalExecution: false,
    walletMutation: false,
    steps,
    events: [event("simulator.scenario.completed", `${scenario} completed in dry-run mode.`)]
  };
}

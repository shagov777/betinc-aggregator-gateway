import { randomUUID } from "node:crypto";
import type { MetricsRegistry } from "../metrics/index.js";
import type { CoreCommandPayload } from "./commandDtos.js";
import type { CoreCommand, CoreCommandType, CoreCorrelationContext, CoreExecutionResult } from "./coreTypes.js";
import type { GatewayCoreDrift } from "./reconciliationTypes.js";

export type CoreDryRunSimulation = "blocked" | "accepted" | "rejected" | "timeout" | "uncertain";

export type CoreDryRunTransport = {
  createCommand<TPayload extends CoreCommandPayload>(
    type: CoreCommandType,
    payload: TPayload,
    correlation: CoreCorrelationContext
  ): CoreCommand<TPayload>;
  executeDryRun(command: CoreCommand, simulation?: CoreDryRunSimulation): CoreExecutionResult;
  listCommands(): CoreCommand[];
  listResults(): CoreExecutionResult[];
  listDrifts(): GatewayCoreDrift[];
  connected: false;
};

export function createCoreDryRunTransport(metrics?: MetricsRegistry): CoreDryRunTransport {
  const commands: CoreCommand[] = [];
  const results: CoreExecutionResult[] = [];
  const drifts: GatewayCoreDrift[] = [];

  return {
    connected: false,

    createCommand<TPayload extends CoreCommandPayload>(
      type: CoreCommandType,
      payload: TPayload,
      correlation: CoreCorrelationContext
    ): CoreCommand<TPayload> {
      const command: CoreCommand<TPayload> = {
        id: randomUUID(),
        type,
        status: "created",
        correlation,
        payload,
        createdAt: new Date().toISOString()
      };

      commands.push(command);
      metrics?.increment("core_command_created");
      return command;
    },

    executeDryRun(command: CoreCommand, simulation: CoreDryRunSimulation = "blocked"): CoreExecutionResult {
      const result = simulate(command, simulation, metrics, drifts);
      results.push(result);
      return result;
    },

    listCommands(): CoreCommand[] {
      return [...commands];
    },

    listResults(): CoreExecutionResult[] {
      return [...results];
    },

    listDrifts(): GatewayCoreDrift[] {
      return [...drifts];
    }
  };
}

function simulate(
  command: CoreCommand,
  simulation: CoreDryRunSimulation,
  metrics: MetricsRegistry | undefined,
  drifts: GatewayCoreDrift[]
): CoreExecutionResult {
  if (simulation === "accepted") {
    return {
      status: "accepted",
      command: { ...command, status: "accepted" },
      coreReferenceId: `dry-run-core-${command.id}`,
      retry: "retry_prohibited"
    };
  }

  if (simulation === "rejected") {
    return {
      status: "rejected",
      command: { ...command, status: "rejected" },
      failure: {
        status: "rejected",
        reason: "Dry-run rejection simulation.",
        retry: "retry_allowed"
      }
    };
  }

  if (simulation === "timeout") {
    metrics?.increment("core_timeout_simulated");
    metrics?.increment("core_uncertain_state");
    return {
      status: "timeout",
      command: { ...command, status: "timeout" },
      timeout: {
        status: "timeout",
        reason: "Dry-run timeout simulation; execution state is uncertain.",
        retry: "retry_prohibited",
        uncertainExecutionState: true
      }
    };
  }

  if (simulation === "uncertain") {
    metrics?.increment("core_uncertain_state");
    metrics?.increment("compensating_action_required");
    metrics?.increment("reconciliation_drift_detected");
    drifts.push({
      id: randomUUID(),
      severity: "high",
      status: "open",
      detectedAt: new Date().toISOString(),
      correlationId: command.correlation.correlationId,
      reason: "Dry-run uncertain core state requires reconciliation before any retry."
    });

    return {
      status: "uncertain",
      command: { ...command, status: "uncertain" },
      retry: "retry_prohibited",
      compensatingAction: {
        required: true,
        reason: "Compensating action placeholder; no financial action is executed.",
        referenceId: `dry-run-compensation-${command.id}`
      }
    };
  }

  metrics?.increment("core_command_blocked");
  return {
    status: "blocked",
    command: { ...command, status: "blocked" },
    reason: "Core transport is dry-run only; no HTTP call or financial mutation executed.",
    retry: "retry_prohibited"
  };
}

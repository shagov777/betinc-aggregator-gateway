import { describe, expect, it } from "vitest";
import {
  coreClientPlaceholder,
  createCoreDryRunTransport,
  type WalletDebitRequest
} from "../coreClient/index.js";
import { createInMemoryGatewayEventEmitter } from "../events/index.js";
import { createDiagnosticsRouter } from "../http/diagnostics.js";
import { createInMemoryMetricsRegistry } from "../metrics/index.js";

describe("core-client contract scaffolding", () => {
  it("creates dry-run core commands", () => {
    const metrics = createInMemoryMetricsRegistry();
    const coreClient = createCoreDryRunTransport(metrics);
    const payload = createDebitRequest("corr-core-create");
    const command = coreClient.createCommand("wallet.debit", payload, payload.correlation);

    expect(command).toMatchObject({
      type: "wallet.debit",
      status: "created",
      correlation: {
        correlationId: "corr-core-create"
      },
      payload
    });
    expect(coreClient.connected).toBe(false);
    expect(metrics.snapshot().core_command_created).toBe(1);
  });

  it("simulates timeout without allowing retry", () => {
    const metrics = createInMemoryMetricsRegistry();
    const coreClient = createCoreDryRunTransport(metrics);
    const payload = createDebitRequest("corr-core-timeout");
    const command = coreClient.createCommand("wallet.debit", payload, payload.correlation);

    expect(coreClient.executeDryRun(command, "timeout")).toMatchObject({
      status: "timeout",
      command: {
        status: "timeout",
        correlation: {
          correlationId: "corr-core-timeout"
        }
      },
      timeout: {
        retry: "retry_prohibited",
        uncertainExecutionState: true
      }
    });
    expect(metrics.snapshot()).toMatchObject({
      core_timeout_simulated: 1,
      core_uncertain_state: 1
    });
  });

  it("simulates uncertain execution state with reconciliation drift", () => {
    const metrics = createInMemoryMetricsRegistry();
    const coreClient = createCoreDryRunTransport(metrics);
    const payload = createDebitRequest("corr-core-uncertain");
    const command = coreClient.createCommand("wallet.debit", payload, payload.correlation);

    expect(coreClient.executeDryRun(command, "uncertain")).toMatchObject({
      status: "uncertain",
      retry: "retry_prohibited",
      compensatingAction: {
        required: true
      }
    });
    expect(coreClient.listDrifts()).toMatchObject([
      {
        severity: "high",
        status: "open",
        correlationId: "corr-core-uncertain"
      }
    ]);
    expect(metrics.snapshot()).toMatchObject({
      core_uncertain_state: 1,
      reconciliation_drift_detected: 1,
      compensating_action_required: 1
    });
  });

  it("preserves correlation IDs for accepted and rejected simulations", () => {
    const coreClient = createCoreDryRunTransport();
    const acceptedPayload = createDebitRequest("corr-core-accepted");
    const rejectedPayload = createDebitRequest("corr-core-rejected");
    const accepted = coreClient.createCommand("wallet.debit", acceptedPayload, acceptedPayload.correlation);
    const rejected = coreClient.createCommand("wallet.debit", rejectedPayload, rejectedPayload.correlation);

    expect(coreClient.executeDryRun(accepted, "accepted")).toMatchObject({
      status: "accepted",
      command: {
        correlation: {
          correlationId: "corr-core-accepted"
        }
      },
      retry: "retry_prohibited"
    });
    expect(coreClient.executeDryRun(rejected, "rejected")).toMatchObject({
      status: "rejected",
      command: {
        correlation: {
          correlationId: "corr-core-rejected"
        }
      },
      failure: {
        retry: "retry_allowed"
      }
    });
  });

  it("serves core-client diagnostics route", () => {
    const metrics = createInMemoryMetricsRegistry();
    const coreClient = createCoreDryRunTransport(metrics);
    const payload = createDebitRequest("corr-core-diagnostics");
    const command = coreClient.createCommand("wallet.debit", payload, payload.correlation);
    coreClient.executeDryRun(command);
    const router = createDiagnosticsRouter({
      events: createInMemoryGatewayEventEmitter(),
      metrics,
      coreClient
    });

    expect(callRouterGet(router, "/diagnostics/core-client")).toMatchObject({
      statusCode: 200,
      body: {
        developmentOnly: true,
        connected: false,
        commands: [
          {
            id: command.id,
            status: "created",
            correlation: {
              correlationId: "corr-core-diagnostics"
            }
          }
        ],
        results: [
          {
            status: "blocked",
            retry: "retry_prohibited"
          }
        ],
        drifts: []
      }
    });
    expect(metrics.snapshot().core_command_blocked).toBe(1);
  });

  it("does not connect to core or mutate finances", () => {
    const coreClient = createCoreDryRunTransport();
    const payload = createDebitRequest("corr-core-no-mutation");
    const command = coreClient.createCommand("wallet.debit", payload, payload.correlation);
    const result = coreClient.executeDryRun(command);

    expect(coreClientPlaceholder.connected).toBe(false);
    expect(coreClient.connected).toBe(false);
    expect(result).toMatchObject({
      status: "blocked",
      reason: "Core transport is dry-run only; no HTTP call or financial mutation executed."
    });
  });
});

function createDebitRequest(correlationId: string): WalletDebitRequest {
  return {
    playerId: "player-placeholder",
    walletId: "wallet-placeholder",
    amount: {
      rawAmount: "10.00",
      rawCurrency: "ZAR",
      unresolvedReason: "Provider amount semantics are unresolved."
    },
    transactionReference: "external-placeholder",
    correlation: {
      correlationId,
      externalReference: "external-placeholder"
    }
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

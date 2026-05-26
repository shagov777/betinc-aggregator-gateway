import { describe, expect, it } from "vitest";
import { coreClientPlaceholder } from "../coreClient/index.js";
import {
  archiveCompletedEvent,
  normalizationBlockedEvent,
  replayBlockedEvent,
  replayRequestedEvent,
  securityValidationFailedEvent
} from "../events/examples.js";
import { createInMemoryGatewayEventEmitter } from "../events/index.js";
import { createDiagnosticsRouter } from "../http/diagnostics.js";
import { createInMemoryMetricsRegistry } from "../metrics/index.js";

describe("observability and diagnostics foundation", () => {
  it("appends and queries gateway events", () => {
    const events = createInMemoryGatewayEventEmitter();

    const emitted = events.emit(archiveCompletedEvent("corr-events", "debit", "archive-1"));
    events.emit(replayRequestedEvent("corr-other", "credit", "archive-2"));
    events.emit(normalizationBlockedEvent("corr-events", "debit", "open-question"));

    expect(emitted.timestamp).toEqual(expect.any(String));
    expect(events.query({ correlationId: "corr-events" })).toHaveLength(2);
    expect(events.query({ callbackType: "credit" })).toHaveLength(1);
    expect(events.query({ eventType: "archive.completed" })).toEqual([emitted]);
    expect(events.timeline("corr-events").events.map((event) => event.eventType)).toEqual([
      "archive.completed",
      "normalization.blocked"
    ]);
  });

  it("increments metrics counters", () => {
    const metrics = createInMemoryMetricsRegistry();

    expect(metrics.increment("callbacks_received")).toBe(1);
    expect(metrics.increment("callbacks_received", 2)).toBe(3);
    expect(metrics.increment("replay_blocked")).toBe(1);

    expect(metrics.snapshot()).toMatchObject({
      callbacks_received: 3,
      replay_blocked: 1,
      archive_success: 0
    });
  });

  it("serves development-only diagnostics routes with redacted event details", async () => {
    const events = createInMemoryGatewayEventEmitter();
    const metrics = createInMemoryMetricsRegistry();
    const router = createDiagnosticsRouter({ events, metrics });

    events.emit({
      ...securityValidationFailedEvent("corr-diagnostics", "balance", "signature mismatch"),
      details: {
        Authorization: "Bearer secret",
        token: "body-token",
        visible: "kept"
      }
    });
    events.emit(replayBlockedEvent("corr-diagnostics", "balance", "core client is not connected"));
    metrics.increment("security_validation_failed");
    metrics.increment("replay_blocked");

    expect(callRouterGet(router, "/diagnostics/events", { correlationId: "corr-diagnostics" })).toMatchObject({
      statusCode: 200,
      body: {
        developmentOnly: true,
        redacted: true,
        events: [
          {
            correlationId: "corr-diagnostics",
            details: {
              Authorization: "[REDACTED]",
              token: "[REDACTED]",
              visible: "kept"
            }
          },
          {
            eventType: "replay.blocked",
            correlationId: "corr-diagnostics"
          }
        ]
      }
    });
    expect(callRouterGet(router, "/diagnostics/metrics")).toMatchObject({
      statusCode: 200,
      body: {
        developmentOnly: true,
        metrics: {
          security_validation_failed: 1,
          replay_blocked: 1
        }
      }
    });
  });

  it("keeps event examples non-executing and core disconnected", () => {
    const examples = [
      archiveCompletedEvent("corr-examples", "debit", "archive-1"),
      replayRequestedEvent("corr-examples", "debit", "archive-1"),
      replayBlockedEvent("corr-examples", "debit", "blocked"),
      normalizationBlockedEvent("corr-examples", "debit", "open-question"),
      securityValidationFailedEvent("corr-examples", "debit", "invalid")
    ];

    expect(examples.map((event) => event.eventType)).toEqual([
      "archive.completed",
      "replay.requested",
      "replay.blocked",
      "normalization.blocked",
      "security.validation.failed"
    ]);
    expect(coreClientPlaceholder.connected).toBe(false);
  });
});

function callRouterGet(
  router: unknown,
  path: string,
  query: Record<string, string | string[] | undefined> = {}
): { statusCode: number; body: unknown } {
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

  layer?.route?.stack[0]?.handle({ query }, response);
  return response;
}

import { describe, expect, it } from "vitest";
import { coreClientPlaceholder } from "../coreClient/index.js";
import { createInMemoryGatewayEventEmitter } from "../events/index.js";
import { createDiagnosticsRouter } from "../http/diagnostics.js";
import { createInMemoryIdempotencyStore } from "../idempotency/index.js";
import { createInMemoryMetricsRegistry } from "../metrics/index.js";

describe("idempotency and duplicate-detection scaffolding", () => {
  it("creates and gets idempotency records", () => {
    const metrics = createInMemoryMetricsRegistry();
    const idempotency = createInMemoryIdempotencyStore(metrics);
    const record = idempotency.createRecord(createInput("corr-create", "external-1", { amount: "10.00" }));

    expect(idempotency.getRecord(record.id)).toEqual(record);
    expect(record).toMatchObject({
      aggregatorName: "bitville",
      callbackType: "debit",
      correlationId: "corr-create",
      externalReference: "external-1",
      status: "created",
      executionState: "not_started"
    });
    expect(metrics.snapshot().idempotency_record_created).toBe(1);
  });

  it("detects duplicate correlationId, external reference, and callback hash", () => {
    const metrics = createInMemoryMetricsRegistry();
    const idempotency = createInMemoryIdempotencyStore(metrics);
    const record = idempotency.createRecord(createInput("corr-duplicate", "external-dup", { field: "same" }));

    const result = idempotency.detectDuplicate(createInput("corr-duplicate", "external-dup", { field: "same" }));

    expect(result).toMatchObject({
      duplicate: true,
      riskLevel: "low",
      disposition: "quarantine",
      matchedRecord: record
    });
    expect(result.reasons).toEqual([
      "Duplicate correlationId detected.",
      "Duplicate external reference detected.",
      "Duplicate callback hash detected.",
      "Stale replay and conflicting payload checks are placeholders pending provider semantics."
    ]);
    expect(metrics.snapshot()).toMatchObject({
      duplicate_detected: 1,
      replay_quarantined: 1
    });
  });

  it("detects payload, correlation, and execution conflicts", () => {
    const metrics = createInMemoryMetricsRegistry();
    const idempotency = createInMemoryIdempotencyStore(metrics);
    const record = idempotency.createRecord(createInput("corr-conflict", "external-original", { field: "first" }));
    idempotency.markProcessing(record.id);

    const result = idempotency.detectDuplicate(createInput("corr-conflict", "external-new", { field: "changed" }));

    expect(result).toMatchObject({
      duplicate: true,
      riskLevel: "high",
      disposition: "investigate"
    });
    expect(result.conflicts.map((conflict) => conflict.type)).toEqual([
      "payload_conflict",
      "execution_conflict",
      "correlation_conflict"
    ]);
    expect(metrics.snapshot()).toMatchObject({
      payload_conflict: 1,
      execution_conflict: 1,
      correlation_conflict: 1
    });
  });

  it("blocks replay disposition for completed records", () => {
    const metrics = createInMemoryMetricsRegistry();
    const idempotency = createInMemoryIdempotencyStore(metrics);
    const record = idempotency.createRecord(createInput("corr-completed", "external-completed", { field: "same" }));
    idempotency.markCompleted(record.id);

    const result = idempotency.detectDuplicate(createInput("corr-new", "external-completed", { field: "same" }));

    expect(result).toMatchObject({
      duplicate: true,
      riskLevel: "medium",
      disposition: "block"
    });
    expect(metrics.snapshot().replay_blocked).toBe(1);
  });

  it("allows new replay disposition when no duplicate indicators exist", () => {
    const idempotency = createInMemoryIdempotencyStore();

    expect(idempotency.detectDuplicate(createInput("corr-new", "external-new", { field: "new" }))).toMatchObject({
      duplicate: false,
      riskLevel: "none",
      disposition: "allow"
    });
  });

  it("serves idempotency diagnostics route", () => {
    const metrics = createInMemoryMetricsRegistry();
    const idempotency = createInMemoryIdempotencyStore(metrics);
    const record = idempotency.createRecord(createInput("corr-diagnostics", "external-diagnostics", { visible: true }));
    const router = createDiagnosticsRouter({
      events: createInMemoryGatewayEventEmitter(),
      metrics,
      idempotency
    });

    expect(callRouterGet(router, "/diagnostics/idempotency")).toMatchObject({
      statusCode: 200,
      body: {
        developmentOnly: true,
        records: [
          {
            id: record.id,
            correlationId: "corr-diagnostics",
            externalReference: "external-diagnostics",
            status: "created",
            executionState: "not_started"
          }
        ]
      }
    });
  });

  it("does not execute core or mutate finances", () => {
    const idempotency = createInMemoryIdempotencyStore();
    const record = idempotency.createRecord(createInput("corr-no-core", "external-no-core", { amount: "100.00" }));

    idempotency.markBlocked(record.id);

    expect(coreClientPlaceholder.connected).toBe(false);
    expect(idempotency.getRecord(record.id)).toMatchObject({
      status: "blocked",
      executionState: "blocked"
    });
  });
});

function createInput(correlationId: string, externalReference: string, rawPayload: unknown) {
  return {
    aggregatorName: "bitville" as const,
    callbackType: "debit" as const,
    correlationId,
    externalReference,
    rawPayload
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

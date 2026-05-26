import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createFilesystemRawCallbackArchive } from "../archive/filesystemArchive.js";
import { coreClientPlaceholder } from "../coreClient/index.js";
import type { RawCallbackEnvelope } from "../domain/index.js";
import { createInMemoryGatewayEventEmitter } from "../events/index.js";
import { createInMemoryMetricsRegistry } from "../metrics/index.js";
import { createInMemoryQuarantineStore, processRawCallbackDryRun } from "../pipeline/index.js";
import { validateRawCallbackEnvelope } from "../validation/index.js";

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("validation and dry-run pipeline foundation", () => {
  it("passes generic validation for a valid envelope", () => {
    expect(validateRawCallbackEnvelope(createEnvelope("corr-valid"))).toEqual({
      status: "valid",
      issues: []
    });
  });

  it("fails generic validation for malformed envelopes", () => {
    const result = validateRawCallbackEnvelope({
      aggregatorName: "bitville",
      callbackType: "debit",
      correlationId: "",
      receivedAt: "2026-05-26T00:00:00.000Z",
      method: "POST",
      path: "/callback",
      headers: "not-an-object"
    });

    expect(result.status).toBe("invalid");
    expect(result.issues.map((issue) => issue.field)).toEqual(["rawBody", "headers"]);
  });

  it("archives, emits events, and stops at normalization_blocked during dry-run", async () => {
    const dependencies = await createDependencies();

    const result = await processRawCallbackDryRun(createEnvelope("corr-pipeline"), dependencies);

    expect(result.executed).toBe(false);
    expect(result.status).toBe("normalization_blocked");
    expect(result.archivedCallback?.correlationId).toBe("corr-pipeline");
    expect(result.stages.map((stage) => [stage.stage, stage.status])).toEqual([
      ["received", "completed"],
      ["validation", "completed"],
      ["archive", "completed"],
      ["normalization", "blocked"]
    ]);
    expect(dependencies.events.query({ correlationId: "corr-pipeline" }).map((event) => event.eventType)).toEqual([
      "callback.received",
      "archive.completed",
      "normalization.blocked"
    ]);
    expect(dependencies.metrics.snapshot()).toMatchObject({
      callbacks_received: 1,
      archive_success: 1,
      normalization_blocked: 1
    });
  });

  it("quarantines malformed dry-run callbacks with redacted payloads", async () => {
    const dependencies = await createDependencies();

    const result = await processRawCallbackDryRun(
      {
        aggregatorName: "bitville",
        callbackType: "credit",
        correlationId: "corr-quarantine",
        token: "body-token"
      },
      dependencies
    );

    expect(result.executed).toBe(false);
    expect(result.status).toBe("quarantined");
    expect(result.quarantinedCallback?.reason).toBe("generic_validation_failed");
    expect(result.quarantinedCallback?.redactedPayload).toMatchObject({
      token: "[REDACTED]"
    });
    expect(dependencies.quarantine.list()).toHaveLength(1);
    expect(dependencies.events.query({ correlationId: "corr-quarantine" }).map((event) => event.eventType)).toEqual([
      "callback.received",
      "validation.failed",
      "quarantine.created"
    ]);
    expect(dependencies.metrics.snapshot()).toMatchObject({
      callbacks_received: 1,
      archive_success: 0,
      normalization_blocked: 0
    });
  });

  it("keeps the core client disconnected", () => {
    expect(coreClientPlaceholder).toEqual({
      status: "not-connected",
      connected: false
    });
  });
});

async function createDependencies() {
  const directory = await mkdtemp(join(tmpdir(), "gateway-pipeline-"));
  tempDirectories.push(directory);

  return {
    archive: createFilesystemRawCallbackArchive({ directory }),
    events: createInMemoryGatewayEventEmitter(),
    metrics: createInMemoryMetricsRegistry(),
    quarantine: createInMemoryQuarantineStore()
  };
}

function createEnvelope(correlationId: string): RawCallbackEnvelope {
  return {
    aggregatorName: "bitville",
    callbackType: "debit",
    correlationId,
    receivedAt: "2026-05-26T00:00:00.000Z",
    method: "POST",
    path: "/bitville/callback",
    headers: {},
    rawBody: {}
  };
}

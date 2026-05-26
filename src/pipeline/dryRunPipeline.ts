import type { RawCallbackEnvelope } from "../domain/index.js";
import type { GatewayEventInput } from "../events/index.js";
import { validateRawCallbackEnvelope } from "../validation/index.js";
import type { PipelineDependencies, PipelineResult, PipelineStageResult } from "./pipelineTypes.js";

export async function processRawCallbackDryRun(envelope: unknown, dependencies: PipelineDependencies): Promise<PipelineResult> {
  const stages: PipelineStageResult[] = [
    {
      stage: "received",
      status: "completed",
      message: "Raw callback received for dry-run processing."
    }
  ];
  const validation = validateRawCallbackEnvelope(envelope);
  const metadata = callbackMetadata(envelope);

  dependencies.metrics.increment("callbacks_received");
  dependencies.events.emit({
    eventType: "callback.received",
    severity: "info",
    correlationId: metadata.correlationId,
    callbackType: metadata.callbackType,
    stage: "received",
    message: "Raw callback received.",
    details: { dryRun: true }
  });

  stages.push({
    stage: "validation",
    status: validation.status === "valid" ? "completed" : "failed",
    message: validation.status === "valid" ? "Generic envelope validation passed." : "Generic envelope validation failed."
  });

  if (validation.status === "invalid") {
    const quarantinedCallback = dependencies.quarantine.add({
      reason: "generic_validation_failed",
      correlationId: metadata.correlationId === "unknown-correlation" ? undefined : metadata.correlationId,
      issues: validation.issues,
      redactedPayload: envelope
    });

    dependencies.events.emit({
      eventType: "validation.failed",
      severity: "error",
      correlationId: metadata.correlationId,
      callbackType: metadata.callbackType,
      stage: "validation",
      message: "Generic envelope validation failed.",
      details: { issues: validation.issues }
    });
    dependencies.events.emit({
      eventType: "quarantine.created",
      severity: "warn",
      correlationId: metadata.correlationId,
      callbackType: metadata.callbackType,
      stage: "quarantine",
      message: "Malformed callback moved to quarantine.",
      details: { quarantineId: quarantinedCallback.id, reason: quarantinedCallback.reason }
    });

    stages.push({
      stage: "quarantine",
      status: "completed",
      message: "Malformed callback quarantined."
    });

    return {
      executed: false,
      status: "quarantined",
      validation,
      quarantinedCallback,
      stages
    };
  }

  const archivedCallback = await dependencies.archive.archiveRawCallback(envelope as RawCallbackEnvelope);

  dependencies.metrics.increment("archive_success");
  dependencies.metrics.increment("normalization_blocked");
  dependencies.events.emit(archiveCompletedEvent(archivedCallback.correlationId, archivedCallback.callbackType, archivedCallback.id));
  dependencies.events.emit({
    eventType: "normalization.blocked",
    severity: "warn",
    correlationId: archivedCallback.correlationId,
    callbackType: archivedCallback.callbackType,
    stage: "normalization",
    message: "Normalization blocked pending provider contract answers.",
    details: { archiveId: archivedCallback.id }
  });

  stages.push(
    {
      stage: "archive",
      status: "completed",
      message: "Raw callback archived."
    },
    {
      stage: "normalization",
      status: "blocked",
      message: "Dry-run pipeline stopped before normalization execution."
    }
  );

  return {
    executed: false,
    status: "normalization_blocked",
    validation,
    archivedCallback,
    stages
  };
}

function archiveCompletedEvent(correlationId: string, callbackType: RawCallbackEnvelope["callbackType"], archiveId: string): GatewayEventInput {
  return {
    eventType: "archive.completed",
    severity: "info",
    correlationId,
    callbackType,
    stage: "archived",
    message: "Raw callback archived.",
    details: { archiveId }
  };
}

function callbackMetadata(envelope: unknown): Pick<GatewayEventInput, "correlationId" | "callbackType"> {
  if (envelope !== null && typeof envelope === "object" && !Array.isArray(envelope)) {
    const candidate = envelope as Partial<RawCallbackEnvelope>;

    return {
      correlationId: typeof candidate.correlationId === "string" ? candidate.correlationId : "unknown-correlation",
      callbackType: typeof candidate.callbackType === "string" ? candidate.callbackType : undefined
    };
  }

  return {
    correlationId: "unknown-correlation"
  };
}

import type { CallbackType } from "../domain/index.js";
import type { GatewayEventInput } from "./eventTypes.js";

export function archiveCompletedEvent(correlationId: string, callbackType: CallbackType, archiveId: string): GatewayEventInput {
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

export function replayRequestedEvent(correlationId: string, callbackType: CallbackType, archiveId: string): GatewayEventInput {
  return {
    eventType: "replay.requested",
    severity: "info",
    correlationId,
    callbackType,
    stage: "replay",
    message: "Dry-run replay requested.",
    details: { archiveId }
  };
}

export function replayBlockedEvent(correlationId: string, callbackType: CallbackType, reason: string): GatewayEventInput {
  return {
    eventType: "replay.blocked",
    severity: "warn",
    correlationId,
    callbackType,
    stage: "blocked",
    message: "Replay execution blocked.",
    details: { reason }
  };
}

export function normalizationBlockedEvent(correlationId: string, callbackType: CallbackType, reason: string): GatewayEventInput {
  return {
    eventType: "normalization.blocked",
    severity: "warn",
    correlationId,
    callbackType,
    stage: "normalization",
    message: "Callback normalization blocked.",
    details: { reason }
  };
}

export function securityValidationFailedEvent(correlationId: string, callbackType: CallbackType, reason: string): GatewayEventInput {
  return {
    eventType: "security.validation.failed",
    severity: "error",
    correlationId,
    callbackType,
    stage: "security_validation",
    message: "Callback security validation failed.",
    details: { reason }
  };
}

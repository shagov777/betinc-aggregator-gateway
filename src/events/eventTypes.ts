import type { CallbackType } from "../domain/index.js";

export const gatewayEventTypes = [
  "archive.completed",
  "archive.failed",
  "replay.requested",
  "replay.blocked",
  "normalization.blocked",
  "security.validation.failed",
  "reconciliation.flagged"
] as const;

export type GatewayEventType = (typeof gatewayEventTypes)[number];

export type GatewayEventSeverity = "debug" | "info" | "warn" | "error";

export type ProcessingStage =
  | "received"
  | "archived"
  | "security_validation"
  | "normalization"
  | "replay"
  | "reconciliation"
  | "blocked";

export type GatewayEvent = {
  id: string;
  eventType: GatewayEventType;
  severity: GatewayEventSeverity;
  timestamp: string;
  correlationId: string;
  callbackType?: CallbackType;
  stage: ProcessingStage;
  message: string;
  details?: unknown;
};

export type GatewayEventTimeline = {
  correlationId: string;
  events: GatewayEvent[];
};

export type ReplayEvent = GatewayEvent & {
  eventType: "replay.requested" | "replay.blocked";
  stage: "replay" | "blocked";
};

export type ArchiveEvent = GatewayEvent & {
  eventType: "archive.completed" | "archive.failed";
  stage: "archived";
};

export type SecurityValidationEvent = GatewayEvent & {
  eventType: "security.validation.failed";
  stage: "security_validation";
};

export type ReconciliationEvent = GatewayEvent & {
  eventType: "reconciliation.flagged";
  stage: "reconciliation";
};

export type GatewayEventQuery = {
  correlationId?: string;
  callbackType?: CallbackType;
  eventType?: GatewayEventType;
};

export type GatewayEventInput = Omit<GatewayEvent, "id" | "timestamp"> & {
  timestamp?: string;
};

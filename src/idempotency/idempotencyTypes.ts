import type { AggregatorName, CallbackType } from "../domain/index.js";

export type IdempotencyStatus = "created" | "processing" | "completed" | "blocked" | "conflict";

export type CallbackExecutionState = "not_started" | "processing" | "completed" | "blocked" | "conflicted";

export type DuplicateRiskLevel = "none" | "low" | "medium" | "high";

export type ReplayDisposition = "allow" | "block" | "quarantine" | "investigate";

export type ExecutionConflict = {
  type: "execution_conflict";
  existingState: CallbackExecutionState;
  incomingState: CallbackExecutionState;
  reason: string;
};

export type CorrelationConflict = {
  type: "correlation_conflict";
  correlationId: string;
  existingRecordId: string;
  reason: string;
};

export type PayloadConflict = {
  type: "payload_conflict";
  existingHash: string;
  incomingHash: string;
  reason: string;
};

export type IdempotencyRecord = {
  id: string;
  aggregatorName: AggregatorName;
  callbackType: CallbackType;
  correlationId: string;
  externalReference?: string;
  callbackHash: string;
  status: IdempotencyStatus;
  executionState: CallbackExecutionState;
  createdAt: string;
  updatedAt: string;
  conflicts: Array<ExecutionConflict | CorrelationConflict | PayloadConflict>;
};

export type DuplicateDetectionResult = {
  duplicate: boolean;
  riskLevel: DuplicateRiskLevel;
  disposition: ReplayDisposition;
  matchedRecord?: IdempotencyRecord;
  reasons: string[];
  conflicts: Array<ExecutionConflict | CorrelationConflict | PayloadConflict>;
};

export type IdempotencyRecordInput = {
  aggregatorName: AggregatorName;
  callbackType: CallbackType;
  correlationId: string;
  externalReference?: string;
  rawPayload: unknown;
};

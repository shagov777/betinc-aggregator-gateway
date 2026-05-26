import { randomUUID } from "node:crypto";
import type { MetricsRegistry } from "../metrics/index.js";
import { createCallbackHash } from "./hash.js";
import type {
  CallbackExecutionState,
  CorrelationConflict,
  DuplicateDetectionResult,
  ExecutionConflict,
  IdempotencyRecord,
  IdempotencyRecordInput,
  IdempotencyStatus,
  PayloadConflict
} from "./idempotencyTypes.js";

export type IdempotencyStore = {
  createRecord(input: IdempotencyRecordInput): IdempotencyRecord;
  getRecord(id: string): IdempotencyRecord | undefined;
  listRecords(): IdempotencyRecord[];
  detectDuplicate(input: IdempotencyRecordInput): DuplicateDetectionResult;
  markProcessing(id: string): IdempotencyRecord | undefined;
  markCompleted(id: string): IdempotencyRecord | undefined;
  markBlocked(id: string, reason?: string): IdempotencyRecord | undefined;
  markConflict(id: string, conflict: ExecutionConflict | CorrelationConflict | PayloadConflict): IdempotencyRecord | undefined;
};

export function createInMemoryIdempotencyStore(metrics?: MetricsRegistry): IdempotencyStore {
  const records = new Map<string, IdempotencyRecord>();

  return {
    createRecord(input: IdempotencyRecordInput): IdempotencyRecord {
      const now = new Date().toISOString();
      const record: IdempotencyRecord = {
        id: randomUUID(),
        aggregatorName: input.aggregatorName,
        callbackType: input.callbackType,
        correlationId: input.correlationId,
        externalReference: input.externalReference,
        callbackHash: createCallbackHash(input.rawPayload),
        status: "created",
        executionState: "not_started",
        createdAt: now,
        updatedAt: now,
        conflicts: []
      };

      records.set(record.id, record);
      metrics?.increment("idempotency_record_created");
      return record;
    },

    getRecord(id: string): IdempotencyRecord | undefined {
      return records.get(id);
    },

    listRecords(): IdempotencyRecord[] {
      return [...records.values()];
    },

    detectDuplicate(input: IdempotencyRecordInput): DuplicateDetectionResult {
      const incomingHash = createCallbackHash(input.rawPayload);
      const existing = [...records.values()];
      const correlationMatch = existing.find((record) => record.correlationId === input.correlationId);
      const externalReferenceMatch = input.externalReference
        ? existing.find((record) => record.externalReference === input.externalReference)
        : undefined;
      const hashMatch = existing.find((record) => record.callbackHash === incomingHash);
      const matchedRecord = correlationMatch ?? externalReferenceMatch ?? hashMatch;
      const conflicts: DuplicateDetectionResult["conflicts"] = [];
      const reasons: string[] = [];

      if (correlationMatch) {
        reasons.push("Duplicate correlationId detected.");
      }

      if (externalReferenceMatch) {
        reasons.push("Duplicate external reference detected.");
      }

      if (hashMatch) {
        reasons.push("Duplicate callback hash detected.");
      }

      if (correlationMatch && correlationMatch.callbackHash !== incomingHash) {
        conflicts.push({
          type: "payload_conflict",
          existingHash: correlationMatch.callbackHash,
          incomingHash,
          reason: "Same correlationId has a different callback hash."
        });
        metrics?.increment("payload_conflict");
      }

      if (correlationMatch && correlationMatch.executionState !== "not_started") {
        conflicts.push({
          type: "execution_conflict",
          existingState: correlationMatch.executionState,
          incomingState: "not_started",
          reason: "Incoming replay conflicts with an existing execution state."
        });
        metrics?.increment("execution_conflict");
      }

      if (correlationMatch && (externalReferenceMatch === undefined || correlationMatch.id !== externalReferenceMatch.id)) {
        conflicts.push({
          type: "correlation_conflict",
          correlationId: input.correlationId,
          existingRecordId: correlationMatch.id,
          reason: "Correlation requires investigation before replay."
        });
        metrics?.increment("correlation_conflict");
      }

      if (!matchedRecord) {
        return {
          duplicate: false,
          riskLevel: "none",
          disposition: "allow",
          reasons: ["No duplicate indicators detected."],
          conflicts: []
        };
      }

      metrics?.increment("duplicate_detected");

      const disposition = conflicts.length > 0 ? "investigate" : matchedRecord.executionState === "completed" ? "block" : "quarantine";

      if (disposition === "block") {
        metrics?.increment("replay_blocked");
      }

      if (disposition === "quarantine") {
        metrics?.increment("replay_quarantined");
      }

      return {
        duplicate: true,
        riskLevel: conflicts.length > 0 ? "high" : matchedRecord.executionState === "completed" ? "medium" : "low",
        disposition,
        matchedRecord,
        reasons: [...reasons, "Stale replay and conflicting payload checks are placeholders pending provider semantics."],
        conflicts
      };
    },

    markProcessing(id: string): IdempotencyRecord | undefined {
      return updateRecord(records, id, "processing", "processing");
    },

    markCompleted(id: string): IdempotencyRecord | undefined {
      return updateRecord(records, id, "completed", "completed");
    },

    markBlocked(id: string): IdempotencyRecord | undefined {
      return updateRecord(records, id, "blocked", "blocked");
    },

    markConflict(id: string, conflict: ExecutionConflict | CorrelationConflict | PayloadConflict): IdempotencyRecord | undefined {
      const existing = records.get(id);

      if (!existing) {
        return undefined;
      }

      const updated = {
        ...existing,
        status: "conflict" as IdempotencyStatus,
        executionState: "conflicted" as CallbackExecutionState,
        updatedAt: new Date().toISOString(),
        conflicts: [...existing.conflicts, conflict]
      };

      records.set(id, updated);
      return updated;
    }
  };
}

function updateRecord(
  records: Map<string, IdempotencyRecord>,
  id: string,
  status: IdempotencyStatus,
  executionState: CallbackExecutionState
): IdempotencyRecord | undefined {
  const existing = records.get(id);

  if (!existing) {
    return undefined;
  }

  const updated = {
    ...existing,
    status,
    executionState,
    updatedAt: new Date().toISOString()
  };

  records.set(id, updated);
  return updated;
}

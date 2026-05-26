export type CorrelationContext = {
  correlationId: string;
};

export type AggregatorName = "bitville";

export type CallbackType = "balance" | "debit" | "credit" | "cancel" | "promo/freespins";

export type RawCallbackEnvelope = {
  aggregatorName: AggregatorName;
  callbackType: CallbackType;
  receivedAt: string;
  correlationId: string;
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  rawBody: unknown;
};

export type NormalizedGatewayCommand = {
  aggregatorName: AggregatorName;
  callbackType: CallbackType;
  correlationId: string;
  raw: RawCallbackEnvelope;
  externalTransactionId?: string;
  externalRoundId?: string;
  externalPlayerId?: string;
};

export const gatewayProcessingStates = [
  "received",
  "security_validation_pending",
  "security_validation_failed",
  "parse_failed",
  "idempotency_check_pending",
  "duplicate_ignored",
  "normalization_blocked",
  "core_not_connected",
  "reconciliation_required",
  "completed"
] as const;

export type GatewayProcessingState = (typeof gatewayProcessingStates)[number];

export type IdempotencyDecision =
  | {
      decision: "process";
      reason: "new_callback";
    }
  | {
      decision: "ignore";
      reason: "duplicate_callback";
      existingCorrelationId: string;
    }
  | {
      decision: "reconcile";
      reason: "conflicting_duplicate" | "unknown_previous_outcome";
    };

export type CoreCommandResult =
  | {
      status: "not_connected";
      reason: "foundation_only";
    }
  | {
      status: "accepted" | "rejected" | "unknown";
      coreReferenceId?: string;
      reason?: string;
    };

export type ReconciliationFlag = {
  required: boolean;
  reason:
    | "core_outcome_unknown"
    | "conflicting_idempotency_record"
    | "adapter_semantics_unresolved"
    | "external_report_mismatch";
  correlationId: string;
};

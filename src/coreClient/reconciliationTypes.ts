export type CoreReconciliationState = "not_started" | "pending" | "drift_detected" | "resolved" | "blocked";

export type DriftSeverity = "low" | "medium" | "high" | "critical";

export type DriftResolutionStatus = "open" | "investigating" | "resolved" | "blocked";

export type GatewayCoreDrift = {
  id: string;
  severity: DriftSeverity;
  status: DriftResolutionStatus;
  detectedAt: string;
  correlationId: string;
  reason: string;
};

export type SecurityValidationStatus = "passed" | "failed" | "skipped" | "blocked";

export type TrustBoundary = "external_callback" | "internal_diagnostics" | "development_simulator";

export type CallbackTrustLevel = "untrusted" | "partially_trusted" | "trusted";

export type ReplayRiskAssessment = {
  riskLevel: "low" | "medium" | "high";
  duplicateCorrelationId: boolean;
  staleTimestamp: boolean;
  suspiciousRetry: boolean;
  clockSkewDetected: boolean;
  reasons: string[];
};

export type CredentialState = "not_configured" | "placeholder" | "redacted" | "expired" | "rotating";

export type AllowedIpRange = {
  label: string;
  cidr: string;
  enabled: boolean;
};

export type RedactedSecret = {
  kind: "partner_token" | "client_token" | "apiKey" | "sharedSecret";
  state: CredentialState;
  value: "[REDACTED]" | undefined;
};

export type SecurityValidationResult = {
  status: SecurityValidationStatus;
  trustBoundary: TrustBoundary;
  trustLevel: CallbackTrustLevel;
  reason: string;
};

export const gatewayMetricNames = [
  "callbacks_received",
  "archive_success",
  "archive_failure",
  "replay_requested",
  "replay_blocked",
  "security_validation_failed",
  "normalization_blocked",
  "reconciliation_flagged"
] as const;

export type GatewayMetricName = (typeof gatewayMetricNames)[number];

export type GatewayMetricsSnapshot = Record<GatewayMetricName, number>;

export const gatewayMetricNames = [
  "callbacks_received",
  "archive_success",
  "archive_failure",
  "replay_requested",
  "replay_blocked",
  "security_validation_failed",
  "normalization_blocked",
  "reconciliation_flagged",
  "provider_sync_started",
  "provider_sync_completed",
  "provider_sync_failed",
  "stale_catalogue_detected",
  "provider_outage_detected",
  "provider_health_degraded",
  "launch_requested",
  "launch_blocked",
  "session_created",
  "session_launched",
  "session_expired",
  "session_abandoned",
  "session_closed",
  "security_validation_passed",
  "replay_risk_detected",
  "ip_rejected",
  "stale_request_detected",
  "timestamp_window_failed",
  "idempotency_record_created",
  "duplicate_detected",
  "replay_quarantined",
  "correlation_conflict",
  "payload_conflict",
  "execution_conflict"
] as const;

export type GatewayMetricName = (typeof gatewayMetricNames)[number];

export type GatewayMetricsSnapshot = Record<GatewayMetricName, number>;

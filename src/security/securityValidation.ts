import type { MetricsRegistry } from "../metrics/index.js";
import type {
  AllowedIpRange,
  ReplayRiskAssessment,
  SecurityValidationResult,
  TrustBoundary
} from "./securityTypes.js";

export function validateAuthorizationHeader(
  headers: Record<string, string | string[] | undefined>,
  trustBoundary: TrustBoundary = "external_callback",
  metrics?: MetricsRegistry
): SecurityValidationResult {
  const authorization = headers.Authorization ?? headers.authorization;
  const present = Array.isArray(authorization) ? authorization.length > 0 : typeof authorization === "string" && authorization.length > 0;

  if (!present) {
    metrics?.increment("security_validation_failed");
    return {
      status: "blocked",
      trustBoundary,
      trustLevel: "untrusted",
      reason: "Authorization header is absent; final provider auth semantics are unresolved."
    };
  }

  metrics?.increment("security_validation_passed");
  return {
    status: "skipped",
    trustBoundary,
    trustLevel: "partially_trusted",
    reason: "Authorization header is present but not verified in foundation mode."
  };
}

export function validateIpAllowlist(
  ipAddress: string,
  allowedRanges: AllowedIpRange[],
  metrics?: MetricsRegistry
): SecurityValidationResult {
  const allowed = allowedRanges.some((range) => range.enabled && matchesDevelopmentRange(ipAddress, range.cidr));

  if (!allowed) {
    metrics?.increment("ip_rejected");
  }

  return {
    status: allowed ? "passed" : "failed",
    trustBoundary: "external_callback",
    trustLevel: allowed ? "partially_trusted" : "untrusted",
    reason: allowed ? "IP matched configured development allowlist." : "IP did not match configured development allowlist."
  };
}

export function validateTimestampWindow(
  receivedAt: string,
  options: { now?: Date; maxAgeMs: number; futureSkewMs: number; metrics?: MetricsRegistry }
): SecurityValidationResult {
  const now = options.now ?? new Date();
  const timestamp = new Date(receivedAt);
  const ageMs = now.getTime() - timestamp.getTime();
  const stale = ageMs > options.maxAgeMs;
  const tooFarFuture = ageMs < -options.futureSkewMs;

  if (stale) {
    options.metrics?.increment("stale_request_detected");
  }

  if (stale || tooFarFuture || Number.isNaN(ageMs)) {
    options.metrics?.increment("timestamp_window_failed");
  }

  return {
    status: stale || tooFarFuture || Number.isNaN(ageMs) ? "failed" : "passed",
    trustBoundary: "external_callback",
    trustLevel: stale || tooFarFuture || Number.isNaN(ageMs) ? "untrusted" : "partially_trusted",
    reason: stale
      ? "Request timestamp is stale."
      : tooFarFuture
        ? "Request timestamp exceeds allowed future clock skew."
        : Number.isNaN(ageMs)
          ? "Request timestamp is invalid."
          : "Request timestamp is within the configured development window."
  };
}

export function validateReplayRisk(input: {
  correlationId: string;
  seenCorrelationIds: ReadonlySet<string>;
  receivedAt: string;
  now?: Date;
  maxAgeMs: number;
  metrics?: MetricsRegistry;
}): ReplayRiskAssessment {
  const duplicateCorrelationId = input.seenCorrelationIds.has(input.correlationId);
  const timestampResult = validateTimestampWindow(input.receivedAt, {
    now: input.now,
    maxAgeMs: input.maxAgeMs,
    futureSkewMs: 60_000,
    metrics: input.metrics
  });
  const staleTimestamp = timestampResult.reason === "Request timestamp is stale.";
  const clockSkewDetected = timestampResult.reason === "Request timestamp exceeds allowed future clock skew.";
  const suspiciousRetry = duplicateCorrelationId;
  const reasons = [
    duplicateCorrelationId ? "Duplicate correlationId detected." : undefined,
    staleTimestamp ? "Stale timestamp detected." : undefined,
    suspiciousRetry ? "Suspicious retry placeholder triggered." : undefined,
    clockSkewDetected ? "Clock skew placeholder triggered." : undefined
  ].filter((reason): reason is string => reason !== undefined);

  const riskLevel = reasons.length === 0 ? "low" : duplicateCorrelationId || staleTimestamp ? "high" : "medium";

  if (riskLevel !== "low") {
    input.metrics?.increment("replay_risk_detected");
  }

  return {
    riskLevel,
    duplicateCorrelationId,
    staleTimestamp,
    suspiciousRetry,
    clockSkewDetected,
    reasons
  };
}

function matchesDevelopmentRange(ipAddress: string, cidr: string): boolean {
  if (cidr.endsWith("/32")) {
    return ipAddress === cidr.slice(0, -3);
  }

  if (cidr.endsWith("/24")) {
    return ipAddress.split(".").slice(0, 3).join(".") === cidr.slice(0, -3).split(".").slice(0, 3).join(".");
  }

  return ipAddress === cidr;
}

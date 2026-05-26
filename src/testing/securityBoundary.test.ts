import { describe, expect, it } from "vitest";
import { coreClientPlaceholder } from "../coreClient/index.js";
import { createInMemoryGatewayEventEmitter } from "../events/index.js";
import { createDiagnosticsRouter } from "../http/diagnostics.js";
import { createInMemoryMetricsRegistry } from "../metrics/index.js";
import {
  createInMemoryCredentialStore,
  validateAuthorizationHeader,
  validateIpAllowlist,
  validateReplayRisk,
  validateTimestampWindow
} from "../security/index.js";

describe("security and auth boundary scaffolding", () => {
  it("validates authorization header as placeholder-only", () => {
    const metrics = createInMemoryMetricsRegistry();

    expect(validateAuthorizationHeader({}, "external_callback", metrics)).toMatchObject({
      status: "blocked",
      trustLevel: "untrusted"
    });
    expect(validateAuthorizationHeader({ Authorization: "Bearer placeholder" }, "external_callback", metrics)).toMatchObject({
      status: "skipped",
      trustLevel: "partially_trusted",
      reason: "Authorization header is present but not verified in foundation mode."
    });
    expect(metrics.snapshot()).toMatchObject({
      security_validation_failed: 1,
      security_validation_passed: 1
    });
  });

  it("detects replay-risk placeholders", () => {
    const metrics = createInMemoryMetricsRegistry();
    const result = validateReplayRisk({
      correlationId: "corr-duplicate",
      seenCorrelationIds: new Set(["corr-duplicate"]),
      receivedAt: "2026-05-26T10:00:00.000Z",
      now: new Date("2026-05-26T10:00:01.000Z"),
      maxAgeMs: 60_000,
      metrics
    });

    expect(result).toMatchObject({
      riskLevel: "high",
      duplicateCorrelationId: true,
      suspiciousRetry: true,
      staleTimestamp: false
    });
    expect(result.reasons).toContain("Duplicate correlationId detected.");
    expect(metrics.snapshot().replay_risk_detected).toBe(1);
  });

  it("detects stale timestamps and timestamp-window failures", () => {
    const metrics = createInMemoryMetricsRegistry();

    expect(
      validateTimestampWindow("2026-05-26T09:00:00.000Z", {
        now: new Date("2026-05-26T10:00:00.000Z"),
        maxAgeMs: 5 * 60 * 1000,
        futureSkewMs: 60_000,
        metrics
      })
    ).toMatchObject({
      status: "failed",
      reason: "Request timestamp is stale."
    });
    expect(metrics.snapshot()).toMatchObject({
      stale_request_detected: 1,
      timestamp_window_failed: 1
    });
  });

  it("applies development IP allowlist behavior", () => {
    const metrics = createInMemoryMetricsRegistry();
    const ranges = [
      {
        label: "local",
        cidr: "127.0.0.1/32",
        enabled: true
      }
    ];

    expect(validateIpAllowlist("127.0.0.1", ranges, metrics)).toMatchObject({
      status: "passed",
      trustLevel: "partially_trusted"
    });
    expect(validateIpAllowlist("10.0.0.2", ranges, metrics)).toMatchObject({
      status: "failed",
      trustLevel: "untrusted"
    });
    expect(metrics.snapshot().ip_rejected).toBe(1);
  });

  it("serves redacted security diagnostics", () => {
    const credentials = createInMemoryCredentialStore();
    credentials.setPlaceholder("partner_token");
    credentials.setPlaceholder("client_token");
    const router = createDiagnosticsRouter({
      events: createInMemoryGatewayEventEmitter(),
      metrics: createInMemoryMetricsRegistry(),
      credentials
    });

    expect(callRouterGet(router, "/diagnostics/security")).toMatchObject({
      statusCode: 200,
      body: {
        developmentOnly: true,
        redacted: true,
        credentials: [
          {
            kind: "partner_token",
            state: "placeholder",
            value: "[REDACTED]"
          },
          {
            kind: "client_token",
            state: "placeholder",
            value: "[REDACTED]"
          },
          {
            kind: "apiKey",
            state: "not_configured"
          },
          {
            kind: "sharedSecret",
            state: "not_configured"
          }
        ]
      }
    });
  });

  it("does not execute core or call external auth services", () => {
    const credentials = createInMemoryCredentialStore();

    expect(credentials.list().every((credential) => credential.value === undefined)).toBe(true);
    expect(coreClientPlaceholder.connected).toBe(false);
  });
});

function callRouterGet(router: unknown, path: string): { statusCode: number; body: unknown } {
  const layer = (router as { stack: Array<{ route?: { path: string; stack: Array<{ handle: Function }> } }> }).stack.find(
    (candidate) => candidate.route?.path === path
  );
  const response: { statusCode: number; body: unknown; status(code: number): typeof response; json(body: unknown): typeof response } = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    }
  };

  layer?.route?.stack[0]?.handle({ query: {} }, response);
  return response;
}

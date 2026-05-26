import { describe, expect, it } from "vitest";
import {
  createBitvilleNormalizationBlockedResult,
  createBitvilleSandboxClient,
  normalizeBitvilleGamesPlaceholder,
  normalizeBitvilleLaunchPlaceholder,
  normalizeBitvilleProvidersPlaceholder
} from "../adapters/bitville/index.js";
import { coreClientPlaceholder } from "../coreClient/index.js";
import type { RawCallbackEnvelope } from "../domain/index.js";
import { createInMemoryGatewayEventEmitter } from "../events/index.js";
import { createDiagnosticsRouter } from "../http/diagnostics.js";
import { createInMemoryMetricsRegistry } from "../metrics/index.js";

describe("Bitville sandbox adapter/client scaffolding", () => {
  it("creates dry-run request builders for documented endpoints", () => {
    const metrics = createInMemoryMetricsRegistry();
    const client = createBitvilleSandboxClient({ metrics });

    expect(client.buildProvidersRequest("corr-providers")).toMatchObject({
      endpoint: "/providers",
      method: "GET",
      correlationId: "corr-providers",
      status: "blocked"
    });
    expect(client.buildGamesRequest({ correlationId: "corr-games", provider: "provider-a" })).toMatchObject({
      endpoint: "/games",
      method: "GET",
      correlationId: "corr-games",
      query: {
        provider: "provider-a"
      },
      status: "blocked"
    });
    expect(
      client.buildTokenRequest({
        correlationId: "corr-token",
        provider: "provider-a",
        game: "game-a",
        client_token: "client-placeholder",
        partner_token: "partner-placeholder",
        demoMode: true,
        demoOverlay: false
      })
    ).toMatchObject({
      endpoint: "/api/token",
      method: "POST",
      correlationId: "corr-token",
      body: {
        provider: "provider-a",
        game: "game-a",
        client_token: "client-placeholder",
        partner_token: "partner-placeholder",
        demoMode: true,
        demoOverlay: false
      },
      status: "blocked"
    });
    expect(metrics.snapshot()).toMatchObject({
      bitville_request_created: 3,
      bitville_request_blocked: 3
    });
  });

  it("supports dry-run timeout, retry, and degraded-provider placeholders without HTTP execution", () => {
    const metrics = createInMemoryMetricsRegistry();
    const client = createBitvilleSandboxClient({ metrics });
    const request = client.buildProvidersRequest("corr-timeout");

    expect(client.liveHttpEnabled).toBe(false);
    expect(client.simulateTimeout(request.id)).toMatchObject({
      id: request.id,
      status: "timeout_simulated"
    });
    expect(client.simulateRetry(request.id)).toMatchObject({
      id: request.id,
      status: "retry_simulated"
    });
    client.markProviderDegraded("sandbox degraded placeholder");
    expect(client.diagnostics()).toMatchObject({
      liveHttpEnabled: false,
      providerDegradation: {
        degraded: true,
        reason: "sandbox degraded placeholder"
      }
    });
    expect(metrics.snapshot()).toMatchObject({
      bitville_timeout_simulated: 1,
      bitville_retry_simulated: 1,
      bitville_provider_degraded: 1
    });
  });

  it("preserves correlation IDs in diagnostics", () => {
    const client = createBitvilleSandboxClient();
    client.buildProvidersRequest("corr-preserve");

    expect(client.diagnostics().requests).toMatchObject([
      {
        correlationId: "corr-preserve"
      }
    ]);
  });

  it("serves Bitville diagnostics route", () => {
    const metrics = createInMemoryMetricsRegistry();
    const bitville = createBitvilleSandboxClient({ metrics });
    const request = bitville.buildGamesRequest({ correlationId: "corr-diagnostics", provider: "provider-a" });
    const router = createDiagnosticsRouter({
      events: createInMemoryGatewayEventEmitter(),
      metrics,
      bitville
    });

    expect(callRouterGet(router, "/diagnostics/bitville")).toMatchObject({
      statusCode: 200,
      body: {
        developmentOnly: true,
        bitville: {
          liveHttpEnabled: false,
          requests: [
            {
              id: request.id,
              endpoint: "/games",
              correlationId: "corr-diagnostics",
              status: "blocked"
            }
          ],
          timeoutPolicy: {
            status: "placeholder"
          },
          retryPolicy: {
            status: "placeholder"
          },
          circuitBreaker: {
            status: "placeholder"
          }
        }
      }
    });
  });

  it("normalizes non-financial catalogue placeholders only", () => {
    expect(
      normalizeBitvilleProvidersPlaceholder({
        status: "dry_run",
        providers: [{ provider: "provider-a", name: "Provider A" }],
        errors: []
      })
    ).toEqual([
      {
        aggregatorName: "bitville",
        providerId: "provider-a",
        displayName: "Provider A",
        rawProviderName: "provider-a"
      }
    ]);
    expect(
      normalizeBitvilleGamesPlaceholder({
        status: "dry_run",
        games: [{ provider: "provider-a", game: "game-a", name: "Game A", category: "slots" }],
        errors: []
      })
    ).toEqual([
      {
        aggregatorName: "bitville",
        providerId: "provider-a",
        gameId: "game-a",
        displayName: "Game A",
        categoryIds: ["slots"],
        rawGameName: "game-a"
      }
    ]);
    expect(
      normalizeBitvilleLaunchPlaceholder({
        endpoint: "/api/token",
        request: {
          correlationId: "corr-launch",
          provider: "provider-a",
          game: "game-a"
        }
      })
    ).toMatchObject({
      status: "normalization_blocked",
      endpoint: "/api/token",
      correlationId: "corr-launch"
    });
  });

  it("keeps financial normalization blocked and performs no wallet mutation", () => {
    expect(createBitvilleNormalizationBlockedResult(createEnvelope("debit"))).toMatchObject({
      status: "normalization_blocked"
    });
    expect(coreClientPlaceholder.connected).toBe(false);
  });
});

function createEnvelope(callbackType: RawCallbackEnvelope["callbackType"]): RawCallbackEnvelope {
  return {
    aggregatorName: "bitville",
    callbackType,
    correlationId: "corr-wallet-blocked",
    receivedAt: "2026-05-26T00:00:00.000Z",
    method: "POST",
    path: "/bitville/callback",
    headers: {},
    rawBody: {}
  };
}

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

import type { MetricsRegistry } from "../../metrics/index.js";
import type { BitvilleTokenRequest } from "./apiContracts.js";
import {
  bitvilleCircuitBreakerPlaceholder,
  bitvilleProviderDegradationPlaceholder,
  bitvilleRetryPolicyPlaceholder,
  bitvilleTimeoutPolicyPlaceholder
} from "./policies.js";

export type BitvilleSandboxEndpoint = "/providers" | "/games" | "/api/token";

export type BitvilleDryRunRequest = {
  id: string;
  endpoint: BitvilleSandboxEndpoint;
  method: "GET" | "POST";
  correlationId: string;
  query?: Record<string, string>;
  body?: unknown;
  status: "created" | "blocked" | "timeout_simulated" | "retry_simulated";
};

export type BitvilleSandboxClient = {
  baseUrl: string;
  liveHttpEnabled: false;
  buildProvidersRequest(correlationId: string): BitvilleDryRunRequest;
  buildGamesRequest(input: { correlationId: string; provider?: string }): BitvilleDryRunRequest;
  buildTokenRequest(input: BitvilleTokenRequest): BitvilleDryRunRequest;
  simulateTimeout(requestId: string): BitvilleDryRunRequest | undefined;
  simulateRetry(requestId: string): BitvilleDryRunRequest | undefined;
  markProviderDegraded(reason: string): void;
  diagnostics(): BitvilleSandboxDiagnostics;
};

export type BitvilleSandboxDiagnostics = {
  baseUrl: string;
  liveHttpEnabled: false;
  requests: BitvilleDryRunRequest[];
  timeoutPolicy: typeof bitvilleTimeoutPolicyPlaceholder;
  retryPolicy: typeof bitvilleRetryPolicyPlaceholder;
  circuitBreaker: typeof bitvilleCircuitBreakerPlaceholder;
  providerDegradation: typeof bitvilleProviderDegradationPlaceholder;
};

export function createBitvilleSandboxClient(options: { metrics?: MetricsRegistry; baseUrl?: string } = {}): BitvilleSandboxClient {
  const requests: BitvilleDryRunRequest[] = [];
  const providerDegradation = { ...bitvilleProviderDegradationPlaceholder };
  const baseUrl = options.baseUrl ?? "https://sandbox.bitville.example.invalid";

  return {
    baseUrl,
    liveHttpEnabled: false,

    buildProvidersRequest(correlationId: string): BitvilleDryRunRequest {
      return appendRequest(requests, options.metrics, {
        endpoint: "/providers",
        method: "GET",
        correlationId
      });
    },

    buildGamesRequest(input: { correlationId: string; provider?: string }): BitvilleDryRunRequest {
      return appendRequest(requests, options.metrics, {
        endpoint: "/games",
        method: "GET",
        correlationId: input.correlationId,
        query: input.provider ? { provider: input.provider } : undefined
      });
    },

    buildTokenRequest(input: BitvilleTokenRequest): BitvilleDryRunRequest {
      return appendRequest(requests, options.metrics, {
        endpoint: "/api/token",
        method: "POST",
        correlationId: input.correlationId,
        body: {
          provider: input.provider,
          game: input.game,
          client_token: input.client_token,
          partner_token: input.partner_token,
          demoMode: input.demoMode,
          demoOverlay: input.demoOverlay
        }
      });
    },

    simulateTimeout(requestId: string): BitvilleDryRunRequest | undefined {
      const request = updateRequestStatus(requests, requestId, "timeout_simulated");
      if (request) {
        options.metrics?.increment("bitville_timeout_simulated");
      }
      return request;
    },

    simulateRetry(requestId: string): BitvilleDryRunRequest | undefined {
      const request = updateRequestStatus(requests, requestId, "retry_simulated");
      if (request) {
        options.metrics?.increment("bitville_retry_simulated");
      }
      return request;
    },

    markProviderDegraded(reason: string): void {
      providerDegradation.degraded = true;
      providerDegradation.reason = reason;
      options.metrics?.increment("bitville_provider_degraded");
    },

    diagnostics(): BitvilleSandboxDiagnostics {
      return {
        baseUrl,
        liveHttpEnabled: false,
        requests: [...requests],
        timeoutPolicy: bitvilleTimeoutPolicyPlaceholder,
        retryPolicy: bitvilleRetryPolicyPlaceholder,
        circuitBreaker: bitvilleCircuitBreakerPlaceholder,
        providerDegradation
      };
    }
  };
}

function appendRequest(
  requests: BitvilleDryRunRequest[],
  metrics: MetricsRegistry | undefined,
  input: Omit<BitvilleDryRunRequest, "id" | "status">
): BitvilleDryRunRequest {
  const request: BitvilleDryRunRequest = {
    ...input,
    id: `bitville-dry-run-${requests.length + 1}`,
    status: "blocked"
  };

  requests.push(request);
  metrics?.increment("bitville_request_created");
  metrics?.increment("bitville_request_blocked");
  return request;
}

function updateRequestStatus(
  requests: BitvilleDryRunRequest[],
  requestId: string,
  status: BitvilleDryRunRequest["status"]
): BitvilleDryRunRequest | undefined {
  const index = requests.findIndex((request) => request.id === requestId);

  if (index === -1) {
    return undefined;
  }

  const updated = {
    ...requests[index],
    status
  };
  requests[index] = updated;
  return updated;
}

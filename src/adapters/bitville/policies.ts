export type BitvilleTimeoutPolicy = {
  timeoutMs: number;
  status: "placeholder";
};

export type BitvilleRetryPolicy = {
  maxAttempts: number;
  backoffMs: number;
  status: "placeholder";
};

export type BitvilleCircuitBreakerState = {
  state: "closed" | "open" | "half_open";
  status: "placeholder";
};

export type BitvilleProviderDegradation = {
  degraded: boolean;
  reason?: string;
};

export const bitvilleTimeoutPolicyPlaceholder: BitvilleTimeoutPolicy = {
  timeoutMs: 5_000,
  status: "placeholder"
};

export const bitvilleRetryPolicyPlaceholder: BitvilleRetryPolicy = {
  maxAttempts: 0,
  backoffMs: 0,
  status: "placeholder"
};

export const bitvilleCircuitBreakerPlaceholder: BitvilleCircuitBreakerState = {
  state: "closed",
  status: "placeholder"
};

export const bitvilleProviderDegradationPlaceholder: BitvilleProviderDegradation = {
  degraded: false
};

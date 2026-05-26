export type BitvilleApiStatus = "dry_run" | "blocked" | "simulated_timeout" | "simulated_retry" | "degraded";

export type BitvilleProvider = {
  provider: string;
  name?: string;
  raw?: unknown;
};

export type BitvilleGame = {
  provider: string;
  game: string;
  name?: string;
  category?: string;
  raw?: unknown;
};

export type BitvilleTokenRequest = {
  provider: string;
  game: string;
  client_token?: string;
  partner_token?: string;
  demoMode?: boolean;
  demoOverlay?: boolean;
  correlationId: string;
};

export type BitvilleTokenResponse = {
  status: BitvilleApiStatus;
  token?: string;
  launchUrl?: string;
  blockedReason?: string;
};

export type BitvilleApiError = {
  status: BitvilleApiStatus;
  code: string;
  message: string;
};

export type BitvilleLaunchEnvelope = {
  endpoint: "/api/token";
  request: BitvilleTokenRequest;
  response?: BitvilleTokenResponse;
};

export type BitvilleProviderCatalogueResponse = {
  status: BitvilleApiStatus;
  providers: BitvilleProvider[];
  errors: BitvilleApiError[];
};

export type BitvilleGameCatalogueResponse = {
  status: BitvilleApiStatus;
  games: BitvilleGame[];
  errors: BitvilleApiError[];
};

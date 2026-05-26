import type { AggregatorName } from "../domain/index.js";

export type LaunchMode = "demo" | "real";

export type LaunchTokenState = "not_requested" | "blocked" | "placeholder" | "expired";

export type GameSessionState = "created" | "launch_blocked" | "launched" | "expired" | "abandoned" | "closed";

export type GameLaunchRequest = {
  aggregatorName: AggregatorName;
  provider: string;
  game: string;
  playerId?: string;
  mode: LaunchMode;
  demoMode?: boolean;
  demoOverlay?: boolean;
  correlationId: string;
};

export type GameLaunchResult = {
  status: "dry_run_blocked";
  externalExecution: false;
  walletChecked: false;
  coreCalled: false;
  session: GameSessionRecord;
  plan: LaunchPlanStep[];
  blockedReason: string;
};

export type LaunchPlanStep = {
  name: string;
  status: "planned" | "blocked";
  details: Record<string, unknown>;
};

export type GameSessionRecord = {
  sessionId: string;
  aggregatorName: AggregatorName;
  provider: string;
  game: string;
  playerId?: string;
  mode: LaunchMode;
  state: GameSessionState;
  tokenState: LaunchTokenState;
  correlationId: string;
  createdAt: string;
  launchedAt?: string;
  expiresAt?: string;
  abandonedAt?: string;
  closedAt?: string;
};

export type SessionLifecycleEvent = {
  sessionId: string;
  state: GameSessionState;
  occurredAt: string;
  reason?: string;
};

export type SessionExpiryPolicy = {
  ttlMs: number;
  abandonAfterMs: number;
};

export type AbandonedSessionRecord = {
  session: GameSessionRecord;
  abandonedAt: string;
  reason: string;
};

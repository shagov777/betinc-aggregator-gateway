export const simulatorScenarios = [
  "happy_path_launch",
  "duplicate_callback",
  "timeout_then_retry",
  "out_of_order_callbacks",
  "replay_attack",
  "stale_callback",
  "provider_degraded",
  "normalization_blocked",
  "uncertain_core_state"
] as const;

export type SimulatorScenario = (typeof simulatorScenarios)[number];

export type SimulatorFailureMode = "timeout" | "duplicate" | "replay_attack" | "stale" | "provider_degraded" | "uncertain_core";

export type SimulatorReplayMode = "dry_run" | "blocked" | "investigate";

export type SimulatorOutcome = "completed" | "blocked" | "quarantined" | "investigate";

export type SimulatorEvent = {
  type: string;
  timestamp: string;
  message: string;
  details?: unknown;
};

export type SimulatorStep = {
  name: string;
  outcome: SimulatorOutcome;
  details?: unknown;
};

export type SimulatorExecutionResult = {
  scenario: SimulatorScenario;
  outcome: SimulatorOutcome;
  externalExecution: false;
  walletMutation: false;
  steps: SimulatorStep[];
  events: SimulatorEvent[];
};

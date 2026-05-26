import type { MetricsRegistry } from "../metrics/index.js";
import type { GameLaunchRequest, GameLaunchResult, LaunchPlanStep } from "./sessionTypes.js";
import type { SessionRegistry } from "./sessionRegistry.js";

export type LaunchOrchestrator = {
  createLaunchPlan(request: GameLaunchRequest): GameLaunchResult;
};

export function createLaunchOrchestrator(options: { sessions: SessionRegistry; metrics?: MetricsRegistry }): LaunchOrchestrator {
  return {
    createLaunchPlan(request: GameLaunchRequest): GameLaunchResult {
      options.metrics?.increment("launch_requested");

      const session = options.sessions.createSession(request);
      const blockedSession = options.sessions.markAbandoned(
        session.sessionId,
        "Live launch is blocked pending credentials and runtime confirmation."
      );

      options.metrics?.increment("launch_blocked");

      return {
        status: "dry_run_blocked",
        externalExecution: false,
        walletChecked: false,
        coreCalled: false,
        session: blockedSession ?? session,
        plan: createBitvilleLaunchPlan(request),
        blockedReason: "No real Bitville launch calls, token generation, wallet checks, or core calls are allowed in foundation mode."
      };
    }
  };
}

function createBitvilleLaunchPlan(request: GameLaunchRequest): LaunchPlanStep[] {
  return [
    {
      name: "request /api/token",
      status: "blocked",
      details: {
        documentedPath: "/api/token",
        token: "blocked",
        client_token: "blocked",
        partner_token: "blocked"
      }
    },
    {
      name: "prepare launch parameters",
      status: "planned",
      details: {
        provider: request.provider,
        game: request.game,
        demoMode: request.demoMode ?? request.mode === "demo",
        demoOverlay: request.demoOverlay ?? false
      }
    },
    {
      name: "external Bitville launch",
      status: "blocked",
      details: {
        reason: "Live launch is blocked pending credentials/runtime confirmation."
      }
    }
  ];
}

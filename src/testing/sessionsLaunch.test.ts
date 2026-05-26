import { describe, expect, it } from "vitest";
import { coreClientPlaceholder } from "../coreClient/index.js";
import { createInMemoryGatewayEventEmitter } from "../events/index.js";
import { createDiagnosticsRouter } from "../http/diagnostics.js";
import { createInMemoryMetricsRegistry } from "../metrics/index.js";
import {
  bitvilleLaunchTerminology,
  createInMemorySessionRegistry,
  createLaunchOrchestrator,
  type GameLaunchRequest
} from "../sessions/index.js";

describe("session and launch orchestration scaffolding", () => {
  it("creates, lists, and gets sessions", () => {
    const metrics = createInMemoryMetricsRegistry();
    const sessions = createInMemorySessionRegistry(metrics);
    const session = sessions.createSession(createLaunchRequest("corr-session"));

    expect(sessions.getSession(session.sessionId)).toEqual(session);
    expect(sessions.listSessions()).toEqual([session]);
    expect(sessions.listEvents(session.sessionId)).toMatchObject([
      {
        sessionId: session.sessionId,
        state: "created"
      }
    ]);
    expect(metrics.snapshot().session_created).toBe(1);
  });

  it("marks sessions launched, expired, abandoned, and closed", () => {
    const metrics = createInMemoryMetricsRegistry();
    const sessions = createInMemorySessionRegistry(metrics);
    const launched = sessions.createSession(createLaunchRequest("corr-launched"));
    const expired = sessions.createSession(createLaunchRequest("corr-expired"));
    const abandoned = sessions.createSession(createLaunchRequest("corr-abandoned"));
    const closed = sessions.createSession(createLaunchRequest("corr-closed"));

    expect(sessions.markLaunched(launched.sessionId)).toMatchObject({
      state: "launched",
      tokenState: "placeholder"
    });
    expect(sessions.markExpired(expired.sessionId)).toMatchObject({
      state: "expired",
      tokenState: "expired"
    });
    expect(sessions.markAbandoned(abandoned.sessionId, "test abandonment")).toMatchObject({
      state: "abandoned",
      tokenState: "blocked"
    });
    expect(sessions.closeSession(closed.sessionId)).toMatchObject({
      state: "closed"
    });
    expect(metrics.snapshot()).toMatchObject({
      session_launched: 1,
      session_expired: 1,
      session_abandoned: 1,
      session_closed: 1
    });
  });

  it("creates dry-run launch plans that block external execution", () => {
    const metrics = createInMemoryMetricsRegistry();
    const sessions = createInMemorySessionRegistry(metrics);
    const launch = createLaunchOrchestrator({ sessions, metrics });

    const result = launch.createLaunchPlan(createLaunchRequest("corr-launch"));

    expect(result).toMatchObject({
      status: "dry_run_blocked",
      externalExecution: false,
      walletChecked: false,
      coreCalled: false,
      session: {
        state: "abandoned",
        tokenState: "blocked"
      }
    });
    expect(result.plan.map((step) => [step.name, step.status])).toEqual([
      ["request /api/token", "blocked"],
      ["prepare launch parameters", "planned"],
      ["external Bitville launch", "blocked"]
    ]);
    expect(result.plan[0]?.details).toMatchObject({
      documentedPath: "/api/token",
      token: "blocked",
      client_token: "blocked",
      partner_token: "blocked"
    });
    expect(metrics.snapshot()).toMatchObject({
      launch_requested: 1,
      launch_blocked: 1,
      session_created: 1,
      session_abandoned: 1
    });
  });

  it("preserves documented Bitville launch terminology without making live calls", () => {
    expect(bitvilleLaunchTerminology).toEqual({
      tokenPath: "/api/token",
      token: "token",
      clientToken: "client_token",
      partnerToken: "partner_token",
      provider: "provider",
      game: "game",
      demoMode: "demoMode",
      demoOverlay: "demoOverlay",
      status: "live-launch-blocked"
    });
  });

  it("serves session diagnostics route", () => {
    const metrics = createInMemoryMetricsRegistry();
    const sessions = createInMemorySessionRegistry(metrics);
    const session = sessions.createSession(createLaunchRequest("corr-diagnostics-session"));
    sessions.markExpired(session.sessionId);
    const router = createDiagnosticsRouter({
      events: createInMemoryGatewayEventEmitter(),
      metrics,
      sessions
    });

    expect(callRouterGet(router, "/diagnostics/sessions")).toMatchObject({
      statusCode: 200,
      body: {
        developmentOnly: true,
        sessions: [
          {
            sessionId: session.sessionId,
            state: "expired",
            tokenState: "expired"
          }
        ],
        lifecycleEvents: [
          {
            sessionId: session.sessionId,
            state: "created"
          },
          {
            sessionId: session.sessionId,
            state: "expired"
          }
        ]
      }
    });
  });

  it("does not execute core or external Bitville launch", () => {
    const metrics = createInMemoryMetricsRegistry();
    const sessions = createInMemorySessionRegistry(metrics);
    const launch = createLaunchOrchestrator({ sessions, metrics });
    const result = launch.createLaunchPlan(createLaunchRequest("corr-no-execution"));

    expect(coreClientPlaceholder.connected).toBe(false);
    expect(result.coreCalled).toBe(false);
    expect(result.externalExecution).toBe(false);
  });
});

function createLaunchRequest(correlationId: string): GameLaunchRequest {
  return {
    aggregatorName: "bitville",
    provider: "documentation-derived-provider",
    game: "documentation-derived-game",
    playerId: "player-placeholder",
    mode: "demo",
    demoMode: true,
    demoOverlay: false,
    correlationId
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

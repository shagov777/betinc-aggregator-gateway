import { randomUUID } from "node:crypto";
import type { MetricsRegistry } from "../metrics/index.js";
import type { GameLaunchRequest, GameSessionRecord, GameSessionState, SessionLifecycleEvent } from "./sessionTypes.js";

export type SessionRegistry = {
  createSession(request: GameLaunchRequest): GameSessionRecord;
  getSession(sessionId: string): GameSessionRecord | undefined;
  listSessions(): GameSessionRecord[];
  markLaunched(sessionId: string): GameSessionRecord | undefined;
  markExpired(sessionId: string): GameSessionRecord | undefined;
  markAbandoned(sessionId: string, reason?: string): GameSessionRecord | undefined;
  closeSession(sessionId: string): GameSessionRecord | undefined;
  listEvents(sessionId?: string): SessionLifecycleEvent[];
};

export function createInMemorySessionRegistry(metrics?: MetricsRegistry): SessionRegistry {
  const sessions = new Map<string, GameSessionRecord>();
  const lifecycleEvents: SessionLifecycleEvent[] = [];

  return {
    createSession(request: GameLaunchRequest): GameSessionRecord {
      const session: GameSessionRecord = {
        sessionId: randomUUID(),
        aggregatorName: request.aggregatorName,
        provider: request.provider,
        game: request.game,
        playerId: request.playerId,
        mode: request.mode,
        state: "created",
        tokenState: "not_requested",
        correlationId: request.correlationId,
        createdAt: new Date().toISOString()
      };

      sessions.set(session.sessionId, session);
      lifecycleEvents.push(lifecycleEvent(session, "created"));
      metrics?.increment("session_created");
      return session;
    },

    getSession(sessionId: string): GameSessionRecord | undefined {
      return sessions.get(sessionId);
    },

    listSessions(): GameSessionRecord[] {
      return [...sessions.values()];
    },

    markLaunched(sessionId: string): GameSessionRecord | undefined {
      return updateSession(sessions, lifecycleEvents, metrics, sessionId, "launched", "session_launched", {
        tokenState: "placeholder",
        launchedAt: new Date().toISOString()
      });
    },

    markExpired(sessionId: string): GameSessionRecord | undefined {
      return updateSession(sessions, lifecycleEvents, metrics, sessionId, "expired", "session_expired", {
        tokenState: "expired",
        expiresAt: new Date().toISOString()
      });
    },

    markAbandoned(sessionId: string, reason = "Session abandoned before launch completion."): GameSessionRecord | undefined {
      return updateSession(sessions, lifecycleEvents, metrics, sessionId, "abandoned", "session_abandoned", {
        abandonedAt: new Date().toISOString(),
        tokenState: "blocked",
        reason
      });
    },

    closeSession(sessionId: string): GameSessionRecord | undefined {
      return updateSession(sessions, lifecycleEvents, metrics, sessionId, "closed", "session_closed", {
        closedAt: new Date().toISOString()
      });
    },

    listEvents(sessionId?: string): SessionLifecycleEvent[] {
      return lifecycleEvents.filter((event) => sessionId === undefined || event.sessionId === sessionId);
    }
  };
}

function updateSession(
  sessions: Map<string, GameSessionRecord>,
  lifecycleEvents: SessionLifecycleEvent[],
  metrics: MetricsRegistry | undefined,
  sessionId: string,
  state: GameSessionState,
  metric: Parameters<MetricsRegistry["increment"]>[0],
  changes: Partial<GameSessionRecord> & { reason?: string }
): GameSessionRecord | undefined {
  const existing = sessions.get(sessionId);

  if (!existing) {
    return undefined;
  }

  const updated = {
    ...existing,
    ...changes,
    state
  };

  sessions.set(sessionId, updated);
  lifecycleEvents.push(lifecycleEvent(updated, state, changes.reason));
  metrics?.increment(metric);
  return updated;
}

function lifecycleEvent(session: GameSessionRecord, state: GameSessionState, reason?: string): SessionLifecycleEvent {
  return {
    sessionId: session.sessionId,
    state,
    occurredAt: new Date().toISOString(),
    reason
  };
}

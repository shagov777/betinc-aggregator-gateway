import type { AggregatorName } from "../domain/index.js";

export type SyncRetryState = {
  attempts: number;
  nextRetryAt?: string;
  lastError?: string;
};

export type DeadLetteredSync = {
  aggregatorName: AggregatorName;
  failedAt: string;
  reason: string;
};

export type SyncLock = {
  locked: boolean;
  lockedAt?: string;
  owner?: string;
};

export type SyncSchedulerPlaceholder = {
  enabled: false;
  retryState: SyncRetryState;
  deadLetters: DeadLetteredSync[];
  lock: SyncLock;
};

export function createSyncSchedulerPlaceholder(): SyncSchedulerPlaceholder {
  return {
    enabled: false,
    retryState: {
      attempts: 0
    },
    deadLetters: [],
    lock: {
      locked: false
    }
  };
}

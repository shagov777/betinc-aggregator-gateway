import type { RawCallbackArchive } from "../archive/archiveTypes.js";
import type { ReplayPlan } from "./replayTypes.js";

export type ReplayService = {
  createDryRunReplayPlan(archivedCallbackId: string): Promise<ReplayPlan | undefined>;
};

export function createReplayService(archive: RawCallbackArchive): ReplayService {
  return {
    async createDryRunReplayPlan(archivedCallbackId: string): Promise<ReplayPlan | undefined> {
      const archivedCallback = await archive.getArchivedCallback(archivedCallbackId);

      if (!archivedCallback) {
        return undefined;
      }

      return {
        mode: "dry-run",
        executed: false,
        archivedCallback,
        steps: [
          {
            archivedCallbackId: archivedCallback.id,
            correlationId: archivedCallback.correlationId,
            action: "inspect_only",
            reason: "wallet_semantics_blocked"
          },
          {
            archivedCallbackId: archivedCallback.id,
            correlationId: archivedCallback.correlationId,
            action: "inspect_only",
            reason: "core_client_not_connected"
          }
        ]
      };
    }
  };
}

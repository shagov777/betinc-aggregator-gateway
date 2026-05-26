import type { ArchivedRawCallback } from "../archive/archiveTypes.js";

export type ReplayExecutionMode = "dry-run";

export type ReplayPlanStep = {
  archivedCallbackId: string;
  correlationId: string;
  action: "inspect_only";
  reason: "wallet_semantics_blocked" | "core_client_not_connected";
};

export type ReplayPlan = {
  mode: ReplayExecutionMode;
  executed: false;
  archivedCallback: ArchivedRawCallback;
  steps: ReplayPlanStep[];
};

import type { ArchivedRawCallback, RawCallbackArchive } from "../archive/archiveTypes.js";
import type { GatewayEventEmitter } from "../events/index.js";
import type { MetricsRegistry } from "../metrics/index.js";
import type { ValidationResult } from "../validation/index.js";
import type { QuarantineStore, QuarantinedCallback } from "./quarantine.js";

export type PipelineStageResult = {
  stage: "received" | "validation" | "archive" | "quarantine" | "normalization";
  status: "completed" | "failed" | "blocked";
  message: string;
};

export type PipelineResult = {
  executed: false;
  status: "normalization_blocked" | "quarantined";
  validation: ValidationResult;
  archivedCallback?: ArchivedRawCallback;
  quarantinedCallback?: QuarantinedCallback;
  stages: PipelineStageResult[];
};

export type PipelineDependencies = {
  archive: RawCallbackArchive;
  events: GatewayEventEmitter;
  metrics: MetricsRegistry;
  quarantine: QuarantineStore;
};

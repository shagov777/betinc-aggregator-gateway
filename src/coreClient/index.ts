export type CoreClientPlaceholder = {
  status: "not-connected";
  connected: false;
};

export const coreClientPlaceholder: CoreClientPlaceholder = {
  status: "not-connected",
  connected: false
};

export type {
  CoreCommand,
  CoreCommandStatus,
  CoreCommandType,
  CoreCompensatingActionReference,
  CoreCorrelationContext,
  CoreExecutionFailure,
  CoreExecutionResult,
  CoreTimeoutResult
} from "./coreTypes.js";
export type {
  CoreCommandPayload,
  FreespinSettlementRequest,
  SessionRegistrationRequest,
  WalletBalanceRequest,
  WalletCancelRequest,
  WalletCreditRequest,
  WalletDebitRequest
} from "./commandDtos.js";
export type { CoreReconciliationState, DriftResolutionStatus, DriftSeverity, GatewayCoreDrift } from "./reconciliationTypes.js";
export { createCoreDryRunTransport, type CoreDryRunSimulation, type CoreDryRunTransport } from "./dryRunTransport.js";

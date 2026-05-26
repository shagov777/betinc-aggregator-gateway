export type CoreCommandType =
  | "wallet.balance"
  | "wallet.debit"
  | "wallet.credit"
  | "wallet.cancel"
  | "session.register"
  | "freespin.settle";

export type CoreCommandStatus =
  | "created"
  | "accepted"
  | "rejected"
  | "timeout"
  | "uncertain"
  | "compensating_action_required"
  | "retry_prohibited"
  | "retry_allowed"
  | "blocked";

export type CoreCorrelationContext = {
  correlationId: string;
  causationId?: string;
  externalReference?: string;
};

export type CoreCompensatingActionReference = {
  required: boolean;
  reason: string;
  referenceId?: string;
};

export type CoreCommand<TPayload = unknown> = {
  id: string;
  type: CoreCommandType;
  status: CoreCommandStatus;
  correlation: CoreCorrelationContext;
  payload: TPayload;
  createdAt: string;
};

export type CoreExecutionFailure = {
  status: "rejected";
  reason: string;
  retry: "retry_prohibited" | "retry_allowed";
};

export type CoreTimeoutResult = {
  status: "timeout";
  reason: string;
  retry: "retry_prohibited";
  uncertainExecutionState: true;
};

export type CoreExecutionResult =
  | {
      status: "accepted";
      command: CoreCommand;
      coreReferenceId: string;
      retry: "retry_prohibited";
    }
  | {
      status: "rejected";
      command: CoreCommand;
      failure: CoreExecutionFailure;
    }
  | {
      status: "timeout";
      command: CoreCommand;
      timeout: CoreTimeoutResult;
    }
  | {
      status: "uncertain";
      command: CoreCommand;
      retry: "retry_prohibited";
      compensatingAction: CoreCompensatingActionReference;
    }
  | {
      status: "blocked";
      command: CoreCommand;
      reason: string;
      retry: "retry_prohibited";
    };

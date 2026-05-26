import type {
  CallbackType,
  CoreCommandResult,
  RawCallbackEnvelope,
  NormalizedGatewayCommand
} from "../domain/index.js";

export type RawCallbackParser = {
  parse(input: {
    callbackType: CallbackType;
    method: string;
    path: string;
    headers: RawCallbackEnvelope["headers"];
    body: unknown;
    correlationId: string;
    receivedAt: string;
  }): RawCallbackEnvelope;
};

export type CallbackSecurityValidator = {
  validate(envelope: RawCallbackEnvelope): Promise<{
    valid: boolean;
    reason?: string;
  }>;
};

export type CallbackNormalizer = {
  normalize(envelope: RawCallbackEnvelope): Promise<NormalizedGatewayCommand>;
};

export type ResponseMapper = {
  mapCoreResult(result: CoreCommandResult): unknown;
};

export type AggregatorAdapter = {
  name: string;
  status: "placeholder" | "ready";
  parser: RawCallbackParser;
  securityValidator: CallbackSecurityValidator;
  normalizer: CallbackNormalizer;
  responseMapper: ResponseMapper;
};

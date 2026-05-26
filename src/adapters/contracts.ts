import type { CallbackType, CoreCommandResult, RawCallbackEnvelope } from "../domain/index.js";
import type { AdapterCapabilityModel, NormalizationResult } from "../normalization/index.js";

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
  normalize(envelope: RawCallbackEnvelope): Promise<NormalizationResult>;
};

export type ResponseMapper = {
  mapCoreResult(result: CoreCommandResult): unknown;
};

export type AggregatorAdapter = {
  name: string;
  status: "placeholder" | "ready";
  capabilities: AdapterCapabilityModel;
  parser: RawCallbackParser;
  securityValidator: CallbackSecurityValidator;
  normalizer: CallbackNormalizer;
  responseMapper: ResponseMapper;
};

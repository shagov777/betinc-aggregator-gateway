import type { CanonicalNormalizedRequest } from "./dtos.js";

export type NormalizationStatus = "normalized" | "normalization_blocked" | "unsupported" | "invalid";

export type NormalizationIssue = {
  field?: string;
  code:
    | "provider_contract_unresolved"
    | "financial_semantics_unresolved"
    | "unsupported_callback"
    | "unknown_provider_field"
    | "unsupported_field";
  message: string;
};

export type UnsupportedField = {
  field: string;
  reason: string;
};

export type UnknownProviderField = {
  field: string;
  rawValueType: string;
};

export type NormalizationResult =
  | {
      status: "normalized";
      normalized: CanonicalNormalizedRequest;
      issues: NormalizationIssue[];
      unsupportedFields: UnsupportedField[];
      unknownProviderFields: UnknownProviderField[];
    }
  | {
      status: Exclude<NormalizationStatus, "normalized">;
      normalized?: undefined;
      issues: NormalizationIssue[];
      unsupportedFields: UnsupportedField[];
      unknownProviderFields: UnknownProviderField[];
    };

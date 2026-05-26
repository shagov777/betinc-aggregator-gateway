import type {
  AggregatorAdapter,
  CallbackNormalizer,
  CallbackSecurityValidator,
  RawCallbackParser,
  ResponseMapper
} from "../contracts.js";

const bitvilleRawOperationNames = [
  "providers list",
  "categories list",
  "games list",
  "token",
  "launch JS flow",
  "balance",
  "debit",
  "credit",
  "cancel",
  "promo/freespins"
] as const;

export type BitvilleRawOperationName = (typeof bitvilleRawOperationNames)[number];

export type BitvilleRawCallbackPlaceholder = {
  rawOperationName: Extract<BitvilleRawOperationName, "balance" | "debit" | "credit" | "cancel" | "promo/freespins">;
  rawPayload: unknown;
};

const parser: RawCallbackParser = {
  parse() {
    throw new Error("Bitville raw callback parsing is blocked pending raw contract answers.");
  }
};

const securityValidator: CallbackSecurityValidator = {
  async validate() {
    return {
      valid: false,
      reason: "Bitville callback security rules are unresolved."
    };
  }
};

const normalizer: CallbackNormalizer = {
  async normalize() {
    throw new Error("Bitville callback normalization is blocked pending financial semantic answers.");
  }
};

const responseMapper: ResponseMapper = {
  mapCoreResult() {
    return {
      status: "blocked",
      reason: "Bitville response contract is unresolved."
    };
  }
};

export const bitvilleAdapterPlaceholder: AggregatorAdapter = {
  name: "bitville",
  status: "placeholder",
  parser,
  securityValidator,
  normalizer,
  responseMapper
};

// Confirmed raw Bitville operation names are listed in docs/integrations/bitville/raw-contract.md.
// TODO(open-question): exact HTTP paths, methods, request fields, response fields, auth, amount
// representation, cancel semantics, retry behavior, and promo/freespins behavior remain unresolved.

import type {
  AggregatorAdapter,
  CallbackNormalizer,
  CallbackSecurityValidator,
  RawCallbackParser,
  ResponseMapper
} from "../contracts.js";
import type { AdapterCapabilityModel, NormalizationResult, UnknownProviderField } from "../../normalization/index.js";
import type { RawCallbackEnvelope } from "../../domain/index.js";

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

export const bitvilleCapabilities: AdapterCapabilityModel = {
  supportedCallbacks: ["balance", "debit", "credit", "cancel", "promo/freespins"],
  providerCapabilities: {
    supportsPromoFlows: false,
    supportsRollback: false,
    supportsMultiCreditRounds: false
  },
  supportsPromoFlows: false,
  supportsRollback: false,
  supportsMultiCreditRounds: false,
  schemaVersion: {
    major: 0,
    minor: 1,
    patch: 0
  },
  apiVersion: "unconfirmed",
  compatibilityState: "blocked"
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
  async normalize(envelope: RawCallbackEnvelope): Promise<NormalizationResult> {
    return createBitvilleNormalizationBlockedResult(envelope);
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
  capabilities: bitvilleCapabilities,
  parser,
  securityValidator,
  normalizer,
  responseMapper
};

export function createBitvilleNormalizationBlockedResult(envelope: RawCallbackEnvelope): NormalizationResult {
  return {
    status: "normalization_blocked",
    issues: [
      {
        code: "provider_contract_unresolved",
        message: "Bitville raw callback field names and response contract remain unresolved."
      },
      {
        code: "financial_semantics_unresolved",
        message: "Bitville amount, cancel, ordering, rollback, and promo/freespins semantics remain unresolved."
      }
    ],
    unsupportedFields: unsupportedFieldsFor(envelope),
    unknownProviderFields: unknownProviderFieldsFor(envelope.rawBody)
  };
}

function unsupportedFieldsFor(envelope: RawCallbackEnvelope) {
  return envelope.callbackType === "promo/freespins"
    ? [
        {
          field: "promo/freespins",
          reason: "Promo/free-spin flows are documented as an operation name only; lifecycle semantics are unresolved."
        }
      ]
    : [];
}

function unknownProviderFieldsFor(rawBody: unknown): UnknownProviderField[] {
  if (rawBody === null || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return [];
  }

  return Object.entries(rawBody).map(([field, value]) => ({
    field,
    rawValueType: value === null ? "null" : Array.isArray(value) ? "array" : typeof value
  }));
}

// Confirmed raw Bitville operation names are listed in docs/integrations/bitville/raw-contract.md.
// TODO(open-question): exact HTTP paths, methods, request fields, response fields, auth, amount
// representation, cancel semantics, retry behavior, and promo/freespins behavior remain unresolved.

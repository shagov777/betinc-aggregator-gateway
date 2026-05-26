import { describe, expect, it } from "vitest";
import { bitvilleAdapterPlaceholder, bitvilleCapabilities } from "../adapters/bitville/index.js";
import { createAdapterRegistry } from "../adapters/registry.js";
import { coreClientPlaceholder } from "../coreClient/index.js";
import type { RawCallbackEnvelope } from "../domain/index.js";
import type {
  NormalizedBalanceRequest,
  NormalizedCancelRequest,
  NormalizedCreditRequest,
  NormalizedDebitRequest,
  NormalizedMonetaryAmount
} from "../normalization/index.js";
import { compareSchemaVersions, detectBreakingChange } from "../schema/index.js";

describe("normalization contracts and schema evolution scaffolding", () => {
  it("exports canonical normalized DTO contracts", () => {
    const raw = createEnvelope("balance", {});
    const amount: NormalizedMonetaryAmount = {
      rawAmount: "10.00",
      rawCurrency: "ZAR",
      unresolvedReason: "Bitville amount format is unresolved."
    };
    const balance: NormalizedBalanceRequest = {
      aggregatorName: "bitville",
      callbackType: "balance",
      correlationId: "corr-dto",
      raw,
      player: {},
      session: {}
    };
    const debit: NormalizedDebitRequest = {
      aggregatorName: "bitville",
      callbackType: "debit",
      correlationId: "corr-dto",
      raw: createEnvelope("debit", {}),
      player: {},
      game: {},
      session: {},
      transaction: {},
      amount
    };
    const credit: NormalizedCreditRequest = {
      ...debit,
      callbackType: "credit",
      raw: createEnvelope("credit", {})
    };
    const cancel: NormalizedCancelRequest = {
      aggregatorName: "bitville",
      callbackType: "cancel",
      correlationId: "corr-dto",
      raw: createEnvelope("cancel", {}),
      player: {},
      game: {},
      session: {},
      transaction: {}
    };

    expect([balance.callbackType, debit.callbackType, credit.callbackType, cancel.callbackType]).toEqual([
      "balance",
      "debit",
      "credit",
      "cancel"
    ]);
    expect(debit.amount.unresolvedReason).toContain("unresolved");
  });

  it("exposes Bitville placeholder capabilities through the adapter registry", () => {
    const registry = createAdapterRegistry();

    expect(registry.getAdapter("bitville")?.capabilities).toEqual(bitvilleCapabilities);
    expect(bitvilleCapabilities).toMatchObject({
      supportedCallbacks: ["balance", "debit", "credit", "cancel", "promo/freespins"],
      supportsPromoFlows: false,
      supportsRollback: false,
      supportsMultiCreditRounds: false,
      apiVersion: "unconfirmed",
      compatibilityState: "blocked"
    });
  });

  it("compares schema versions and detects breaking changes", () => {
    expect(compareSchemaVersions({ major: 0, minor: 1, patch: 0 }, { major: 0, minor: 1, patch: 1 })).toMatchObject({
      compatible: true,
      severity: "patch"
    });
    expect(compareSchemaVersions({ major: 0, minor: 1, patch: 0 }, { major: 0, minor: 2, patch: 0 })).toMatchObject({
      compatible: true,
      severity: "minor"
    });

    const majorChange = compareSchemaVersions({ major: 0, minor: 1, patch: 0 }, { major: 1, minor: 0, patch: 0 });

    expect(majorChange).toMatchObject({
      compatible: false,
      severity: "major"
    });
    expect(detectBreakingChange(majorChange)).toBe(true);
  });

  it("returns normalization_blocked for Bitville without mapping financial fields", async () => {
    const result = await bitvilleAdapterPlaceholder.normalizer.normalize(
      createEnvelope("debit", {
        transaction_id: "unconfirmed-field",
        amount: "10.00",
        client_token: "redacted-before-diagnostics"
      })
    );

    expect(result.status).toBe("normalization_blocked");
    expect(result.normalized).toBeUndefined();
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "provider_contract_unresolved",
      "financial_semantics_unresolved"
    ]);
    expect(result.unknownProviderFields.map((field) => field.field)).toEqual(["transaction_id", "amount", "client_token"]);
  });

  it("captures unsupported promo/freespins fields without enabling promo semantics", async () => {
    const result = await bitvilleAdapterPlaceholder.normalizer.normalize(createEnvelope("promo/freespins", {}));

    expect(result.status).toBe("normalization_blocked");
    expect(result.unsupportedFields).toEqual([
      {
        field: "promo/freespins",
        reason: "Promo/free-spin flows are documented as an operation name only; lifecycle semantics are unresolved."
      }
    ]);
  });

  it("keeps the core client disconnected", () => {
    expect(coreClientPlaceholder.connected).toBe(false);
  });
});

function createEnvelope(callbackType: RawCallbackEnvelope["callbackType"], rawBody: unknown): RawCallbackEnvelope {
  return {
    aggregatorName: "bitville",
    callbackType,
    correlationId: "corr-normalization",
    receivedAt: "2026-05-26T00:00:00.000Z",
    method: "POST",
    path: "/bitville/callback",
    headers: {},
    rawBody
  };
}

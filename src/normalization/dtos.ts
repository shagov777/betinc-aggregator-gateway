import type { AggregatorName, CallbackType, RawCallbackEnvelope } from "../domain/index.js";

export type NormalizedPlayerIdentity = {
  externalPlayerId?: string;
  corePlayerId?: string;
  unresolvedRawFields?: string[];
};

export type NormalizedGameIdentity = {
  providerCode?: string;
  gameCode?: string;
  externalGameId?: string;
  unresolvedRawFields?: string[];
};

export type NormalizedSessionIdentity = {
  externalSessionId?: string;
  tokenReference?: string;
  unresolvedRawFields?: string[];
};

export type NormalizedTransactionReference = {
  externalTransactionId?: string;
  externalRoundId?: string;
  relatedExternalTransactionId?: string;
  unresolvedRawFields?: string[];
};

export type NormalizedMonetaryAmount = {
  amountMinor?: number;
  currencyCode?: string;
  rawAmount?: unknown;
  rawCurrency?: unknown;
  unresolvedReason?: string;
};

export type NormalizedRequestBase = {
  aggregatorName: AggregatorName;
  callbackType: CallbackType;
  correlationId: string;
  raw: RawCallbackEnvelope;
};

export type NormalizedBalanceRequest = NormalizedRequestBase & {
  callbackType: "balance";
  player: NormalizedPlayerIdentity;
  session: NormalizedSessionIdentity;
};

export type NormalizedDebitRequest = NormalizedRequestBase & {
  callbackType: "debit";
  player: NormalizedPlayerIdentity;
  game: NormalizedGameIdentity;
  session: NormalizedSessionIdentity;
  transaction: NormalizedTransactionReference;
  amount: NormalizedMonetaryAmount;
};

export type NormalizedCreditRequest = NormalizedRequestBase & {
  callbackType: "credit";
  player: NormalizedPlayerIdentity;
  game: NormalizedGameIdentity;
  session: NormalizedSessionIdentity;
  transaction: NormalizedTransactionReference;
  amount: NormalizedMonetaryAmount;
};

export type NormalizedCancelRequest = NormalizedRequestBase & {
  callbackType: "cancel";
  player: NormalizedPlayerIdentity;
  game: NormalizedGameIdentity;
  session: NormalizedSessionIdentity;
  transaction: NormalizedTransactionReference;
};

export type CanonicalNormalizedRequest =
  | NormalizedBalanceRequest
  | NormalizedDebitRequest
  | NormalizedCreditRequest
  | NormalizedCancelRequest;

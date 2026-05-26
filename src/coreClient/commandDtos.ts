import type { NormalizedMonetaryAmount } from "../normalization/index.js";
import type { CoreCorrelationContext } from "./coreTypes.js";

export type WalletBalanceRequest = {
  playerId?: string;
  walletId?: string;
  currencyCode?: string;
  correlation: CoreCorrelationContext;
};

export type WalletDebitRequest = {
  playerId?: string;
  walletId?: string;
  amount: NormalizedMonetaryAmount;
  transactionReference?: string;
  correlation: CoreCorrelationContext;
};

export type WalletCreditRequest = {
  playerId?: string;
  walletId?: string;
  amount: NormalizedMonetaryAmount;
  transactionReference?: string;
  correlation: CoreCorrelationContext;
};

export type WalletCancelRequest = {
  playerId?: string;
  walletId?: string;
  transactionReference?: string;
  cancellationReference?: string;
  correlation: CoreCorrelationContext;
};

export type SessionRegistrationRequest = {
  playerId?: string;
  sessionId: string;
  provider: string;
  game: string;
  correlation: CoreCorrelationContext;
};

export type FreespinSettlementRequest = {
  playerId?: string;
  entitlementReference?: string;
  settlementReference?: string;
  amount?: NormalizedMonetaryAmount;
  correlation: CoreCorrelationContext;
};

export type CoreCommandPayload =
  | WalletBalanceRequest
  | WalletDebitRequest
  | WalletCreditRequest
  | WalletCancelRequest
  | SessionRegistrationRequest
  | FreespinSettlementRequest;

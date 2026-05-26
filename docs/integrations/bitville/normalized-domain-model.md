# Bitville Normalized Domain Model

This document defines BetInc gateway vocabulary for Bitville integration. It is not a database schema and does not require any `betinc-core` modification.

## Naming Rule

- Raw Bitville names stay raw at the adapter boundary.
- BetInc normalized names are used inside the gateway after validation.
- `betinc-core` command names and payloads remain owned by `betinc-core`.

## Normalized Entities

| BetInc normalized name | Raw Bitville source | Purpose |
| --- | --- | --- |
| `Aggregator` | Bitville integration configuration | Identifies Bitville as the external integration source. |
| `ExternalProvider` | `providers list` | Provider catalog record as supplied by Bitville. |
| `ExternalCategory` | `categories list` | Category catalog record as supplied by Bitville. |
| `ExternalGame` | `games list` | Launchable game metadata as supplied by Bitville. |
| `PlayerSession` | `token`, `launch JS flow` | Gateway representation of a player launch/session context. |
| `WalletBalanceQuery` | `balance` | Normalized request to read wallet balance from `betinc-core`. |
| `WalletDebitCommand` | `debit` | Normalized stake command sent to `betinc-core`. |
| `WalletCreditCommand` | `credit` | Normalized payout or settlement command sent to `betinc-core`. |
| `WalletCancelCommand` | `cancel` | Normalized reversal/cancel intent sent to `betinc-core`. |
| `PromotionEntitlement` | `promo/freespins` | Normalized promotional/free-spin entitlement record or command. |
| `ExternalTransaction` | `debit`, `credit`, `cancel` | Gateway tracking record for one Bitville-originated financial callback. |
| `IdempotencyRecord` | Callback identity fields, exact raw names pending | Gateway record used to make callbacks replay-safe. |
| `ReconciliationRecord` | Bitville reports or transaction exports, exact source pending | Gateway record used to compare Bitville activity with core ledger outcomes. |

## Normalized Financial Concepts

| BetInc normalized name | Meaning |
| --- | --- |
| `externalTransactionId` | Bitville-provided transaction identifier. Exact raw field name pending. |
| `externalRoundId` | Bitville-provided game round identifier. Exact raw field name pending. |
| `externalPlayerId` | Bitville-provided player identifier or token subject. Exact raw field name pending. |
| `corePlayerId` | BetInc player identifier accepted by `betinc-core`. |
| `coreWalletId` | BetInc wallet identifier accepted by `betinc-core`, if separate from player identity. |
| `amountMinor` | Normalized integer amount in minor currency units, if Bitville precision allows this safely. |
| `currencyCode` | ISO-style currency code or configured wallet currency. Exact Bitville raw field pending. |
| `gameCode` | Normalized external game identifier from `games list`. Exact raw field pending. |
| `providerCode` | Normalized external provider identifier from `providers list`. Exact raw field pending. |
| `transactionType` | One of `balance`, `debit`, `credit`, `cancel`, `promo/freespins` at the gateway domain level. |

## Core Mapping Direction

The gateway maps Bitville callbacks into stable internal commands:

- `balance` -> core wallet balance read.
- `debit` -> core wallet debit command.
- `credit` -> core wallet credit command.
- `cancel` -> core reversal/cancel command, or compensating command if core requires that shape.
- `promo/freespins` -> promotion entitlement workflow outside core ledger unless the promotion creates a financial event.

The exact command payloads must be derived from existing `betinc-core` APIs without changing core contracts.

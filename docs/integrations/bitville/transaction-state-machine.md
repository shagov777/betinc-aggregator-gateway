# Bitville Transaction State Machine

This document describes gateway transaction states for Bitville callbacks. It does not define `betinc-core` ledger states.

## Authority Rule

The gateway tracks adapter processing state only. `betinc-core` remains authoritative for wallet balance, ledger mutation, audit evidence, and final financial outcome.

## Gateway States

| State | Meaning |
| --- | --- |
| `RECEIVED` | Raw Bitville callback has been received and captured. |
| `REJECTED_SECURITY` | Callback failed authentication, authorization, or source validation. |
| `REJECTED_CONTRACT` | Callback shape or required raw field set is invalid. |
| `DUPLICATE_REPLAYED` | Callback matches a completed idempotency record and the previous response is replayed. |
| `NORMALIZED` | Raw Bitville callback has been translated into a BetInc gateway command. |
| `SUBMITTED_TO_CORE` | Normalized command has been sent to `betinc-core`. |
| `CORE_ACCEPTED` | `betinc-core` accepted the command and returned a successful outcome. |
| `CORE_REJECTED` | `betinc-core` rejected the command as invalid or not allowed. |
| `CORE_UNCERTAIN` | Core call timed out or failed after submission and final core outcome is unknown. |
| `CANCEL_REQUESTED` | Bitville `cancel` callback has been received for a prior external transaction. |
| `CANCEL_SUBMITTED_TO_CORE` | Cancel/reversal intent has been sent to `betinc-core`. |
| `CANCEL_ACCEPTED` | `betinc-core` accepted the cancel/reversal outcome. |
| `CANCEL_REJECTED` | `betinc-core` rejected the cancel/reversal outcome. |
| `RECONCILIATION_REQUIRED` | Gateway cannot prove equivalence between Bitville state and core state. |

## Balance Flow

`balance` is read-only:

1. Receive and capture raw `balance` request.
2. Validate callback security.
3. Normalize player/session identity.
4. Query `betinc-core` for authoritative balance.
5. Return Bitville-formatted response.

No gateway ledger entry is created for `balance`.

## Debit Flow

`debit` represents a stake/wager:

1. Receive and capture raw `debit` callback.
2. Check idempotency using the Bitville transaction identity.
3. Validate security and contract shape.
4. Normalize to `WalletDebitCommand`.
5. Submit debit command to `betinc-core`.
6. Persist core outcome and replayable Bitville response.

If the core outcome is unknown after submission, the transaction enters `CORE_UNCERTAIN` and must be reconciled before manual retry creates any additional ledger effect.

## Credit Flow

`credit` represents a payout or settlement:

1. Receive and capture raw `credit` callback.
2. Check idempotency using the Bitville transaction identity.
3. Validate security and contract shape.
4. Normalize to `WalletCreditCommand`.
5. Submit credit command to `betinc-core`.
6. Persist core outcome and replayable Bitville response.

Credit ordering relative to debit for the same game round is an open question. The gateway must not assume Bitville always sends `debit` before `credit` until confirmed.

## Cancel Flow

`cancel` reverses or cancels a previous Bitville transaction:

1. Receive and capture raw `cancel` callback.
2. Locate the referenced external transaction.
3. Determine whether the prior transaction reached `CORE_ACCEPTED`.
4. If accepted, submit the appropriate reversal/cancel command to `betinc-core`.
5. If not accepted or unknown, return the Bitville response required by the confirmed raw contract and mark for reconciliation if needed.

The gateway must not locally mutate wallet balances to simulate a cancel.

## Promo/Freespins Flow

`promo/freespins` represents promotional entitlement handling, not automatically a ledger mutation:

1. Receive or create promotion/free-spin entitlement context from Bitville.
2. Validate eligibility and launch/session constraints outside the core ledger.
3. Only call `betinc-core` when a financial debit, credit, or adjustment is required by a confirmed promotion outcome.

Whether free-spin wins arrive as normal `credit` callbacks or a separate promotional settlement path is an open question.

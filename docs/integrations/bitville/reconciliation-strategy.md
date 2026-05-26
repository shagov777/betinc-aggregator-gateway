# Bitville Reconciliation Strategy

This document defines how the gateway should reconcile Bitville activity with `betinc-core` outcomes.

## Authority Rule

`betinc-core` is the certified wallet, ledger, and audit authority. Reconciliation exists to compare external Bitville activity with core outcomes, not to make the gateway authoritative.

## Reconciliation Sources

Expected sources:

- Gateway raw callback log for `balance`, `debit`, `credit`, `cancel`, and `promo/freespins`.
- Gateway normalized transaction records.
- `betinc-core` ledger and audit evidence.
- Bitville transaction reports, settlement reports, or export APIs.

The exact Bitville reconciliation report/API names and raw fields are not yet provided.

## Reconciliation Dimensions

For each financial event, compare:

- External transaction identity.
- External round identity.
- Player identity mapping.
- Provider and game identity.
- Operation type: `debit`, `credit`, `cancel`.
- Amount and currency.
- Core command result.
- Core ledger entry existence.
- Timestamp ordering and settlement date.

Exact Bitville raw field names for these dimensions are pending.

## Reconciliation Outcomes

| Outcome | Meaning | Action |
| --- | --- | --- |
| `MATCHED` | Bitville event and core ledger outcome agree. | Mark reconciled. |
| `MISSING_IN_CORE` | Bitville shows event but no matching core result exists. | Investigate before any compensating action. |
| `MISSING_IN_BITVILLE` | Core has event but Bitville report does not. | Investigate source of core command and reporting lag. |
| `AMOUNT_MISMATCH` | Event exists on both sides but amount differs. | Escalate. Do not auto-adjust without policy. |
| `CURRENCY_MISMATCH` | Currency differs between Bitville and core. | Escalate. |
| `STATUS_MISMATCH` | One side accepted while the other rejected/cancelled. | Escalate and determine authoritative correction path. |
| `DUPLICATE_EXTERNAL` | Multiple Bitville events map to one core event or vice versa. | Review idempotency and transaction mapping. |
| `CORE_UNCERTAIN_RESOLVED` | Previously uncertain core submission has been resolved through core audit. | Update gateway state and replay response behavior. |

## Timing

Recommended reconciliation jobs:

- Near-real-time repair loop for `CORE_UNCERTAIN` transactions.
- Daily settlement reconciliation against Bitville reports.
- On-demand reconciliation for a player, round, game, provider, or transaction.

## Correction Principle

Corrections must be expressed as approved commands to `betinc-core`; the gateway must not directly alter balances or ledger records.

If a mismatch requires a wallet adjustment, the adjustment policy, operator approval path, and core command type must be confirmed before implementation.

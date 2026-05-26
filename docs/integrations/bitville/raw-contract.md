# Bitville Raw Contract

This document records the Bitville-facing contract as raw aggregator vocabulary. It is intentionally not a BetInc API schema and must not be treated as an implementation contract for `betinc-core`.

## Source Scope

The current Bitville material provided for this planning pass covers:

- providers list
- categories list
- games list
- token
- launch JS flow
- balance
- debit
- credit
- cancel
- promo/freespins

Exact Bitville raw field names must be preserved at the adapter edge. Where exact request or response fields are not available in the provided material, this document marks them as open instead of inventing names.

## Raw Operations

| Bitville area | Raw Bitville name to preserve | Gateway interpretation |
| --- | --- | --- |
| Provider discovery | `providers list` | Catalog import or refresh source for external game providers. |
| Category discovery | `categories list` | Catalog import or refresh source for external game categories. |
| Game discovery | `games list` | Catalog import or refresh source for launchable games. |
| Session credential | `token` | Bitville session or player credential presented during launch and wallet callbacks. |
| Game launch | `launch JS flow` | Browser/client launch flow initiated through Bitville-provided JavaScript behavior. |
| Wallet read | `balance` | Read-only wallet balance callback that must be satisfied from `betinc-core`. |
| Stake | `debit` | External stake or wager callback that maps to a BetInc wallet debit command. |
| Payout | `credit` | External win, refund-like payout, or settlement callback that maps to a BetInc wallet credit command. |
| Reversal | `cancel` | External cancellation callback that maps to a BetInc reversal/cancel workflow. |
| Promotion | `promo/freespins` | External promotional entitlement or free-spin workflow. |

## Raw Contract Principles

- The gateway stores and logs the original Bitville request body, selected headers, callback path, and receipt time for traceability.
- Raw Bitville field names remain unchanged in raw audit records and adapter parsing code.
- BetInc normalized names are introduced only after raw request capture and validation.
- The gateway does not rewrite `betinc-core` APIs to match Bitville. It translates Bitville callbacks into existing core wallet, ledger, and audit commands.
- The gateway does not become the ledger authority. `betinc-core` remains authoritative for balances, ledger entries, player wallet state, audit evidence, and final transaction state.

## Endpoint Detail Status

The following details are not yet sufficiently specified for implementation:

- Exact HTTP method and path for each Bitville operation.
- Exact raw request fields for `balance`, `debit`, `credit`, `cancel`, and `promo/freespins`.
- Exact raw response fields and success/error codes.
- Exact signing, token, timestamp, nonce, IP allowlist, or shared-secret requirements.
- Exact amount representation, currency representation, decimal precision, and rounding rules.
- Exact callback retry behavior and timeout expectations.

These must be confirmed before schemas, API handlers, or core command adapters are implemented.

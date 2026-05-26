# Bitville Callback Idempotency Strategy

This document defines idempotency behavior for Bitville callbacks in the gateway. It is documentation only and introduces no storage schema.

## Goals

- A repeated Bitville callback must not create duplicate core ledger effects.
- A retried callback should receive the same effective response as the original completed callback.
- Unknown core outcomes must be reconciled, not blindly retried.

## Idempotency Scope

Idempotency applies to financial and state-changing Bitville callbacks:

- `debit`
- `credit`
- `cancel`
- `promo/freespins` when it creates or consumes an entitlement

`balance` should be safe to retry because it is read-only, but request capture and rate controls still apply.

## Idempotency Key

The primary key must be based on Bitville raw identity fields. Exact raw field names are pending confirmation.

Expected components to confirm:

- Bitville transaction identifier.
- Bitville round identifier, if present.
- Bitville player or token subject.
- Operation name: `debit`, `credit`, `cancel`, or `promo/freespins`.
- Aggregator identifier: Bitville.

Until the exact Bitville raw field names are confirmed, implementation must not hard-code guessed names such as transaction or round fields.

## Replay Behavior

| Existing gateway state | Incoming duplicate behavior |
| --- | --- |
| Completed success | Return the stored successful Bitville response. |
| Completed business rejection | Return the stored rejection response if Bitville expects stable rejection replay. |
| `SUBMITTED_TO_CORE` with no final result | Do not submit another core command. Return retry/temporary failure if allowed, and mark `CORE_UNCERTAIN`. |
| `CORE_UNCERTAIN` | Do not submit another core command. Use reconciliation to discover the authoritative outcome. |
| `REJECTED_SECURITY` | Reject again after current security validation. |
| `REJECTED_CONTRACT` | Reject again unless the payload differs and the confirmed Bitville contract allows correction. |

## Payload Conflict Detection

If a callback has the same idempotency key but materially different financial fields, the gateway should:

- Refuse to submit a new core command.
- Mark the record as a conflict.
- Preserve both raw payloads for audit.
- Escalate to reconciliation/manual review.

Material fields likely include amount, currency, player identity, game identity, round identity, and referenced transaction identity. Exact raw names are pending.

## Core Submission Rule

The gateway must write an idempotency intent before submitting a state-changing command to `betinc-core`. If the process crashes after core submission but before final response persistence, the transaction must be treated as uncertain and resolved against core audit/ledger records.

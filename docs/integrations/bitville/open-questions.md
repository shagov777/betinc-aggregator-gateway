# Bitville Open Questions

These questions must be resolved before implementation code, schemas, API handlers, or `betinc-core` command adapters are built.

## Raw Contract

- What are the exact HTTP methods and paths for `providers list`, `categories list`, `games list`, `token`, `balance`, `debit`, `credit`, `cancel`, and `promo/freespins`?
- What are the exact raw request fields for each operation?
- What are the exact raw response fields for each operation?
- What are the exact success, business error, and technical error codes?
- Are field names case-sensitive, and are payloads JSON, form-encoded, query-string based, or mixed?
- What are Bitville's timeout and retry rules for wallet callbacks?

## Financial Semantics

- What amount format does Bitville use: decimal string, integer minor units, floating number, or another format?
- What currency field is supplied, and can one player/session use multiple currencies?
- Can `credit` arrive before `debit` for the same round?
- Can a round contain multiple `debit` or `credit` callbacks?
- Is `cancel` allowed after `credit`?
- Does `cancel` reverse a specific transaction, a whole round, or the latest operation?
- How are jackpot, bonus, free-spin, and promotional wins represented?

## Identity Mapping

- Which raw field identifies the Bitville player?
- Which raw field identifies the BetInc player, if any?
- Which raw field identifies the game from `games list`?
- Which raw field identifies the provider from `providers list`?
- Which raw field identifies the round?
- Which raw field identifies the transaction?
- Is `token` opaque, JWT-like, session-bound, or player-bound?

## Security

- How are callbacks authenticated?
- Are callbacks signed, and if so which algorithm and canonicalization rules are used?
- Are timestamps and nonces provided?
- Are source IP ranges available for allowlisting?
- Are credentials different for catalog APIs, launch, and wallet callbacks?
- How are secrets rotated?

## Launch

- What exact values are required for the `launch JS flow`?
- Which launch values are server-generated versus browser-provided?
- How long is `token` valid?
- Can one token launch multiple games?
- What happens when a player closes a game before settlement completes?

## Promo/Freespins

- Are `promo/freespins` created by BetInc, Bitville, or both?
- Are free-spin wins delivered as normal `credit` callbacks?
- Is there a separate free-spin settlement callback?
- How are expired, consumed, cancelled, or partially consumed free-spin entitlements reported?
- Does a free-spin stake trigger `debit`, or is only the win reported?

## Reconciliation

- Does Bitville expose transaction reports or settlement exports?
- What is the report cadence and timezone?
- What identifiers appear in reports that can link back to wallet callbacks?
- How long can Bitville reports lag behind real-time callbacks?
- What is the dispute process for mismatched transactions?

## Core Boundary

- Which existing `betinc-core` endpoints or commands should the gateway use for balance, debit, credit, and cancel?
- Does core already support a reversal/cancel command with external transaction references?
- What metadata can the gateway pass to core for audit correlation without changing core?
- What is the approved operator workflow for reconciliation-driven adjustments?

# Bitville Callback Security Model

This document defines security expectations for Bitville callbacks into the aggregator gateway. Exact Bitville signing details are pending confirmation.

## Boundary

Bitville talks to the BetInc Aggregator Gateway. The gateway talks to `betinc-core`. Bitville must never call `betinc-core` directly.

## Required Controls

The gateway should enforce the following controls before normalization or core command submission:

- Transport security through HTTPS.
- Bitville source authentication using the confirmed Bitville mechanism.
- Request freshness if Bitville provides timestamp or nonce fields.
- Replay protection for state-changing callbacks.
- IP allowlisting if Bitville publishes stable callback source ranges.
- Strict request size limits.
- Structured raw request capture with secret redaction.
- Separate credentials per environment.

## Token Handling

The raw Bitville name `token` is preserved at the adapter edge.

Gateway treatment:

- Never log full `token` values.
- Store only a redacted, hashed, or reference form unless full storage is explicitly required and approved.
- Bind `token` to the normalized `PlayerSession` concept only after validation.
- Do not treat `token` alone as permission to mutate wallet state unless Bitville explicitly documents that behavior and BetInc accepts the risk.

## Launch JS Flow

The `launch JS flow` must be treated as an untrusted external launch surface:

- Launch parameters should be generated server-side by the gateway or a trusted BetInc caller.
- Browser-provided player, balance, currency, or transaction values must not be trusted for wallet mutation.
- Any client-visible token or launch value should be scoped, short-lived, and environment-specific.

## Callback Authentication

The exact Bitville callback authentication model is open. The implementation should be blocked until the following are confirmed:

- Whether Bitville signs callbacks.
- Signature algorithm and canonical string rules.
- Header names or raw body fields used for authentication.
- Shared secret or public key lifecycle.
- Timestamp and allowed clock skew.
- Nonce or request identifier behavior.
- Whether `balance`, `debit`, `credit`, `cancel`, and `promo/freespins` use the same security model.

## Failure Handling

Security failures should not reach `betinc-core`.

Recommended outcomes:

- Invalid authentication -> reject without core call.
- Expired timestamp or reused nonce -> reject without core call.
- Unknown source IP where allowlist is enabled -> reject without core call.
- Malformed body -> reject before normalization.

All rejected callbacks should be retained in gateway security logs with sensitive values redacted.

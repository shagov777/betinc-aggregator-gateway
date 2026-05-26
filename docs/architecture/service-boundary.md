# BetInc Aggregator Gateway Service Boundary

This service adapts external aggregators such as Bitville into stable internal BetInc wallet and ledger commands.

## Hard Boundary

The BetInc Aggregator Gateway must not modify `betinc-core`.

`betinc-core` remains the certified authority for:

- Wallet balances.
- Ledger mutations.
- Audit evidence.
- Regulatory and financial correctness.
- Final transaction acceptance or rejection.

The gateway owns:

- External aggregator contract adaptation.
- Raw callback capture.
- Request authentication and replay protection.
- Normalization from aggregator vocabulary to BetInc gateway vocabulary.
- Idempotency records for external callbacks.
- Catalog import from aggregator provider/category/game lists.
- Launch adaptation.
- Reconciliation orchestration and mismatch reporting.

## System Direction

```text
Bitville
  -> BetInc Aggregator Gateway
  -> betinc-core
```

Bitville must not call `betinc-core` directly. The gateway must not bypass core for financial state.

## Non-Goals

For the documentation-first phase, the gateway will not include:

- Implementation code.
- API server.
- Storage schemas.
- Database migrations.
- Generated clients.
- Changes to `betinc-core`.
- Wallet or ledger logic implemented outside `betinc-core`.

## Integration Pattern

The gateway follows an anti-corruption layer pattern:

1. Receive external Bitville request.
2. Preserve raw Bitville payload and raw field names.
3. Validate source, authenticity, freshness, and replay safety.
4. Normalize into BetInc gateway domain names.
5. Submit an existing command or query to `betinc-core`.
6. Translate the core result into the Bitville response format.
7. Reconcile uncertain or mismatched outcomes against core audit/ledger records.

## Data Ownership

| Data | Owner |
| --- | --- |
| Raw Bitville request and response snapshots | Gateway |
| Aggregator credentials and adapter configuration | Gateway |
| Provider/category/game catalog imported from Bitville | Gateway |
| Launch/session adapter context | Gateway |
| Wallet balance | `betinc-core` |
| Ledger entries | `betinc-core` |
| Audit authority | `betinc-core` |
| Financial transaction finality | `betinc-core` |
| Reconciliation findings | Gateway, with core as financial source of truth |

## Failure Principle

When the gateway is unsure whether `betinc-core` accepted a financial command, it must treat the outcome as unknown and reconcile. It must not submit another command that could duplicate a debit or credit unless core idempotency guarantees and external transaction references prove the retry is safe.

## Extension Rule

Adding another aggregator should add a new adapter and raw-contract documentation, not change core ledger behavior. Shared gateway abstractions may be introduced only after Bitville behavior is confirmed and a second integration creates real reuse pressure.

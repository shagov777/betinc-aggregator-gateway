# BetInc Aggregator Gateway

TypeScript Node.js service foundation for adapting external aggregators into BetInc gateway boundaries.

This repository is intentionally foundation-only at this stage. Bitville financial callbacks, wallet semantics, cancel behavior, promotional/free-spin behavior, and production service connectivity are blocked until the open Bitville contract questions are answered.

## Scripts

```sh
npm install
npm run build
npm test
npm run dev
```

## Environment

Copy `.env.example` for local development values. Do not commit real secrets.

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Runtime mode: `development`, `test`, or `production`. |
| `PORT` | HTTP port for the service. |
| `LOG_LEVEL` | Pino log level. |
| `SERVICE_NAME` | Service name emitted in structured logs. |

## Implemented

- Validated runtime configuration.
- Structured logger utility.
- Request correlation ID middleware.
- `GET /health` endpoint.
- Placeholder adapter registry.
- Gateway-domain TypeScript contracts for callback envelopes, normalized commands, processing states, idempotency decisions, core results, and reconciliation flags.
- Adapter contract interfaces for parsing, security validation, normalization, and response mapping.
- Bitville adapter placeholder that records confirmed raw operation names only.
- Documentation-derived simulator fixtures for `balance`, `debit`, `credit`, and `cancel`.
- Development-only raw callback filesystem archive under `data/raw-callbacks/`.
- Sensitive value redaction for headers and raw bodies before archive persistence.
- Dry-run replay planning that loads archived callbacks without executing financial actions.
- In-memory gateway processing event stream with correlation-aware querying.
- In-memory metrics counters for callback, archive, replay, security, normalization, and reconciliation milestones.
- Development-only diagnostics routes:
  - `GET /diagnostics/events`
  - `GET /diagnostics/metrics`
- Generic raw callback envelope validation that checks only safe transport-level requirements.
- Dry-run callback processing pipeline that archives, validates, emits events, increments metrics, and stops at normalization blocking.
- In-memory quarantine store for malformed callback envelopes.
- Test harness placeholder.

## Intentionally Not Implemented

- No live Bitville wallet callback handlers.
- No debit, credit, balance, cancel, promo, or free-spin semantics.
- No hardcoded assumptions for unresolved Bitville transaction fields or state transitions.
- No production service connections.
- No `betinc-core` changes.
- No connected core client.
- No production Bitville schemas or response mapping.
- No replay execution against core or external systems.
- No database-backed archive.
- No production observability backend.
- No financial event execution pipeline.
- No Bitville financial field validation.
- No normalization execution beyond explicit `normalization_blocked` dry-run status.

See `docs/integrations/bitville/open-questions.md` for the contract questions that must be resolved before financial implementation starts.

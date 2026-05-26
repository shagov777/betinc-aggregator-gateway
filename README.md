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
- Canonical normalization DTO contracts for balance, debit, credit, cancel, identity, transaction, and monetary concepts.
- Adapter capability model with schema/API version and compatibility state.
- Schema evolution helpers for version comparison and breaking-change detection.
- Bitville normalization placeholder that captures unknown/unsupported fields and returns `normalization_blocked`.
- In-memory provider registry, provider health tracker, and catalogue sync coordinator scaffolding.
- Catalogue lifecycle models for aggregator providers, games, categories, snapshots, sync results, and sync issues.
- Stale catalogue detection and scheduled sync placeholders for retry state, dead letters, and sync locks.
- Bitville catalogue sync placeholder for documented `providers list`, `categories list`, and `games list` terminology.
- Development-only provider diagnostics routes:
  - `GET /diagnostics/providers`
  - `GET /diagnostics/catalogue`
- In-memory game session registry with create, launch, expire, abandon, and close lifecycle transitions.
- Dry-run launch orchestration that creates a local session and blocks before token generation, wallet checks, core calls, or external Bitville calls.
- Bitville launch placeholder preserving `/api/token`, `token`, `client_token`, `partner_token`, `provider`, `game`, `demoMode`, and `demoOverlay` terminology.
- Development-only session diagnostics route:
  - `GET /diagnostics/sessions`
- Security/auth boundary scaffolding with generic authorization, IP allowlist, replay-risk, and timestamp-window validators.
- In-memory redacted credential store for `partner_token`, `client_token`, `apiKey`, and `sharedSecret` placeholders.
- Development-only security diagnostics route:
  - `GET /diagnostics/security`
- In-memory idempotency store with duplicate detection by correlation ID, external reference, and callback hash.
- Replay disposition scaffolding for allow, block, quarantine, and investigate decisions.
- Development-only idempotency diagnostics route:
  - `GET /diagnostics/idempotency`
- Gateway-to-core command contracts for wallet, session, and freespin command shapes.
- Dry-run core transport that can simulate blocked, accepted, rejected, timeout, and uncertain outcomes without network calls.
- Core reconciliation drift placeholders and compensating action references.
- Development-only core-client diagnostics route:
  - `GET /diagnostics/core-client`
- Bitville API request/response contracts for providers, games, token, launch, catalogue, and errors.
- Bitville sandbox client that builds dry-run requests for `/providers`, `/games`, and `/api/token` without HTTP execution.
- Bitville timeout, retry, circuit-breaker, and degraded-provider placeholders.
- Bitville provider/game/launch normalization placeholders while financial normalization remains blocked.
- Development-only Bitville diagnostics route:
  - `GET /diagnostics/bitville`
- End-to-end local dry-run simulator for launch, duplicates, timeout/retry, replay attack, stale callbacks, provider degradation, normalization blocking, out-of-order callbacks, and uncertain core state.
- Simulator integration with archive, replay, idempotency, metrics, diagnostics, events, quarantine, Bitville dry-run client, and core dry-run transport.
- Development-only simulator diagnostics route:
  - `GET /diagnostics/simulator`
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
- No settlement execution, ledger posting, or irreversible wallet semantics.
- No final adapter compatibility declaration for Bitville.
- No live provider catalogue API calls.
- No game ingestion execution.
- No cron, worker, or job infrastructure.
- No real Bitville launch calls.
- No real launch token generation.
- No launch-time wallet checks.
- No final Bitville production auth semantics.
- No real secrets or persistent credential storage.
- No external auth provider calls.
- No irreversible financial execution from idempotency decisions.
- No provider-final replay semantics.
- No real HTTP calls to core.
- No core ledger posting or wallet mutation.
- No retry execution against core.
- No production Bitville endpoint calls.
- No real Bitville launch/token runtime behavior.
- No Bitville wallet mutation or settlement execution.
- No simulator-driven financial mutation.
- No simulator external HTTP execution.

See `docs/integrations/bitville/open-questions.md` for the contract questions that must be resolved before financial implementation starts.

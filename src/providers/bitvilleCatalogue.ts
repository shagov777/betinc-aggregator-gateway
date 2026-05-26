import type { CatalogueSyncResult } from "./catalogueModels.js";

export async function bitvilleCatalogueSyncBlocked(): Promise<CatalogueSyncResult> {
  const now = new Date().toISOString();

  return {
    aggregatorName: "bitville",
    status: "sync_blocked",
    startedAt: now,
    completedAt: now,
    issues: [
      {
        severity: "warning",
        code: "provider_contract_unresolved",
        message: "Bitville `providers list`, `categories list`, and `games list` endpoints are documented by name only."
      },
      {
        severity: "warning",
        code: "game_ingestion_blocked",
        message: "Bitville game ingestion is blocked until exact catalogue API fields and response contracts are confirmed."
      },
      {
        severity: "warning",
        code: "live_api_blocked",
        message: "No live Bitville API calls are made in foundation mode."
      }
    ]
  };
}

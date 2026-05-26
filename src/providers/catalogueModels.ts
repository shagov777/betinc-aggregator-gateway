import type { AggregatorName } from "../domain/index.js";
import type { ProviderSyncStatus } from "./lifecycle.js";

export type AggregatorProvider = {
  aggregatorName: AggregatorName;
  providerId: string;
  displayName: string;
  rawProviderName?: string;
};

export type ProviderGameCategory = {
  aggregatorName: AggregatorName;
  categoryId: string;
  displayName: string;
  rawCategoryName?: string;
};

export type ProviderGame = {
  aggregatorName: AggregatorName;
  providerId: string;
  gameId: string;
  displayName: string;
  categoryIds: string[];
  rawGameName?: string;
};

export type ProviderCatalogueSnapshot = {
  aggregatorName: AggregatorName;
  capturedAt: string;
  providers: AggregatorProvider[];
  categories: ProviderGameCategory[];
  games: ProviderGame[];
};

export type CatalogueSyncIssue = {
  severity: "info" | "warning" | "error";
  code: "provider_contract_unresolved" | "live_api_blocked" | "game_ingestion_blocked" | "catalogue_stale";
  message: string;
};

export type CatalogueSyncResult = {
  aggregatorName: AggregatorName;
  status: ProviderSyncStatus;
  startedAt: string;
  completedAt?: string;
  snapshot?: ProviderCatalogueSnapshot;
  issues: CatalogueSyncIssue[];
};

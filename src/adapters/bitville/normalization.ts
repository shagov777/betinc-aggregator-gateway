import type { AggregatorProvider, ProviderGame, ProviderGameCategory } from "../../providers/index.js";
import type {
  BitvilleGameCatalogueResponse,
  BitvilleLaunchEnvelope,
  BitvilleProviderCatalogueResponse
} from "./apiContracts.js";

export function normalizeBitvilleProvidersPlaceholder(response: BitvilleProviderCatalogueResponse): AggregatorProvider[] {
  return response.providers.map((provider) => ({
    aggregatorName: "bitville",
    providerId: provider.provider,
    displayName: provider.name ?? provider.provider,
    rawProviderName: provider.provider
  }));
}

export function normalizeBitvilleGamesPlaceholder(response: BitvilleGameCatalogueResponse): ProviderGame[] {
  return response.games.map((game) => ({
    aggregatorName: "bitville",
    providerId: game.provider,
    gameId: game.game,
    displayName: game.name ?? game.game,
    categoryIds: game.category ? [game.category] : [],
    rawGameName: game.game
  }));
}

export function normalizeBitvilleCategoriesPlaceholder(response: BitvilleGameCatalogueResponse): ProviderGameCategory[] {
  const categories = new Set(response.games.map((game) => game.category).filter((category): category is string => category !== undefined));

  return [...categories].map((category) => ({
    aggregatorName: "bitville",
    categoryId: category,
    displayName: category,
    rawCategoryName: category
  }));
}

export function normalizeBitvilleLaunchPlaceholder(envelope: BitvilleLaunchEnvelope) {
  return {
    status: "normalization_blocked" as const,
    endpoint: envelope.endpoint,
    correlationId: envelope.request.correlationId,
    reason: "Live Bitville launch normalization is blocked pending credentials/runtime confirmation."
  };
}

import type { CallbackType } from "../domain/index.js";
import type { AdapterSchemaVersion } from "../schema/index.js";

export type AdapterCompatibilityState = "placeholder" | "experimental" | "compatible" | "blocked";

export type ProviderCapabilities = {
  supportsPromoFlows: boolean;
  supportsRollback: boolean;
  supportsMultiCreditRounds: boolean;
};

export type AdapterCapabilityModel = {
  supportedCallbacks: CallbackType[];
  providerCapabilities: ProviderCapabilities;
  supportsPromoFlows: boolean;
  supportsRollback: boolean;
  supportsMultiCreditRounds: boolean;
  schemaVersion: AdapterSchemaVersion;
  apiVersion: string;
  compatibilityState: AdapterCompatibilityState;
};

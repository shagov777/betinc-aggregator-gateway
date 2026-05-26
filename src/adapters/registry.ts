import { bitvilleAdapterPlaceholder } from "./bitville/index.js";
import type { AggregatorAdapter } from "./contracts.js";

export type AdapterRegistration = {
  name: string;
  status: "placeholder";
};

export type AdapterRegistry = {
  list(): AdapterRegistration[];
  get(name: string): AdapterRegistration | undefined;
  getAdapter(name: string): AggregatorAdapter | undefined;
};

const adapterRegistrations: AdapterRegistration[] = [
  {
    name: bitvilleAdapterPlaceholder.name,
    status: "placeholder"
  }
];

const adapters: AggregatorAdapter[] = [bitvilleAdapterPlaceholder];

export function createAdapterRegistry(): AdapterRegistry {
  return {
    list: () => [...adapterRegistrations],
    get: (name: string) => adapterRegistrations.find((adapter) => adapter.name === name),
    getAdapter: (name: string) => adapters.find((adapter) => adapter.name === name)
  };
}

export type AdapterRegistration = {
  name: string;
  status: "placeholder";
};

export type AdapterRegistry = {
  list(): AdapterRegistration[];
  get(name: string): AdapterRegistration | undefined;
};

const adapterRegistrations: AdapterRegistration[] = [
  {
    name: "bitville",
    status: "placeholder"
  }
];

export function createAdapterRegistry(): AdapterRegistry {
  return {
    list: () => [...adapterRegistrations],
    get: (name: string) => adapterRegistrations.find((adapter) => adapter.name === name)
  };
}

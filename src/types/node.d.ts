declare const process: {
  env: Record<string, string | undefined>;
};

declare module "node:crypto" {
  export function randomUUID(): string;
}

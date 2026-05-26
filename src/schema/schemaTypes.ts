export type AdapterSchemaVersion = {
  major: number;
  minor: number;
  patch: number;
};

export type SchemaChangeSeverity = "none" | "patch" | "minor" | "major";

export type SchemaCompatibilityResult = {
  compatible: boolean;
  severity: SchemaChangeSeverity;
  from: AdapterSchemaVersion;
  to: AdapterSchemaVersion;
  reason: string;
};

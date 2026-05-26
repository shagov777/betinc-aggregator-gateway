import type { AdapterSchemaVersion, SchemaCompatibilityResult } from "./schemaTypes.js";

export function compareSchemaVersions(from: AdapterSchemaVersion, to: AdapterSchemaVersion): SchemaCompatibilityResult {
  if (to.major !== from.major) {
    return {
      compatible: false,
      severity: "major",
      from,
      to,
      reason: "Major schema version changed."
    };
  }

  if (to.minor !== from.minor) {
    return {
      compatible: to.minor > from.minor,
      severity: "minor",
      from,
      to,
      reason: to.minor > from.minor ? "Minor schema version increased." : "Minor schema version decreased."
    };
  }

  if (to.patch !== from.patch) {
    return {
      compatible: to.patch >= from.patch,
      severity: "patch",
      from,
      to,
      reason: to.patch > from.patch ? "Patch schema version increased." : "Patch schema version decreased."
    };
  }

  return {
    compatible: true,
    severity: "none",
    from,
    to,
    reason: "Schema versions match."
  };
}

export function detectBreakingChange(result: SchemaCompatibilityResult): boolean {
  return !result.compatible || result.severity === "major";
}

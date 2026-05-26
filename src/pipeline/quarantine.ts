import { randomUUID } from "node:crypto";
import { redactSensitiveFields } from "../security/redaction.js";
import type { ValidationIssue } from "../validation/index.js";

export type QuarantineReason = "malformed_envelope" | "generic_validation_failed";

export type QuarantinedCallback = {
  id: string;
  reason: QuarantineReason;
  createdAt: string;
  correlationId?: string;
  issues: ValidationIssue[];
  redactedPayload: unknown;
};

export type QuarantineStore = {
  add(input: Omit<QuarantinedCallback, "id" | "createdAt">): QuarantinedCallback;
  get(id: string): QuarantinedCallback | undefined;
  list(): QuarantinedCallback[];
  clear(): void;
};

export function createInMemoryQuarantineStore(): QuarantineStore {
  const quarantined: QuarantinedCallback[] = [];

  return {
    add(input: Omit<QuarantinedCallback, "id" | "createdAt">): QuarantinedCallback {
      const item: QuarantinedCallback = {
        ...input,
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        redactedPayload: redactSensitiveFields(input.redactedPayload)
      };

      quarantined.push(item);
      return item;
    },

    get(id: string): QuarantinedCallback | undefined {
      return quarantined.find((item) => item.id === id);
    },

    list(): QuarantinedCallback[] {
      return [...quarantined];
    },

    clear(): void {
      quarantined.splice(0, quarantined.length);
    }
  };
}

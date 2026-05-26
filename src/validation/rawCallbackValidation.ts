import type { RawCallbackEnvelope } from "../domain/index.js";
import type { ValidationIssue, ValidationResult } from "./validationTypes.js";

const requiredFields = ["aggregatorName", "callbackType", "correlationId", "receivedAt", "method", "path", "headers", "rawBody"] as const;

export function validateRawCallbackEnvelope(envelope: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isRecord(envelope)) {
    return {
      status: "invalid",
      issues: [
        {
          field: "envelope",
          severity: "error",
          message: "Raw callback envelope must be an object."
        }
      ]
    };
  }

  for (const field of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(envelope, field)) {
      issues.push({
        field,
        severity: "error",
        message: `${field} is required.`
      });
    }
  }

  for (const field of ["aggregatorName", "callbackType", "correlationId", "receivedAt", "method", "path"] as const) {
    if (Object.prototype.hasOwnProperty.call(envelope, field) && typeof envelope[field] !== "string") {
      issues.push({
        field,
        severity: "error",
        message: `${field} must be a string.`
      });
    }
  }

  if (Object.prototype.hasOwnProperty.call(envelope, "headers") && !isRecord(envelope.headers)) {
    issues.push({
      field: "headers",
      severity: "error",
      message: "headers must be an object."
    });
  }

  return {
    status: issues.some((issue) => issue.severity === "error") ? "invalid" : "valid",
    issues
  };
}

export function isValidRawCallbackEnvelope(envelope: unknown): envelope is RawCallbackEnvelope {
  return validateRawCallbackEnvelope(envelope).status === "valid";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

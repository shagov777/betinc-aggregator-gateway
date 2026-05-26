const sensitiveNames = new Set(["authorization", "token", "client_token", "partner_token", "private_key", "secret"]);

const redactedValue = "[REDACTED]";

export function redactSensitiveValue(name: string, value: unknown): unknown {
  return sensitiveNames.has(name.toLowerCase()) ? redactedValue : value;
}

export function redactHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string | string[] | undefined> {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [
      name,
      redactSensitiveValue(name, value) as string | string[] | undefined
    ])
  );
}

export function redactSensitiveFields<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveFields(item)) as T;
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([name, nestedValue]) => [name, redactSensitiveValue(name, redactSensitiveFields(nestedValue))])
    ) as T;
  }

  return value;
}

import type { RedactedSecret } from "./securityTypes.js";

export type CredentialKind = RedactedSecret["kind"];

export type CredentialStore = {
  setPlaceholder(kind: CredentialKind): RedactedSecret;
  get(kind: CredentialKind): RedactedSecret;
  list(): RedactedSecret[];
};

const credentialKinds: CredentialKind[] = ["partner_token", "client_token", "apiKey", "sharedSecret"];

export function createInMemoryCredentialStore(): CredentialStore {
  const credentials = new Map<CredentialKind, RedactedSecret>();

  for (const kind of credentialKinds) {
    credentials.set(kind, {
      kind,
      state: "not_configured",
      value: undefined
    });
  }

  return {
    setPlaceholder(kind: CredentialKind): RedactedSecret {
      const credential: RedactedSecret = {
        kind,
        state: "placeholder",
        value: "[REDACTED]"
      };

      credentials.set(kind, credential);
      return credential;
    },

    get(kind: CredentialKind): RedactedSecret {
      return credentials.get(kind) ?? { kind, state: "not_configured", value: undefined };
    },

    list(): RedactedSecret[] {
      return [...credentials.values()];
    }
  };
}

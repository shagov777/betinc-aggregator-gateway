export type DocumentationDerivedFixture = {
  _fixtureNotice: string;
  rawBitvilleOperation: "balance" | "debit" | "credit" | "cancel";
  rawHeaders: Record<string, string>;
  rawPayload: Record<string, never>;
  openQuestions: string[];
};

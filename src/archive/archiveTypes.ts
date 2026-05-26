import type { AggregatorName, CallbackType, RawCallbackEnvelope } from "../domain/index.js";

export type ArchivedRawCallback = {
  id: string;
  correlationId: string;
  receivedAt: string;
  aggregatorName: AggregatorName;
  callbackType: CallbackType;
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  rawBody: unknown;
};

export type ArchiveRawCallbackFilter = {
  aggregatorName?: AggregatorName;
  callbackType?: CallbackType;
  correlationId?: string;
};

export type RawCallbackArchive = {
  archiveRawCallback(envelope: RawCallbackEnvelope): Promise<ArchivedRawCallback>;
  getArchivedCallback(id: string): Promise<ArchivedRawCallback | undefined>;
  listArchivedCallbacks(filter?: ArchiveRawCallbackFilter): Promise<ArchivedRawCallback[]>;
};

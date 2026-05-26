import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { RawCallbackEnvelope } from "../domain/index.js";
import { redactHeaders, redactSensitiveFields } from "../security/redaction.js";
import type { ArchivedRawCallback, ArchiveRawCallbackFilter, RawCallbackArchive } from "./archiveTypes.js";

const defaultArchiveDirectory = "data/raw-callbacks";

export type FilesystemArchiveOptions = {
  directory?: string;
};

export function createFilesystemRawCallbackArchive(options: FilesystemArchiveOptions = {}): RawCallbackArchive {
  const directory = options.directory ?? defaultArchiveDirectory;

  return {
    async archiveRawCallback(envelope: RawCallbackEnvelope): Promise<ArchivedRawCallback> {
      await mkdir(directory, { recursive: true });

      const archived: ArchivedRawCallback = {
        id: randomUUID(),
        correlationId: envelope.correlationId,
        receivedAt: envelope.receivedAt,
        aggregatorName: envelope.aggregatorName,
        callbackType: envelope.callbackType,
        method: envelope.method,
        path: envelope.path,
        headers: redactHeaders(envelope.headers),
        rawBody: redactSensitiveFields(envelope.rawBody)
      };

      await writeFile(callbackPath(directory, archived.id), `${JSON.stringify(archived, null, 2)}\n`, "utf8");

      return archived;
    },

    async getArchivedCallback(id: string): Promise<ArchivedRawCallback | undefined> {
      try {
        return parseArchivedCallback(await readFile(callbackPath(directory, id), "utf8"));
      } catch (error) {
        if (isNotFoundError(error)) {
          return undefined;
        }

        throw error;
      }
    },

    async listArchivedCallbacks(filter: ArchiveRawCallbackFilter = {}): Promise<ArchivedRawCallback[]> {
      let filenames: string[];

      try {
        filenames = await readdir(directory);
      } catch (error) {
        if (isNotFoundError(error)) {
          return [];
        }

        throw error;
      }

      const callbacks = await Promise.all(
        filenames
          .filter((filename) => filename.endsWith(".json"))
          .sort()
          .map(async (filename) => parseArchivedCallback(await readFile(join(directory, filename), "utf8")))
      );

      return callbacks.filter((callback) => matchesFilter(callback, filter));
    }
  };
}

function callbackPath(directory: string, id: string): string {
  return join(directory, `${id}.json`);
}

function parseArchivedCallback(serialized: string): ArchivedRawCallback {
  return JSON.parse(serialized) as ArchivedRawCallback;
}

function matchesFilter(callback: ArchivedRawCallback, filter: ArchiveRawCallbackFilter): boolean {
  return (
    (filter.aggregatorName === undefined || callback.aggregatorName === filter.aggregatorName) &&
    (filter.callbackType === undefined || callback.callbackType === filter.callbackType) &&
    (filter.correlationId === undefined || callback.correlationId === filter.correlationId)
  );
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

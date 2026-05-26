import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { createFilesystemRawCallbackArchive } from "../archive/filesystemArchive.js";
import { coreClientPlaceholder } from "../coreClient/index.js";
import type { RawCallbackEnvelope } from "../domain/index.js";
import { createReplayService } from "../replay/replayService.js";
import { redactHeaders, redactSensitiveFields } from "../security/redaction.js";

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("raw callback archive and replay foundation", () => {
  it("redacts sensitive header and body fields", () => {
    expect(
      redactHeaders({
        Authorization: "Bearer secret",
        "x-correlation-id": "corr-1",
        token: "header-token"
      })
    ).toEqual({
      Authorization: "[REDACTED]",
      "x-correlation-id": "corr-1",
      token: "[REDACTED]"
    });

    expect(
      redactSensitiveFields({
        player: "player-1",
        client_token: "client-secret",
        nested: {
          private_key: "private",
          visible: "kept"
        }
      })
    ).toEqual({
      player: "player-1",
      client_token: "[REDACTED]",
      nested: {
        private_key: "[REDACTED]",
        visible: "kept"
      }
    });
  });

  it("writes, reads, and lists archived callbacks with redaction", async () => {
    const directory = await createTempDirectory();
    const archive = createFilesystemRawCallbackArchive({ directory });

    const archived = await archive.archiveRawCallback(createEnvelope("corr-archive", "debit"));
    const stored = await archive.getArchivedCallback(archived.id);
    const listed = await archive.listArchivedCallbacks({ callbackType: "debit" });
    const serialized = await readFile(join(directory, `${archived.id}.json`), "utf8");

    expect(stored).toEqual(archived);
    expect(listed).toEqual([archived]);
    expect(serialized).toContain("[REDACTED]");
    expect(serialized).not.toContain("Bearer secret");
    expect(serialized).not.toContain("body-token");
  });

  it("returns dry-run replay plans without execution", async () => {
    const directory = await createTempDirectory();
    const archive = createFilesystemRawCallbackArchive({ directory });
    const replayService = createReplayService(archive);
    const archived = await archive.archiveRawCallback(createEnvelope("corr-replay", "credit"));

    const plan = await replayService.createDryRunReplayPlan(archived.id);

    expect(plan?.mode).toBe("dry-run");
    expect(plan?.executed).toBe(false);
    expect(plan?.steps.map((step) => step.action)).toEqual(["inspect_only", "inspect_only"]);
    expect(plan?.steps.map((step) => step.reason)).toEqual(["wallet_semantics_blocked", "core_client_not_connected"]);
  });

  it("keeps the core client disconnected", () => {
    expect(coreClientPlaceholder.connected).toBe(false);
  });
});

async function createTempDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "gateway-archive-"));
  tempDirectories.push(directory);
  return directory;
}

function createEnvelope(correlationId: string, callbackType: RawCallbackEnvelope["callbackType"]): RawCallbackEnvelope {
  return {
    aggregatorName: "bitville",
    callbackType,
    receivedAt: "2026-05-26T00:00:00.000Z",
    correlationId,
    method: "POST",
    path: "/bitville/callback",
    headers: {
      Authorization: "Bearer secret",
      "x-correlation-id": correlationId
    },
    rawBody: {
      token: "body-token",
      visible: "kept"
    }
  };
}

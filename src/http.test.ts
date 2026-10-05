import { afterEach, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import type { ImapClient } from "./imap/index.js";
import { startHttpServer } from "./http.js";

// The transport needs no IMAP connection to answer initialize or a tool
// listing; only a tool call would reach the client.
const noopClient = {} as ImapClient;

let stop: (() => Promise<void>) | undefined;

afterEach(async () => {
  await stop?.();
  stop = undefined;
});

async function listening(label?: string) {
  const handle = await startHttpServer(noopClient, { port: 0, host: "127.0.0.1", label });
  stop = handle.close;
  const { port } = handle.server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

function rpc(body: unknown) {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify(body),
  };
}

const initialize = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "test", version: "0" },
  },
};

describe("startHttpServer", () => {
  it("answers initialize on /mcp and names the server", async () => {
    const base = await listening();

    const res = await fetch(`${base}/mcp`, rpc(initialize));

    expect(res.status).toBe(200);
    expect(await res.text()).toContain("imap-mini-mcp");
  });

  // Stateless means every request stands alone: there is no session to
  // resume, so the SSE stream a GET would open has nothing to carry.
  it("refuses GET /mcp because there is no session", async () => {
    const base = await listening();

    const res = await fetch(`${base}/mcp`, {
      headers: { Accept: "text/event-stream" },
    });

    expect(res.status).toBe(405);
  });

  it("serves /healthz for the readiness probe", async () => {
    const base = await listening();

    const res = await fetch(`${base}/healthz`);

    expect(res.status).toBe(200);
  });

  // With one server per mailbox the client needs to know which one it reached;
  // initialize is where it finds out.
  it("names the account label in the initialize response", async () => {
    const base = await listening("Privat");

    const res = await fetch(`${base}/mcp`, rpc(initialize));

    expect(await res.text()).toContain("Privat");
  });

  it("answers 404 on an unknown path", async () => {
    const base = await listening();

    const res = await fetch(`${base}/nope`);

    expect(res.status).toBe(404);
  });
});

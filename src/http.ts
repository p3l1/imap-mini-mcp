import {
  createServer as createHttpServer,
  type IncomingMessage,
  type Server as NodeHttpServer,
  type ServerResponse,
} from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { ImapClient } from "./imap/index.js";
import { createServer } from "./server.js";

export interface HttpOptions {
  port?: number;
  host?: string;
}

export interface HttpHandle {
  server: NodeHttpServer;
  close: () => Promise<void>;
}

const MAX_BODY_BYTES = 4 * 1024 * 1024;

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      try {
        resolve(raw.length === 0 ? undefined : JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function send(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(body);
}

/**
 * Handle one MCP request. Stateless means a fresh server and transport per
 * request: nothing carries over, so nothing has to be kept.
 */
async function handleMcp(
  imapClient: ImapClient,
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const body = await readBody(req);
  const server = createServer(imapClient);
  const transport = new StreamableHTTPServerTransport({
    enableJsonResponse: true,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, body);
}

/**
 * Serve the MCP endpoint over HTTP. The IMAP client is shared across
 * requests; only the MCP plumbing is rebuilt each time.
 */
export function startHttpServer(
  imapClient: ImapClient,
  options: HttpOptions = {}
): Promise<HttpHandle> {
  const server = createHttpServer((req, res) => {
    const path = (req.url ?? "/").split("?")[0];

    if (path === "/healthz") {
      send(res, 200, JSON.stringify({ status: "ok" }));
      return;
    }

    if (path !== "/mcp") {
      send(res, 404, JSON.stringify({ error: "not found" }));
      return;
    }

    // Without a session there is no stream to resume, so the methods that
    // would reopen or end one have nothing to act on.
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json", Allow: "POST" });
      res.end(JSON.stringify({ error: "method not allowed" }));
      return;
    }

    handleMcp(imapClient, req, res).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`[imap-mini-mcp] http: ${message}\n`);
      if (!res.headersSent) {
        send(res, 400, JSON.stringify({ error: message }));
      } else {
        res.end();
      }
    });
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port ?? 3000, options.host ?? "0.0.0.0", () => {
      server.removeListener("error", reject);
      resolve({
        server,
        close: () =>
          new Promise<void>((done, fail) =>
            server.close((error) => (error ? fail(error) : done()))
          ),
      });
    });
  });
}

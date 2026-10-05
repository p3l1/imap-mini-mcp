import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ImapClient } from "./imap/index.js";
import { tools, handleToolCall } from "./tools/index.js";

/**
 * Create and configure the MCP server.
 */
export interface ServerOptions {
  /** Names the mailbox this server serves, for clients that reach several. */
  label?: string;
}

export function createServer(
  imapClient: ImapClient,
  options: ServerOptions = {}
): Server {
  const label = options.label?.trim();

  const server = new Server(
    {
      name: label ? `imap-mini-mcp (${label})` : "imap-mini-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
      instructions: label
        ? `Every tool here acts on the mailbox labelled "${label}" and on no other.`
        : "Every tool here acts on a single mailbox.",
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: [...tools] };
  });

  // Dispatch tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      return await handleToolCall(imapClient, name, args || {});
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error executing ${name}: ${message}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

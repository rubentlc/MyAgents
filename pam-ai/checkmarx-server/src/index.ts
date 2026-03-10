import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const baseUrlRaw = process.env.CHECKMARX_BASE_URL;
const apiKey = process.env.CHECKMARX_API_KEY;
const authHeader = process.env.CHECKMARX_AUTH_HEADER ?? "Authorization";
const authScheme = process.env.CHECKMARX_AUTH_SCHEME ?? "ApiKey";
const tokenUrl =
  process.env.CHECKMARX_TOKEN_URL ??
  "https://eu.iam.checkmarx.net/auth/realms/icrcprod/protocol/openid-connect/token";
const tokenClientId = process.env.CHECKMARX_TOKEN_CLIENT_ID ?? "ast-app";
const tokenGrantType = process.env.CHECKMARX_TOKEN_GRANT_TYPE ?? "refresh_token";

if (!baseUrlRaw || !apiKey) {
  throw new Error("Missing required env vars: CHECKMARX_BASE_URL and CHECKMARX_API_KEY");
}

const baseUrl = baseUrlRaw.replace(/\/$/, "");

const withLeadingSlash = (value: string): string =>
  value.startsWith("/") ? value : `/${value}`;

let cachedAccessToken: string | null = null;
let cachedAccessTokenExpMs = 0;

const buildAuthValue = (): string => {
  if (!authScheme.trim()) {
    return apiKey;
  }

  return `${authScheme} ${apiKey}`;
};

const parseJwtExpMs = (jwt: string): number => {
  try {
    const payloadPart = jwt.split(".")[1];
    if (!payloadPart) return 0;

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payloadJson = Buffer.from(normalized, "base64").toString("utf8");
    const payload = JSON.parse(payloadJson) as { exp?: number; typ?: string };

    return payload.exp ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
};

const looksLikeOfflineToken = (value: string): boolean => {
  if (value.split(".").length !== 3) {
    return false;
  }

  try {
    const payloadPart = value.split(".")[1] ?? "";
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payloadJson = Buffer.from(normalized, "base64").toString("utf8");
    const payload = JSON.parse(payloadJson) as { typ?: string };

    return payload.typ?.toLowerCase() === "offline";
  } catch {
    return false;
  }
};

const getAccessTokenFromRefresh = async (): Promise<string> => {
  const now = Date.now();
  if (cachedAccessToken && cachedAccessTokenExpMs > now + 60_000) {
    return cachedAccessToken;
  }

  const body = new URLSearchParams({
    grant_type: tokenGrantType,
    client_id: tokenClientId,
    refresh_token: apiKey,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status}).`);
  }

  let parsed: { access_token?: string };
  try {
    parsed = JSON.parse(bodyText) as { access_token?: string };
  } catch {
    throw new Error("Token exchange returned non-JSON response.");
  }

  if (!parsed.access_token) {
    throw new Error("Token exchange response has no access_token.");
  }

  cachedAccessToken = parsed.access_token;
  cachedAccessTokenExpMs = parseJwtExpMs(parsed.access_token) || now + 10 * 60_000;
  return cachedAccessToken;
};

const buildRequestHeaders = async (): Promise<Record<string, string>> => {
  const useRefreshFlow =
    authScheme.trim().toLowerCase() === "refreshtoken" || looksLikeOfflineToken(apiKey);

  if (useRefreshFlow) {
    const accessToken = await getAccessTokenFromRefresh();
    return {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    };
  }

  return {
    [authHeader]: buildAuthValue(),
    Accept: "application/json",
  };
};

const requestJson = async (apiPath: string, query?: Record<string, string | number>) => {
  const url = new URL(baseUrl + withLeadingSlash(apiPath));

  for (const [key, value] of Object.entries(query ?? {})) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    method: "GET",
    headers: await buildRequestHeaders(),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} on ${url.pathname}: ${bodyText.slice(0, 500)}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON from ${url.pathname}, got: ${contentType}. Body: ${bodyText.slice(0, 500)}`);
  }

  return JSON.parse(bodyText) as unknown;
};

const tryJsonPaths = async (
  paths: Array<{ path: string; query?: Record<string, string | number> }>
): Promise<unknown> => {
  const errors: string[] = [];

  for (const candidate of paths) {
    try {
      return await requestJson(candidate.path, candidate.query);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${candidate.path}: ${message}`);
    }
  }

  throw new Error(`All endpoint attempts failed:\n${errors.join("\n")}`);
};

const ListProjectsArgs = z.object({
  limit: z.number().int().positive().max(500).optional(),
});

const ListScansArgs = z.object({
  projectId: z.string().optional(),
  limit: z.number().int().positive().max(500).optional(),
});

const ListVulnsArgs = z.object({
  projectId: z.string().optional(),
  scanId: z.string().optional(),
  severity: z.string().optional(),
  state: z.string().optional(),
  limit: z.number().int().positive().max(500).optional(),
});

const RawGetArgs = z.object({
  path: z.string().min(1),
  query: z.record(z.union([z.string(), z.number()])).optional(),
});

const tools: Tool[] = [
  {
    name: "checkmarx_list_projects",
    description: "List Checkmarx projects",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max number of projects" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "checkmarx_list_scans",
    description: "List Checkmarx scans, optionally filtered by project",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        limit: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "checkmarx_list_vulnerabilities",
    description: "List vulnerabilities/results from Checkmarx",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        scanId: { type: "string" },
        severity: { type: "string" },
        state: { type: "string" },
        limit: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "checkmarx_raw_get",
    description: "Raw GET call against Checkmarx API path",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "API path, ex: /api/projects" },
        query: {
          type: "object",
          additionalProperties: {
            anyOf: [{ type: "string" }, { type: "number" }],
          },
        },
      },
      required: ["path"],
      additionalProperties: false,
    },
  },
];

const server = new Server(
  {
    name: "checkmarx-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === "checkmarx_list_projects") {
      const args = ListProjectsArgs.parse(request.params.arguments ?? {});
      const data = await tryJsonPaths([
        { path: "/api/projects", query: { limit: args.limit ?? 100 } },
        { path: "/projects", query: { limit: args.limit ?? 100 } },
      ]);

      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (request.params.name === "checkmarx_list_scans") {
      const args = ListScansArgs.parse(request.params.arguments ?? {});
      const query: Record<string, string | number> = { limit: args.limit ?? 100 };

      if (args.projectId) {
        query.projectId = args.projectId;
      }

      const data = await tryJsonPaths([
        { path: "/api/scans", query },
        { path: "/scans", query },
      ]);

      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (request.params.name === "checkmarx_list_vulnerabilities") {
      const args = ListVulnsArgs.parse(request.params.arguments ?? {});
      const query: Record<string, string | number> = { limit: args.limit ?? 100 };

      if (args.projectId) query.projectId = args.projectId;
      if (args.scanId) query.scanId = args.scanId;
      if (args.severity) query.severity = args.severity;
      if (args.state) query.state = args.state;

      const data = await tryJsonPaths([
        { path: "/api/results", query },
        { path: "/api/vulnerabilities", query },
        { path: "/results", query },
      ]);

      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (request.params.name === "checkmarx_raw_get") {
      const args = RawGetArgs.parse(request.params.arguments ?? {});
      const data = await requestJson(args.path, args.query);

      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    return {
      isError: true,
      content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      isError: true,
      content: [{ type: "text", text: message }],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

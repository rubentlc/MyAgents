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

const baseUrlRaw = process.env.SONARQUBE_BASE_URL;
const token = process.env.SONARQUBE_TOKEN;
const authHeader = process.env.SONARQUBE_AUTH_HEADER ?? "Authorization";
const authScheme = process.env.SONARQUBE_AUTH_SCHEME ?? "Basic";
const sessionCookie = process.env.SONARQUBE_COOKIE; // optional: F5 APM / Azure AD proxy cookie

if (!baseUrlRaw) {
  throw new Error("Missing required env var: SONARQUBE_BASE_URL");
}

const baseUrl = baseUrlRaw.replace(/\/$/, "");

const withLeadingSlash = (value: string): string =>
  value.startsWith("/") ? value : `/${value}`;

const buildAuthValue = (): string | undefined => {
  if (!token) return undefined;
  if (!authScheme.trim()) return token;
  if (authScheme.toLowerCase() === "basic") {
    return `Basic ${Buffer.from(`${token}:`).toString("base64")}`;
  }
  return `${authScheme} ${token}`;
};

const requestJson = async (
  apiPath: string,
  query?: Record<string, string | number | boolean | undefined>
) => {
  const url = new URL(baseUrl + withLeadingSlash(apiPath));

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...(buildAuthValue() ? { [authHeader]: buildAuthValue()! } : {}),
      ...(sessionCookie ? { Cookie: sessionCookie } : {}),
      Accept: "application/json",
    },
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

const ListProjectsArgs = z.object({
  query: z.string().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(500).optional(),
});

const ListIssuesArgs = z.object({
  projectKey: z.string().min(1),
  branch: z.string().optional(),
  severities: z.string().optional(),
  types: z.string().optional(),
  statuses: z.string().optional(),
  resolved: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(500).optional(),
});

const ListHotspotsArgs = z.object({
  projectKey: z.string().min(1),
  branch: z.string().optional(),
  status: z.string().optional(),
  resolution: z.string().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(500).optional(),
});

const QualityGateArgs = z.object({
  projectKey: z.string().min(1),
  branch: z.string().optional(),
});

const RawGetArgs = z.object({
  path: z.string().min(1),
  query: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

const tools: Tool[] = [
  {
    name: "sonarqube_list_projects",
    description: "List SonarQube projects",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Project search query" },
        page: { type: "number", description: "Page number" },
        pageSize: { type: "number", description: "Page size" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "sonarqube_list_issues",
    description: "List SonarQube issues for a project",
    inputSchema: {
      type: "object",
      properties: {
        projectKey: { type: "string" },
        branch: { type: "string" },
        severities: { type: "string", description: "Comma-separated: BLOCKER,CRITICAL,MAJOR,MINOR,INFO" },
        types: { type: "string", description: "Comma-separated: BUG,VULNERABILITY,CODE_SMELL,SECURITY_HOTSPOT" },
        statuses: { type: "string", description: "Comma-separated: OPEN,CONFIRMED,REOPENED,RESOLVED,CLOSED" },
        resolved: { type: "boolean" },
        page: { type: "number" },
        pageSize: { type: "number" },
      },
      required: ["projectKey"],
      additionalProperties: false,
    },
  },
  {
    name: "sonarqube_list_hotspots",
    description: "List SonarQube security hotspots for a project",
    inputSchema: {
      type: "object",
      properties: {
        projectKey: { type: "string" },
        branch: { type: "string" },
        status: { type: "string", description: "TO_REVIEW,REVIEWED" },
        resolution: { type: "string", description: "FIXED,SAFE,ACKNOWLEDGED" },
        page: { type: "number" },
        pageSize: { type: "number" },
      },
      required: ["projectKey"],
      additionalProperties: false,
    },
  },
  {
    name: "sonarqube_get_project_quality_gate",
    description: "Get SonarQube quality gate status for a project",
    inputSchema: {
      type: "object",
      properties: {
        projectKey: { type: "string" },
        branch: { type: "string" },
      },
      required: ["projectKey"],
      additionalProperties: false,
    },
  },
  {
    name: "sonarqube_raw_get",
    description: "Raw GET call against SonarQube API path",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "API path, ex: /api/projects/search" },
        query: {
          type: "object",
          additionalProperties: {
            anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }],
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
    name: "sonarqube-mcp-server",
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
    if (request.params.name === "sonarqube_list_projects") {
      const args = ListProjectsArgs.parse(request.params.arguments ?? {});
      const data = await requestJson("/api/projects/search", {
        q: args.query,
        p: args.page ?? 1,
        ps: args.pageSize ?? 100,
      });

      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (request.params.name === "sonarqube_list_issues") {
      const args = ListIssuesArgs.parse(request.params.arguments ?? {});
      const data = await requestJson("/api/issues/search", {
        componentKeys: args.projectKey,
        branch: args.branch,
        severities: args.severities,
        types: args.types,
        statuses: args.statuses,
        resolved: args.resolved,
        p: args.page ?? 1,
        ps: args.pageSize ?? 100,
      });

      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (request.params.name === "sonarqube_list_hotspots") {
      const args = ListHotspotsArgs.parse(request.params.arguments ?? {});
      const data = await requestJson("/api/hotspots/search", {
        projectKey: args.projectKey,
        branch: args.branch,
        status: args.status,
        resolution: args.resolution,
        p: args.page ?? 1,
        ps: args.pageSize ?? 100,
      });

      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (request.params.name === "sonarqube_get_project_quality_gate") {
      const args = QualityGateArgs.parse(request.params.arguments ?? {});
      const data = await requestJson("/api/qualitygates/project_status", {
        projectKey: args.projectKey,
        branch: args.branch,
      });

      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (request.params.name === "sonarqube_raw_get") {
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

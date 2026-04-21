import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });

const DEFAULT_PROJECT_ID = "291039a8-156d-488d-b2d9-2b77cbb4c6e6";
const SEVERITIES = ["critical", "high"];
// Findings to act on: active and unresolved states
const ACTIVE_STATUSES = new Set(["TO_VERIFY", "RECURRENT", "URGENT"]);
const EXCLUDED_STATUSES = new Set(["NOT_EXPLOITABLE", "IGNORED"]);

const args = process.argv.slice(2);
const branch = args.find((arg) => !arg.startsWith("--"));
const scanIdArg = args.find((arg) => arg.startsWith("--scanId=") || arg.startsWith("--scan-id="));
const projectIdArg = args.find((arg) => arg.startsWith("--projectId=") || arg.startsWith("--project-id="));
const scanId = scanIdArg ? scanIdArg.split("=")[1] : undefined;
const projectIdCli = projectIdArg ? projectIdArg.split("=")[1] : undefined;

if (!branch && !scanId) {
  console.error("Usage: npm run report:branch -- <branch> [--scanId=<scan-id>] [--projectId=<project-id>]");
  process.exit(1);
}

const baseUrlRaw = process.env.CHECKMARX_BASE_URL;
const apiKey = process.env.CHECKMARX_API_KEY;
const authHeader = process.env.CHECKMARX_AUTH_HEADER ?? "Authorization";
const authScheme = process.env.CHECKMARX_AUTH_SCHEME ?? "ApiKey";
const tokenUrl =
  process.env.CHECKMARX_TOKEN_URL ??
  "https://eu.iam.checkmarx.net/auth/realms/icrcprod/protocol/openid-connect/token";
const tokenClientId = process.env.CHECKMARX_TOKEN_CLIENT_ID ?? "ast-app";
const tokenGrantType = process.env.CHECKMARX_TOKEN_GRANT_TYPE ?? "refresh_token";
const projectId = projectIdCli ?? process.env.CHECKMARX_PROJECT_ID ?? DEFAULT_PROJECT_ID;

if (!baseUrlRaw || !apiKey) {
  console.error("Missing required env vars: CHECKMARX_BASE_URL and CHECKMARX_API_KEY");
  process.exit(1);
}

const baseUrl = baseUrlRaw.replace(/\/$/, "");

let cachedAccessToken = null;
let cachedAccessTokenExpMs = 0;

const parseJwtExpMs = (jwt) => {
  try {
    const payloadPart = jwt.split(".")[1];
    if (!payloadPart) return 0;

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payloadJson = Buffer.from(normalized, "base64").toString("utf8");
    const payload = JSON.parse(payloadJson);

    return payload.exp ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
};

const looksLikeOfflineToken = (value) => {
  if (value.split(".").length !== 3) {
    return false;
  }

  try {
    const payloadPart = value.split(".")[1] ?? "";
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payloadJson = Buffer.from(normalized, "base64").toString("utf8");
    const payload = JSON.parse(payloadJson);

    return payload.typ?.toLowerCase() === "offline";
  } catch {
    return false;
  }
};

const getAccessTokenFromRefresh = async () => {
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

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status})`);
  }

  const parsed = JSON.parse(text);
  if (!parsed.access_token) {
    throw new Error("Token exchange response has no access_token");
  }

  cachedAccessToken = parsed.access_token;
  cachedAccessTokenExpMs = parseJwtExpMs(parsed.access_token) || now + 10 * 60_000;
  return cachedAccessToken;
};

const buildRequestHeaders = async () => {
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
    [authHeader]: authScheme.trim() ? `${authScheme} ${apiKey}` : apiKey,
    Accept: "application/json",
  };
};

const requestJson = async (apiPath, query = {}) => {
  const url = new URL(baseUrl + (apiPath.startsWith("/") ? apiPath : `/${apiPath}`));
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const response = await fetch(url, {
    method: "GET",
    headers: await buildRequestHeaders(),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} on ${url.pathname}: ${text.slice(0, 300)}`);
  }

  return JSON.parse(text);
};

const extractItems = (data) => data.results ?? data.vulnerabilities ?? data.items ?? data.data ?? [];

// Parse "Npm-packagename-1.2.3" or "Npm-@scope/pkg-1.2.3" format
const parsePackageIdentifier = (pkgId) => {
  if (!pkgId) return { name: null, version: null };
  // Remove "Npm-" prefix (case-insensitive)
  const withoutPrefix = pkgId.replace(/^Npm-/i, "");
  // Match last semver-like segment: digits.digits[.digits...]
  const m = withoutPrefix.match(/^(.+)-(\d+\.\d+(?:\.\d+)*)$/);
  if (m) return { name: m[1], version: m[2] };
  return { name: withoutPrefix, version: null };
};

const resolveScan = async () => {
  if (scanId) {
    return { id: scanId, branch: branch ?? "(scanId override)", status: "Completed", createdAt: null };
  }

  const data = await requestJson("/api/scans", { "project-id": projectId, limit: 200 });
  const scans = data.scans ?? [];

  const selected = scans
    .filter((scan) => String(scan.status ?? "").toLowerCase() === "completed")
    .filter((scan) => {
      const candidates = [scan.branch, scan.branchName, scan.gitBranch, scan.sourceBranch]
        .filter(Boolean)
        .map((value) => String(value));
      return candidates.includes(branch);
    })
    .sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bTime - aTime;
    })[0];

  if (!selected?.id) {
    throw new Error(`No completed scan found for branch: ${branch}`);
  }

  return {
    id: selected.id,
    branch: selected.branch ?? selected.branchName ?? selected.gitBranch ?? selected.sourceBranch ?? branch,
    status: selected.status,
    createdAt: selected.createdAt ?? null,
  };
};

const fetchFindings = async (resolvedScanId) => {
  const entries = [];

  for (const severity of SEVERITIES) {
    const data = await requestJson("/api/results", {
      "scan-id": resolvedScanId,
      severity,
      limit: 500,
    });

    const findings = extractItems(data);
    findings.forEach((finding) => entries.push({ severity, finding }));
  }

  return entries;
};

const toTableRows = (entries) => {
  const grouped = new Map();

  for (const { severity, finding } of entries) {
    const status = String(finding.status ?? "").toUpperCase();
    const state = String(finding.state ?? "").toUpperCase();
    // Skip only explicitly muted/closed findings
    if (EXCLUDED_STATUSES.has(status) || EXCLUDED_STATUSES.has(state)) {
      continue;
    }

    // Extract package info from packageIdentifier ("Npm-pkgname-version")
    const pkgId = finding?.data?.packageIdentifier ?? "";
    const parsed = parsePackageIdentifier(pkgId);

    const packageName =
      parsed.name ??
      finding?.data?.packageName ??
      finding?.packageName ??
      "unknown";

    const packageVersion =
      parsed.version ??
      finding?.data?.packageVersion ??
      finding?.packageVersion ??
      "unknown";

    const findingId = String(finding.id ?? finding.resultId ?? finding.vulnerabilityId ?? "unknown");
    const recommendedVersion = finding?.data?.recommendedVersion ?? finding?.recommendedVersion ?? null;
    const key = `${packageName}|${packageVersion}|${severity}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        packageName,
        packageVersion,
        severity,
        recommendedVersion,
        findingIds: [],
      });
    }

    grouped.get(key).findingIds.push(findingId);
  }

  return [...grouped.values()]
    .map((row) => ({ ...row, findingIds: [...new Set(row.findingIds)] }))
    .sort((a, b) => a.packageName.localeCompare(b.packageName) || a.severity.localeCompare(b.severity));
};

const printMarkdownTable = (rows) => {
  console.log("| package name | current version | recommended version | severity | finding ids |");
  console.log("|---|---|---|---|---|");

  rows.forEach((row) => {
    console.log(
      `| ${row.packageName} | ${row.packageVersion} | ${row.recommendedVersion ?? "-"} | ${row.severity.toUpperCase()} | ${row.findingIds.join(", ")} |`,
    );
  });
};

const main = async () => {
  const startedAt = Date.now();
  const selectedScan = await resolveScan();
  const entries = await fetchFindings(selectedScan.id);
  const rows = toTableRows(entries);
  const elapsedMs = Date.now() - startedAt;

  console.log(`Branch: ${branch ?? "(n/a)"}`);
  console.log(`ProjectId: ${projectId}`);
  console.log(`Scan: ${selectedScan.id}`);
  console.log(`ScanStatus: ${selectedScan.status ?? "Completed"}`);
  if (selectedScan.createdAt) {
    console.log(`ScanCreatedAt: ${selectedScan.createdAt}`);
  }
  console.log("Filter: exclude [NOT_EXPLOITABLE, IGNORED] — showing active/unresolved findings");
  console.log(`Critical+High findings fetched: ${entries.length}`);
  console.log(`Filtered package rows: ${rows.length}`);
  console.log("");

  if (rows.length === 0) {
    console.log("No rows after filter.");
  } else {
    printMarkdownTable(rows);
  }

  console.log("");
  console.log(`Elapsed: ${elapsedMs}ms`);
  console.log("Proceed? (sim/nao)");
};

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });

const base = (process.env.CHECKMARX_BASE_URL || "").replace(/\/$/, "");
const apiKey = process.env.CHECKMARX_API_KEY || "";
const authScheme = process.env.CHECKMARX_AUTH_SCHEME || "ApiKey";
const authHeader = process.env.CHECKMARX_AUTH_HEADER || "Authorization";
const tokenUrl = process.env.CHECKMARX_TOKEN_URL || "https://eu.iam.checkmarx.net/auth/realms/icrcprod/protocol/openid-connect/token";
const clientId = process.env.CHECKMARX_TOKEN_CLIENT_ID || "ast-app";
const grantType = process.env.CHECKMARX_TOKEN_GRANT_TYPE || "refresh_token";
const SCAN_ID = "3cac7cff-4473-4854-98e9-60dfd0a13c97";

const looksOffline = (v) => {
  try {
    const p = v.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return (JSON.parse(Buffer.from(p, "base64").toString("utf8")).typ || "").toLowerCase() === "offline";
  } catch { return false; }
};

let tok = null;
const hdrs = async () => {
  if (looksOffline(apiKey)) {
    if (!tok) {
      const b = new URLSearchParams({ grant_type: grantType, client_id: clientId, refresh_token: apiKey });
      const r = await fetch(tokenUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: b });
      if (!r.ok) throw new Error("token " + r.status);
      tok = (await r.json()).access_token;
    }
    return { Authorization: "Bearer " + tok, Accept: "application/json" };
  }
  return { [authHeader]: authScheme.trim() ? authScheme + " " + apiKey : apiKey, Accept: "application/json" };
};

const getJson = async (apiPath, q = {}) => {
  const u = new URL(base + apiPath);
  Object.entries(q).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  const r = await fetch(u, { headers: await hdrs() });
  if (!r.ok) throw new Error("HTTP " + r.status + " " + apiPath + ": " + (await r.text()).slice(0, 200));
  return r.json();
};

const crit = await getJson("/api/results", { "scan-id": SCAN_ID, severity: "critical", limit: 50 });
const high = await getJson("/api/results", { "scan-id": SCAN_ID, severity: "high", limit: 50 });
const all = [...(crit.results || []), ...(high.results || [])];

console.log("Total findings:", all.length);
all.forEach((f, i) => {
  console.log(`\n--- Finding ${i + 1} ---`);
  console.log("id:", f.id);
  console.log("severity:", f.severity);
  console.log("status:", f.status);
  console.log("state:", f.state);
  console.log("type:", f.type);
  console.log("data.status:", f.data?.status);
  console.log("data.state:", f.data?.state);
  console.log("data.packageName:", f.data?.packageName);
  console.log("data.packageVersion:", f.data?.packageVersion);
  console.log("data.recommendedVersion:", f.data?.recommendedVersion);
  console.log("ALL KEYS:", Object.keys(f).join(", "));
  console.log("data full:", JSON.stringify(f.data).slice(0,500));
  console.log("alternateId:", f.alternateId);
  if(f.vulnerabilityDetails) console.log("vulnerabilityDetails:", JSON.stringify(f.vulnerabilityDetails).slice(0,300));
  console.log("similarityId:", f.similarityId);
});

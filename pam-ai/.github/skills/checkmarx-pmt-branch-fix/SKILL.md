---
name: checkmarx-pmt-branch-fix
description: "Use when you want automatic Checkmarx remediation for PMT frontend by branch: default to pmt-v2__expr, select latest scan for the input branch, filter high/critical findings, fix them in small batches, and validate build/test/lint."
argument-hint: "Provide branch name (required). Optionally provide scan id to override latest scan selection."
user-invocable: true
---

# Checkmarx PMT Branch Remediation

## Purpose
Run an end-to-end remediation workflow for `frontend` using Checkmarx findings from a specific branch.

## Defaults
- Target project name: `pmt-v2__expr`
- Target project id: `73ccd21f-5e16-4ba2-b74b-27be2cd375cc`
- Severities in scope: `critical`, then `high`
- Validation commands:
  - `npm run build`
  - `npm test`
  - `npm run lint`

## Inputs
- `branch` (required)
- `scanId` (optional, overrides latest scan selection)

## Procedure
1. Resolve project and scan
- Use MCP `checkmarx_list_projects` if id/name validation is needed.
- Use MCP `checkmarx_list_scans` filtered by `projectId`.
- Pick latest `Completed` scan for the given `branch` by `createdAt` desc.
- If `scanId` is provided, use it directly.

2. Collect severe findings
- Fetch `critical` and `high` findings for the selected scan.
- Preferred tool: `checkmarx_list_vulnerabilities`.
- Fallback when needed: `checkmarx_raw_get` with `/api/results?scan-id=<SCAN_ID>&severity=<SEVERITY>&limit=200`.
- Keep finding `id`, `severity`, `type`, `state/status`, and location/package metadata.

3. Apply muted exclusion and preview package scope
- Build the package scope from `critical` and `high` findings using package status filter:
  - `status: { in: ["SNOOZE", "MONITORED"] }`
- Treat packages outside that set as muted/excluded for this workflow.
- **First**: show the compact table. No code changes before this step. Table must include at minimum:
  - package name
  - package version
  - severity
  - finding ids
- **Then** (only after the table is shown): ask the user for explicit confirmation: `Proceed? (sim/nao)`.
- If the user answers `nao`, stop and return only the filtered table and observations.

4. Prioritize and batch
- Resolve `critical` first, then `high`.
- Group by fix strategy:
  - dependency updates
  - targeted source fixes
- Keep each batch small and reversible.

5. Remediate
- Dependency findings:
  - Use `data.recommendedVersion` from the Checkmarx finding as the **minimum** safe version.
  - Always check `npm info <pkg> dist-tags.latest` and use the **latest patch** within the same major, not just the minimum.
  - For transitive dependencies, prefer targeted `overrides` with minimal blast radius.
- Source findings:
  - Apply minimal changes that preserve existing patterns.
  - Avoid broad refactors.

6. Validate after each batch
- Run relevant checks (`build`, `test`, `lint`).
- If a command is skipped or blocked (for example private registry auth), record the reason.

7. Report
- Branch and scan used.
- Filter used for package status and confirmation decision (`sim/nao`).
- Findings addressed with ids/severity/type.
- Files changed.
- Validation results.
- Residual high/critical risks and exact next actions.

## Decision Rules
- If no high/critical findings exist for the scan, stop and report clean status.
- If findings cannot be fixed safely in one pass, split into explicit follow-up batches.
- Keep operational files in `pam-ai`; keep application code changes in `frontend`.

## Done Criteria
- Selected scan is explicit and traceable to input branch.
- Filtered package table was shown and explicitly approved by the user before remediation.
- High/critical findings are either fixed or have documented blockers.
- Validation status is clearly reported for each change batch.

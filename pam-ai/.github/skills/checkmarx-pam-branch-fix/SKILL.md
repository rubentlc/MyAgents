---
name: checkmarx-pam-branch-fix
description: "Use when you want automatic Checkmarx remediation for PAM frontend by branch: default to pam-frontend__expr, select latest scan for the input branch, filter high/critical findings, fix them in small batches, and validate build/test/lint."
argument-hint: "Provide branch name (required). Optionally provide scan id to override latest scan selection."
user-invocable: true
---

# Checkmarx PAM Branch Remediation

## Purpose
Run an end-to-end remediation workflow for `pam-frontend` using Checkmarx findings from a specific branch.

## Defaults
- Target project name: `pam-frontend__expr`
- Target project id: `291039a8-156d-488d-b2d9-2b77cbb4c6e6`
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

3. Prioritize and batch
- Resolve `critical` first, then `high`.
- Group by fix strategy:
  - dependency updates
  - targeted source fixes
- Keep each batch small and reversible.

4. Remediate
- Dependency findings:
  - Prefer patch/minor updates.
  - For transitive dependencies, prefer targeted `overrides` with minimal blast radius.
- Source findings:
  - Apply minimal changes that preserve existing patterns.
  - Avoid broad refactors.

5. Validate after each batch
- Run relevant checks (`build`, `test`, `lint`).
- If a command is skipped or blocked (for example private registry auth), record the reason.

6. Report
- Branch and scan used.
- Findings addressed with ids/severity/type.
- Files changed.
- Validation results.
- Residual high/critical risks and exact next actions.

## Decision Rules
- If no high/critical findings exist for the scan, stop and report clean status.
- If findings cannot be fixed safely in one pass, split into explicit follow-up batches.
- Keep operational files in `pam-ai`; keep application code changes in `pam-frontend`.

## Done Criteria
- Selected scan is explicit and traceable to input branch.
- High/critical findings are either fixed or have documented blockers.
- Validation status is clearly reported for each change batch.

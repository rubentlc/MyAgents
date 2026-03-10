---
name: checkmarx-triage
description: 'Standard workflow for Checkmarx triage in this repository: collect findings, prioritize high/critical issues, map to code/dependencies, apply safe fixes, and validate with build/test/lint.'
argument-hint: 'Provide project id/name, optional scan id or branch, and whether to focus on dependency risks, code vulnerabilities, or both.'
user-invocable: true
---

# Checkmarx Triage Workflow

## Purpose
Provide a repeatable way to go from Checkmarx findings to validated fixes in this repo.

## Inputs
- Checkmarx project id or project name
- Optional scan id or branch
- Focus area:
  - dependencies
  - source-code vulnerabilities
  - both

## Procedure
1. Collect findings from MCP
- List project scans and choose target scan (latest stable scan by default).
- Fetch vulnerabilities and keep original ids/status for traceability.

2. Prioritize
- Prioritize `critical` then `high`.
- Inside each severity, prioritize exploitable and reachable findings first.
- Defer low-impact findings when they require large breaking changes.

3. Map findings to repo
- For dependency findings: map package names to `package.json` and lockfile.
- For code findings: locate exact file/function and confirm current behavior.

4. Remediate with minimal risk
- Prefer patch/minor dependency updates first.
- For major updates, isolate into a separate small batch with explicit risk note.
- For code fixes, keep changes targeted and aligned with existing patterns.

5. Validate
- Run relevant checks after each batch:
  - `npm run build`
  - `npm test` (or focused tests)
  - `npm lint`
- If a command is skipped, record why.

6. Report
- Findings addressed (ids/severity)
- Files changed
- Validation results
- Residual risks and next actions

## Decision Rules
- Do not do broad refactors when a targeted fix works.
- Keep changes inside current architecture and folder conventions.
- Prefer reversible batches so rollback is simple.

## Done Criteria
- High/critical set has a clear remediation status.
- Code compiles and no obvious lint/test regressions were introduced.
- Final report is traceable from finding -> change -> validation.

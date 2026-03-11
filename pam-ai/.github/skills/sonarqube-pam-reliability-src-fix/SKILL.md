---
name: sonarqube-pam-reliability-src-fix
description: "Use when you want automatic SonarQube Reliability remediation for PAM frontend: collect issues impacting RELIABILITY, restrict scope to pam-frontend/src/*, and apply fixes only inside that path."
argument-hint: "Provide branch name (optional, default: develop). Optionally provide max issues per batch."
user-invocable: true
---

# SonarQube PAM Reliability (src-only) Remediation

## Purpose
Run a controlled remediation workflow for SonarQube issues impacting `RELIABILITY` in `pam-frontend`, while strictly limiting code changes to `pam-frontend/src/*`.

## Hard Scope Boundary
- In-scope findings:
  - SonarQube issues whose `impactSoftwareQualities` includes `RELIABILITY`
  - Project key `actman.pam_pam-frontend`
  - Branch: input branch, default `develop`
  - Components whose path starts with `pam-frontend/src/`
- Out of scope:
  - Any file outside `pam-frontend/src/*`
  - `SECURITY_HOTSPOT`
  - Pipeline, Docker, Kubernetes, or config-file fixes outside `src`

If a Reliability finding is outside `pam-frontend/src/*`, report it as skipped and do not modify files.

## Defaults
- `projectKey`: `actman.pam_pam-frontend`
- `branch`: `develop`
- `impactSoftwareQuality`: `RELIABILITY`
- Batch size: 5 issues per pass
- Optional validation commands:
  - `npm run build`
  - `npm test`
  - `npm run lint`

## Inputs
- `branch` (optional, default `develop`)
- `batchSize` (optional, default `5`, max `20`)

## Procedure
1. Collect Reliability findings
- Collect SonarQube issues filtered by `impactSoftwareQualities=RELIABILITY`.
- Prefer `sonarqube_raw_get` with `/api/issues/search` when needed, because reliability is a software-quality impact filter rather than a legacy `type` filter.
- Use:
  - `componentKeys=actman.pam_pam-frontend`
  - `branch=<input or develop>`
  - `impactSoftwareQualities=RELIABILITY`
  - paging parameters until all issues are collected.

2. Filter to src-only scope
- Keep only findings where component/path starts with `pam-frontend/src/`.
- Exclude every finding outside that path and track it as `skipped_out_of_scope`.

3. Prioritize by risk and fixability
- Prioritize severity: `BLOCKER` -> `CRITICAL` -> `MAJOR` -> `MINOR` -> `INFO`.
- Inside each severity, prioritize deterministic runtime and correctness issues before lower-risk edge cases.
- Work in small, reversible batches.

4. Implement minimal fixes

5. Validate when useful
4. Implement MECHANICAL FIXES ONLY (No Refactoring)
- Change only files under `pam-frontend/src/*`.
- Apply only direct, local corrections that do NOT reorganize code or extract new functions.
- Keep each fix traceable to one or more Sonar issue keys.

**Allowed Mechanical Fixes:**
- Replace `indexOf(...) > -1` → `includes()`
- Replace `isNaN()` → `Number.isNaN()`
- Replace `.find() !== undefined` existence checks → `.some()`
- Simplify redundant negations (e.g., `!!x && !y` → `x && !y`)
- Add optional chaining: `obj.prop.id` → `obj.prop?.id`
- Remove commented-out code blocks
- Simplify inline ternary expressions (no extraction of logic)

**Forbidden (Do NOT Apply):**
- Replace `window` → `globalThis`
- Extract helpers or new functions (e.g., `buildIndicators()`, `getItemPercentage()`)
- Extract types or interfaces
- Reorganize logic across multiple lines or blocks
- Change function signatures or return types
- Consolidate loops or conditional blocks into reusable patterns
- Any change that moves logic to a new location, even if labeled a "helper"

**If a Sonar finding requires helper extraction:** Mark it BLOCKED and report the limitation — do not apply the fix.

5. Validate when useful
- Validation is optional and should usually run once at the end, not after every batch.
- You may ask if the user wants validation after a batch, but if they say yes, run the relevant commands and report results.
- Preferred commands when validation is requested or justified:
  - `npm run build`
  - `npm test` (full or focused when justified)
  - `npm run lint`
- If validation is skipped, report that clearly.
- If validation is run and fails, either fix regressions in-scope or report the blocker.

6. Report
- Branch analyzed and total `RELIABILITY` findings.
- In-scope findings fixed (issue keys, severities, files changed).
- Out-of-scope findings skipped (explicit reason: outside `pam-frontend/src/*`).
- Validation results, or explicit note that validation was skipped.
- Residual Reliability risk and next actions.

## Decision Rules
- Never edit files outside `pam-frontend/src/*`.
- If Sonar points to generated/vendor/external code, skip and report.
- If no in-scope `RELIABILITY` issues exist, stop and report clean status for scope.
- Prefer multiple small commits over one large risky change set.

## Done Criteria
- All fixable in-scope `RELIABILITY` findings for the target branch are resolved or documented with blockers.
- No code outside `pam-frontend/src/*` was modified.
- Validation status is explicit when run or skipped.

# Agent Routing For PMT AI

This file is a lightweight catalog of available agents and recommended entrypoints.
Canonical workflow behavior lives in the agent definitions, prompt wrappers, and skills.

## Orchestrator Agent
- `orchestrator-pmt`: Use as the dedicated router for PMT work; it triages requests and delegates to frontend specialists, backend, security, and architect agents with a unified output contract.

## Architecture Governance Agent
- `pmt-architect`: Use for architecture and governance decisions across `.github` assets (routing contracts, role boundaries, policy consistency, and conflict resolution).

## Frontend Integrator (Fallback)
- `pmt-fe-engineer`: Use as the frontend integrator/fallback for cross-cutting or ambiguous tasks in `frontend/`. Handles React, Nx, routing, context state, forms, and tests together. Enforces PMT API call patterns (`usePmtApi()` + `pmt-services`) and no-Redux/no-i18n constraints.

## Frontend Specialists
- `pmt-fe-tests-specialist`: Use for Jest/Testing Library work (new tests, flaky tests, failing suites, coverage-oriented fixes).
- `pmt-fe-styling-specialist`: Use for SCSS and MUI v5 styling/layout/responsiveness fixes. Reminder: new `pmt-ui` component SCSS files require a manual `@import` in `theme.scss`.
- `pmt-fe-routing-specialist`: Use for React Router DOM v6 tree, navigation, redirects, and nested-route behavior.
- `pmt-fe-a11y-specialist`: Use for accessibility issues (semantics, ARIA, keyboard, focus management).
- `pmt-fe-deps-upgrade-specialist`: Use for frontend dependency upgrades and migration-related breakage analysis.

## Security Agent
- `checkmarx-remediator`: Use for full Checkmarx triage/remediation cycles against `pmt-v2/frontend`. Uses `pmt-ai/.github/skills/checkmarx-pmt-branch-fix/SKILL.md` as canonical workflow.

## Backend Agent
- `pmt-be-engineer`: Use when implementing, debugging, or refactoring features in `pmt-v2/backend` (.NET 8, Dapper, SQL Server). Covers controllers, services, repositories, stored procedures, domain models, DI registration, exception handling, and xUnit tests.

## Recommended Operating Mode
- Default entrypoint: select `orchestrator-pmt`.
- Default execution mode: planning-first.
- Use direct execution only for clearly small, single-concern tasks.

## Shared Rules
- Operational assets stay in `pmt-ai`.
- `pmt-v2/frontend` and `pmt-v2/backend` remain focused on app code.
- No Redux in frontend — use React Context only.
- No i18n library — strings are hardcoded; do not introduce `i18next`.

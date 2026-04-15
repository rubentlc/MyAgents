# Agent Routing For PAM AI

This file is a lightweight catalog of available agents and recommended entrypoints.
Canonical workflow behavior lives in the agent definitions, prompt wrappers, and skills.

## Orchestrator Agent
- `orchestrator-pam`: Use as the dedicated router for PAM work; it triages requests and delegates to frontend specialists, backend, security, and i18n agents with a unified output contract.

## Frontend Integrator (Fallback)
- `pam-fe-engineer`: Use as the frontend integrator/fallback for cross-cutting or ambiguous tasks in `pam-frontend`.

## Frontend Specialists
- `pam-fe-tests-specialist`: Use for Vitest/Testing Library work (new tests, flaky tests, failing suites, coverage-oriented fixes).
- `pam-fe-styling-specialist`: Use for CSS Modules and MUI styling/layout/responsiveness fixes.
- `pam-fe-routing-specialist`: Use for React Router tree, navigation, redirects, and nested-route behavior.
- `pam-fe-redux-specialist`: Use for Redux Toolkit/RTK Query state issues, selectors, cache invalidation, and store flow.
- `pam-fe-a11y-specialist`: Use for accessibility issues (semantics, ARIA, keyboard, focus management).
- `pam-fe-deps-upgrade-specialist`: Use for frontend dependency upgrades and migration-related breakage analysis.

## Primary Agent
- `checkmarx-remediator`: Use for full Checkmarx triage/remediation cycles against `pam-frontend`.

## i18n Auditor Agent
- `pam-i18n-auditor`: Use when you want to scan a whole flow or component area for untranslated strings and fix everything in one pass across EN/ES/FR locales. Invoke **manually** when the scope is larger than a single component.

## Backend Agent
- `pam-be-engineer`: Use when implementing, debugging, or refactoring features in `pam-backend` (.NET 10 microservices). Covers GraphQL resolvers, MediatR handlers, gRPC proto changes, Dynamics 365 integration, MongoDB, Kafka, tests, and build fixes.

## Recommended Operating Mode
- Default entrypoint: select `orchestrator-pam`.
- Default execution mode: planning-first.
- Use direct execution only for clearly small, single-concern tasks.

## Shared Rules
- Operational assets stay in `pam-ai`.
- `pam-frontend` and `pam-backend` remain focused on app code.

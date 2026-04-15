# Agent Routing For PAM AI

## Orchestrator Agent
- `orchestrator-pam`: Use as the dedicated router for PAM work; it triages requests and delegates to `pam-fe-engineer`, `pam-be-engineer`, `checkmarx-remediator`, or `pam-i18n-auditor` with a unified output contract.

## Primary Agent
- `checkmarx-remediator`: Use for full Checkmarx triage/remediation cycles against `pam-frontend`.

## Frontend Agent
- `pam-fe-engineer`: Use for day-to-day frontend implementation and refactoring in `pam-frontend` (React/Vite/TypeScript/MUI/Redux), including tests and lint/build stabilization.

## i18n Auditor Agent
- `pam-i18n-auditor`: Use when you want to scan a whole flow or component area for untranslated strings and fix everything in one pass across EN/ES/FR locales. Invoke **manually** when the scope is larger than a single component.

## Backend Agent
- `pam-be-engineer`: Use when implementing, debugging, or refactoring features in `pam-backend` (.NET 10 microservices). Covers GraphQL resolvers, MediatR handlers, gRPC proto changes, Dynamics 365 integration, MongoDB, Kafka, tests, and build fixes.

## Shared Rules
- Operational assets stay in `pam-ai`.
- `pam-frontend` remains focused on app code.
- Use small, reversible change batches.
- Always report residual risk when remediation is partial.

# Agent Routing For PAM AI

## Primary Agent
- `checkmarx-remediator`: Use for full Checkmarx triage/remediation cycles against `pam-frontend`.

## Frontend Agent
- `pam-fe-engineer`: Use for day-to-day frontend implementation and refactoring in `pam-frontend` (React/Vite/TypeScript/MUI/Redux), including tests and lint/build stabilization.

## Shared Rules
- Operational assets stay in `pam-ai`.
- `pam-frontend` remains focused on app code.
- Use small, reversible change batches.
- Always report residual risk when remediation is partial.

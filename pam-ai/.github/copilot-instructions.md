# PAM AI Workspace Instructions

## Goal
Use `pam-ai` as the operational layer (prompts, skills, MCP and automation) and keep `pam-frontend` focused on application code.

## Hard Boundaries
- Do not create MCP/Copilot setup files inside `pam-frontend`.
- Keep prompts, skills, agents, and MCP server artifacts inside `pam-ai`.
- Treat `pam-frontend` as code-only unless the user explicitly requests otherwise.

## Default Workflow
1. Discover scope in `pam-frontend`.
2. Use assets from `pam-ai/.github/prompts` and `pam-ai/.github/skills` for triage and planning.
3. Apply minimal, traceable code changes in `pam-frontend`.
4. Validate with relevant commands (`build`, `test`, `lint`) when available.
5. Report findings and residual risk clearly.

## Security and Secrets
- Never print or commit secrets.
- Prefer `.env` in `pam-ai/checkmarx-server` for local credentials.
- Avoid duplicating credentials across folders.

## Output Style
- Prioritize concrete findings and next actions.
- Keep changes small and reversible.
- Include file paths when describing edits.

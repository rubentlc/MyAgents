# PAM AI Workspace Instructions

## Goal
Use `pam-ai` as the operational layer (prompts, skills, MCP and automation) and keep `pam-frontend` and `pam-backend` focused on application code.

## Hard Boundaries
- Do not create MCP/Copilot setup files inside `pam-frontend` or `pam-backend`.
- Keep prompts, skills, agents, and MCP server artifacts inside `pam-ai`.
- Treat `pam-frontend` and `pam-backend` as code-only unless the user explicitly requests otherwise.

## Default Workflow
1. Discover scope in `pam-frontend` or `pam-backend`.
2. Use assets from `pam-ai/.github/prompts` and `pam-ai/.github/skills` for triage and planning.
3. Apply minimal, traceable code changes in the target project.
4. Validate with relevant commands (`build`, `test`, `lint`) when available.
5. Report findings and residual risk clearly.

## Backend Architecture Reference (pam-backend)
- **.NET 10**, 9 microservices + shared libraries
- **PAM.Gateway**: public GraphQL (HotChocolate stitching) + SignalR; Kerberos/Negotiate auth
- **API services** (`PAM.API.Project`, `.Program`, `.Community`, `.Comment`, `.Indicator`, `.Reporting`, `.Project-IO`): each owns its GraphQL schema via `[ExtendObjectType]` + MediatR CQRS
- **PAM.API.Integration.Shared**: sole gRPC server bridging all external systems (Dynamics 365, JDE, RADAR, PMT, MDM, IRIS)
- **PAM.Notification**: Kafka consumer → email worker
- **Persistence**: Dynamics 365 CRM (primary), MongoDB (comments/reports), Redis (cache + SignalR)
- **gRPC stubs**: auto-generated in `GRPC.Shared` from `.proto` files in `src/Protos/`
- **Auth**: Negotiate at Gateway only; downstream services trust forwarded headers
- **For backend tasks**: invoke `pam-be-engineer` agent or follow `pam-backend.instructions.md`

## i18n Rule — Mandatory for Any UI Work
Whenever a task touches user-visible text in `pam-frontend`:
1. Load `pam-ai/.github/skills/pam-i18n-refactor/SKILL.md` **before** writing any component.
2. Follow its namespace decision table — prefer the narrowest domain namespace (`projects`, `programs`, etc.) over `common`.
3. Always use **two separate hooks** when mixing namespaces — never `useTranslation(['ns1', 'ns2'])`:
   ```tsx
   const { t } = useTranslation('programs');        // domain keys
   const { t: tCommon } = useTranslation('common'); // shared keys
   ```
4. Create or update locale files for **all 3 languages** (EN, ES, FR) in the same change batch.
5. Never leave hardcoded strings, placeholder text, or `TODO: translate` comments in JSX.
6. For mass i18n audits (scanning a whole flow for untranslated strings), invoke the `pam-i18n-auditor` agent manually.

## Security and Secrets
- Never print or commit secrets.
- Prefer `.env` in `pam-ai/checkmarx-server` for local credentials.
- Avoid duplicating credentials across folders.

## Output Style
- Prioritize concrete findings and next actions.
- Keep changes small and reversible.
- Include file paths when describing edits.

---
applyTo: "**/*"
description: "Code quality standards applied to all agents and code generation. Based on Clean Code principles adapted for AI-agent workflows."
---

# Code Quality Standards

## Code Style

- **Functions:** 4–20 lines. Split if longer. If you need "and" to describe what it does, split it.
- **Files:** under 500 lines, ideally 150–300. Split by responsibility.
- **Single Responsibility:** one thing per function, one responsibility per module (SRP).
- **Names:** specific and unique. Avoid `data`, `handler`, `Manager`, `Service`. Prefer names that return fewer than 5 grep hits in the codebase.
- **Types:** explicit. No `any`, no untyped functions. TypeScript strict mode; explicit C# types.
- **No duplication.** Extract shared logic into a function or module — only when it has independent meaning or is reused, not just to reduce line count.
- **Early returns over nested ifs.** Max 2 levels of indentation.
- **Exception messages** must include the offending value and expected shape.

## Comments

- Keep existing comments on refactor — they carry intent and provenance.
- Write WHY, not WHAT. Skip `// increment counter` above `i++`.
- Docstrings on public functions: intent + one usage example.
- Reference issue numbers or commit SHAs when a line exists because of a specific bug or upstream constraint.

## Tests

- Tests run with a single command (see project-specific README or CLAUDE.md).
  - Frontend: `npm test`
  - PAM backend: `dotnet test`
- Bug fixes always get a regression test written before the fix.
- Mock external I/O (API, DB, filesystem) with named fake classes, not inline stubs.
- Tests must be F.I.R.S.T: fast, independent, repeatable, self-validating, timely.

### Frontend test pyramid

**Always test (pure logic — no DOM, no mocks needed):**
- Redux slices and reducers.
- `createSelector` derivations with business logic (totals, filters, groupings).
- Utility functions and helpers.

**Test when the component has non-trivial logic:**
- Forms with validation — verify that submit with invalid fields does not dispatch the action.
- Custom hooks encapsulating business logic (use `renderHook`).
- Components with complex internal state.

**Test only critical user flows (use MSW to mock endpoints):**
- Multi-step flows that combine reducer + API + navigation (e.g. submit activity, approve project).
- Do not test every page. Only flows where a silent regression would cause a real business problem.

**Do not test:**
- Purely visual components with no logic (`<Badge />`, `<Spinner />`).
- Pages that are only layout wrappers — they have no logic to assert.
- Snapshot tests — they break on every style change and carry no behavioral signal.

### Backend test pyramid

**Always test:**
- Service layer business logic with mocked repositories.
- Validation rules and exception paths.

**Test when behaviour is non-trivial:**
- Repository query construction when it involves conditional logic.
- Controller responses for each status code path.

**Do not test:**
- Stored procedure SQL — that lives in the DB, not in the app.
- Pure pass-through methods with no logic.

## Dependencies

- Inject dependencies through constructor or parameter, not global import.
- Wrap third-party libraries behind a thin interface owned by this project.

## Structure

- **Frontend (`pam-frontend`):** follow the existing Vite + React + Redux Toolkit structure. Components in `src/components/`, pages in `src/pages/`, RTK slices in `src/store/`.
- **Backend (`pam-backend`):** follow the microservice pattern — resolver → handler → gRPC → Integration.Shared → Dynamics/external. Each service owns its GraphQL schema.
- Prefer small focused modules over god files.
- Predictable paths that match the existing project conventions.

## Formatting

- Frontend: `prettier` (configured in repo). Run on save.
- Backend: `dotnet format`. Run before commit.
- Do not discuss style choices beyond the formatter output.

## Logging

- Structured JSON when logging for debugging or observability.
- Plain text only for user-facing CLI output.
- Never log secrets, tokens, connection strings, or PII.

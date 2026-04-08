---
mode: ask
model: GPT-5.3-Codex
description: "Use when adding a new enum list to pam-frontend getAppEnums end-to-end (GraphQL, RTK Query, models, mocks, enumVersion, and validation)."
---

You are implementing a new enum query in pam-frontend getAppEnums end-to-end.

Inputs:
- enumQueryName: {{$enumQueryName}}
- enumFields: {{$enumFields}}
- mockItems: {{$mockItems}}

Execution rules:
1. Make minimal, surgical edits only.
2. Follow existing naming/casing patterns already used in getAppEnums.
3. If enumFields is empty, default to id, code, description.
4. Keep all user-visible behavior unchanged except adding the new enum list.
5. Update both runtime code and mocks.
6. Always bump enumVersion in frontend mock getUserInformationAndPermissions by +1 from the current value in mock data.

Required file updates:
1. GraphQL query document:
- File: src/redux/api/general/appLists/graphql.ts
- Add new section inside query getAppEnums for enumQueryName with enumFields.

2. App enum model:
- File: src/models/appEnum.ts
- Add enumQueryName: IAppEnum[] to IAppEnums.

3. Mock getAppEnums response:
- File: src/graphql_mocks/general/getAppEnums.ts
- Add enumQueryName array using mockItems.
- If mockItems is empty, add at least 2 representative entries with id, code, description.

4. User info mock enum version:
- File: src/graphql_mocks/general/getUserInformationAndPermissions.ts
- Read current enumVersion value and increment it by +1.

5. Any type or usage fallout:
- Update imports/usages only if compile errors appear due to the new enum.

Validation:
1. Run npm run build in pam-frontend.
2. If build fails, fix only issues related to this change and rerun.

Output contract:
- What changed and why
- Files touched
- Validation result
- Residual risks (if any)

Now execute the change in codebase using these inputs.

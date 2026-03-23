---
name: pam-i18n-refactor
description: "Use for any task that involves user-facing strings in pam-frontend: new components, forms, modals, or migrating/refactoring existing translation keys. Covers namespace design, file structure, Trans component usage, and TypeScript typing."
---

# PAM i18n Refactor Skill

## When This Skill Applies
Load and follow this skill whenever:
- Creating a new component, form, modal, or view with user-visible text.
- Moving translation keys out of `common.json` into a domain namespace.
- Adding a new translation namespace.
- Fixing unsafe rendering of translated HTML (`dangerouslySetInnerHTML`).

---

## 1. Core Rule: No Hardcoded Strings
**Never** write user-visible text directly in JSX. Every label, placeholder, message, title, button text, error, hint, or tooltip must come from i18n.

```tsx
// ✗ Wrong
<p>Are you sure you want to delete this item?</p>

// ✓ Correct
<p>{t('confirmDelete')}</p>
```

---

## 2. Namespace Decision: Where Does a Key Belong?

Ask: *"Is this string used exclusively by one domain/feature, or shared across many?"*

| Situation | Namespace |
|---|---|
| Used only inside one domain (e.g., projects, programs) | Domain namespace (`projects`, `programs`, etc.) |
| Used only by one admin modal | `administration` |
| Used only by comments components | `comments` |
| Used only by reports views | `reports` |
| Genuinely reused across multiple unrelated domains | `common` |

**When in doubt, prefer the narrower namespace.** It is always easier to promote a key to `common` later than to clean up `common` after the fact.

### Existing namespaces in pam-frontend
- `common` — generic actions, messages, labels, status values, shared UI
- `projects` — project domain (deleteOutcome, deleteOutput, specificObjectives, historyOfChanges, etc.)
- `programs` — program domain (deleteProgram, validators, narrativeHints, etc.)
- `communities` — community domain
- `reports` — report views (generalComments, byCommunityStructure, byProject, etc.)
- `navigation` — sidebar/topbar navigation labels
- `comments` — CommentsPanel, CommentForm, NotifyTeamMember
- `administration` — AdvancedSettings, ScheduleGlobalAlert

---

## 3. Adding a New Namespace

When a feature is clearly domain-specific and has no existing namespace, create one.

### Step 1 — Create the JSON files for all 3 locales
```
src/i18n/locales/en/<namespace>.json
src/i18n/locales/es/<namespace>.json
src/i18n/locales/fr/<namespace>.json
```
Always create all three at the same time. Never leave a locale incomplete.

### Step 2 — Register in `src/i18n/locales/index.ts`
```ts
import en<Namespace> from './en/<namespace>.json';
import es<Namespace> from './es/<namespace>.json';
import fr<Namespace> from './fr/<namespace>.json';

const resources = {
  en: { ..., <namespace>: en<Namespace> },
  es: { ..., <namespace>: es<Namespace> },
  fr: { ..., <namespace>: fr<Namespace> },
};
```

### Step 3 — Register in `src/i18n/index.ts`
```ts
ns: ['common', 'navigation', 'projects', 'programs', 'comments', 'administration', '<namespace>'],
```

### Step 4 — Register in `src/i18n/types.ts`
```ts
import en<Namespace> from './locales/en/<namespace>.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      ...
      <namespace>: typeof en<Namespace>;
    };
  }
}
```

---

## 4. Using Translations in Components

### Single namespace (preferred)
```tsx
const { t } = useTranslation('comments');
// Keys are unqualified: t('addComment'), t('noComments')
```

### Mixed namespaces (when a component needs both a domain NS and common)
```tsx
const { t } = useTranslation('programs');       // primary
const { t: tCommon } = useTranslation('common'); // for shared keys

// Domain keys
t('deleteProgram.title')
// Common keys
tCommon('messages.yesDelete')
tCommon('actions.cancel')
```

**Never** use inline `{ ns: 'common' }` options — use a dedicated `tCommon` alias instead.

---

## 5. Rendering HTML in Translations: Use Trans, Never dangerouslySetInnerHTML

When a translation value contains HTML tags (`<b>`, `<ul>`, `<li>`, `<br>`):

```tsx
// ✗ Wrong — XSS risk
<p dangerouslySetInnerHTML={{ __html: t('someKey') }} />

// ✓ Correct
import { Trans } from 'react-i18next';

<Trans
  i18nKey="deleteOutcome.cannotDeleteWithOutputs"
  t={t}
  components={{ b: <b /> }}
/>
```

Pass `t={t}` explicitly so TypeScript resolves the namespace correctly.

### Supported components in locale values
Only use the component tags that actually appear in the locale JSON. Currently used:
- `<b>` — bold (delete modals)
- `<br>` — line break (narrative hints)
- `<ul>` / `<li>` — lists (narrative hints); `marginLeft` style goes in the React component, not in the JSON

---

## 6. Interpolation Placeholder Format

Always use `{{variable}}` — the i18next native format.

```json
// ✓ Correct
"deleteDelayText": "This will be deleted in {{seconds}} seconds"

// ✗ Wrong — template literal style, not interpolated by i18next
"deleteDelayText": "This will be deleted in ${seconds} seconds"
```

---

## 7. TypeScript and Dynamic Keys

When using a dynamic (runtime) key with `Trans`, TypeScript will complain because the key is not in the static union type. Use `as any` with a comment explaining why:

```tsx
// i18nKey is dynamic (runtime key), bypassing i18next strict union type.
<Trans i18nKey={key as any} t={t as any} components={HINT_COMPONENTS} />
```

---

## 8. Validation

After any i18n change, always run:
```bash
npm run build
```
This catches TypeScript namespace typing errors and missing key references.

---

## 9. Key Naming Conventions

- Use **camelCase** for key names.
- Group related keys under a block object: `{ "deleteProgram": { "title": "...", "confirmMessage": "..." } }`.
- Keep key names semantic (describe meaning, not location): `confirmDelete`, not `modalBottomButtonLeft`.
- Top-level string keys (not objects) are acceptable for simple single-value entries: `"historyOfChanges": "History of changes"`.

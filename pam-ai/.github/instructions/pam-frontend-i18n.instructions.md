---
applyTo: "src/i18n/**"
description: "i18n (internationalization) rules for pam-frontend. Covers namespace conventions, untranslated keys, and translation maintenance."
---

# PAM Frontend i18n Rules

## Untranslated Keys (CRITICAL)

The following keys **MUST NOT be translated**. They must always use English values in all locale files (EN, ES, FR):

| Key | English Value | Files |
|-----|---------------|-------|
| `populatedPlace` | "Populated Place" | `communities.json`, `common.json` |
| `recipientPlace` | "Recipient Place" | `communities.json`, `projects.json` |

**Rationale**: These are system/data classification terms that must remain consistent across all languages to ensure data integrity and system functionality.

### Affected Sections
- `communities.json`: `filters`, `form`, `mapLegend`
- `common.json`: utilities section
- `projects.json`: `recipientPlaces` section

## Namespace Convention

- **Domain namespaces** (primary): `projects`, `programs`, `communities`, `reports`, `comments`, `administration`
- **Common namespace** (shared only): `common` — used for genuinely shared labels across multiple unrelated domains
- **Namespace narrowing**: Prefer domain namespaces; promote to `common` only when reused across 2+ domains

## Translation Maintenance

- **Always update all 3 locales** (EN, ES, FR) in the same batch — never leave a locale incomplete.
- **Check for untranslated keys** when adding new content. Refer to this file or `/memories/repo/pam-frontend-untranslated-keys.md`.
- **Before translating a new key**, verify it's not in the untranslated list.

## For Developers

When creating or modifying components with user-visible text:
1. Use the `pam-i18n-refactor` skill (in `.github/skills/`).
2. Never hardcode strings — all labels, placeholders, tooltips, error messages must go through `t(...)`.
3. Split multi-namespace hooks:
   ```typescript
   const { t } = useTranslation('projects');        // domain
   const { t: tCommon } = useTranslation('common'); // shared
   ```

## For Translators / i18n Audits

- Mass i18n audits across a flow should invoke the `pam-i18n-auditor` agent.
- When reviewing translations, cross-check against the untranslated keys list above.
- Report any translations of `populatedPlace` or `recipientPlace` as errors — they should always be English.

**Last updated**: May 8, 2026

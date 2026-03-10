# Checkmarx: High/Critical Findings

Use this prompt to triage severe findings fast.

## Prompt

No projeto `<PROJECT_ID_OR_NAME>` (e scan `<SCAN_ID>` quando informado), lista apenas vulnerabilidades `high` e `critical`.

Instrucoes:
- Usa `checkmarx_list_vulnerabilities`.
- Filtra por severidade no request; se nao suportado, filtra localmente.
- Agrupa por severidade e depois por tipo de finding.
- Para cada item, traz: `id`, `severity`, `state/status`, `package/file`, `shortDescription`.
- Fecha com top 5 a corrigir primeiro e justificativa curta de risco.

# Checkmarx: List Scans By Project

Use this prompt to inspect recent scans for a project.

## Prompt

Para o projeto `<PROJECT_ID_OR_NAME>`, lista os scans mais recentes com:
- `scanId`
- `status/state`
- `branch` (se existir)
- `createdAt` e `finishedAt` (se existir)

Instrucoes:
- Resolve o projeto por id ou nome.
- Usa `checkmarx_list_scans` filtrando por `projectId`.
- Mostra os 15 mais recentes.
- Se houver falha de filtro por projeto, tenta fallback e filtra localmente pelo campo de projeto no payload.

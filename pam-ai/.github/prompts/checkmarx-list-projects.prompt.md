# Checkmarx: List Projects

Use this prompt when you want a compact project inventory from Checkmarx.

## Prompt

Lista os projetos do Checkmarx e devolve em tabela com:
- `name`
- `id`
- `updatedAt`
- `criticality` (se existir)

Instrucoes:
- Usa a tool MCP `checkmarx_list_projects` com `limit=200`.
- Ordena por `updatedAt` desc quando o campo existir.
- Se o retorno vier paginado ou com estrutura inesperada, explica a estrutura detectada e mostra os 20 primeiros itens normalizados.

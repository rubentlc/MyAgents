# Checkmarx MCP Server

Servidor MCP para consultar projetos, scans e vulnerabilidades no Checkmarx One.

## Configuracao

Preencha `mcp/checkmarx-server/.env`:

- `CHECKMARX_BASE_URL` (ex.: `https://eu.ast.checkmarx.net`)
- `CHECKMARX_API_KEY`
- `CHECKMARX_AUTH_HEADER` (opcional, default: `Authorization`)
- `CHECKMARX_AUTH_SCHEME` (opcional, default: `ApiKey`)

Se sua instancia exigir outro formato, ajuste `CHECKMARX_AUTH_HEADER` e `CHECKMARX_AUTH_SCHEME`.

## Comandos

```bash
npm run mcp:checkmarx:install
npm run mcp:checkmarx:build
npm run mcp:checkmarx:start
```

## Tools MCP

- `checkmarx_list_projects`
- `checkmarx_list_scans`
- `checkmarx_list_vulnerabilities`
- `checkmarx_raw_get`

# Checkmarx MCP Server

Servidor MCP para consultar projetos, scans e vulnerabilidades no Checkmarx One.

## Configuracao

Preencha `checkmarx-server/.env`:

- `CHECKMARX_BASE_URL` (ex.: `https://eu.ast.checkmarx.net`)
- `CHECKMARX_API_KEY`
- `CHECKMARX_AUTH_HEADER` (opcional, default: `Authorization`)
- `CHECKMARX_AUTH_SCHEME` (opcional, default: `ApiKey`)

Se sua instancia exigir outro formato, ajuste `CHECKMARX_AUTH_HEADER` e `CHECKMARX_AUTH_SCHEME`.

## Comandos

```bash
cd checkmarx-server
npm install
npm run build
npm run start
```

## VS Code MCP (no pam-ai)

Use `pam-ai/.vscode/mcp.json` com:

- `command`: `node`
- `args`: `${workspaceFolder}/checkmarx-server/dist/index.js`
- `cwd`: `${workspaceFolder}/checkmarx-server`
- `envFile`: `${workspaceFolder}/checkmarx-server/.env`

## Tools MCP

- `checkmarx_list_projects`
- `checkmarx_list_scans`
- `checkmarx_list_vulnerabilities`
- `checkmarx_raw_get`

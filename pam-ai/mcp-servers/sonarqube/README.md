# SonarQube MCP Server

MCP server para consultar projetos e issues no SonarQube.

## Configuracao

Preencha `sonarqube-server/.env`:

- `SONARQUBE_BASE_URL` (ex.: `http://sonarqube.ext.icrc.org`)
- `SONARQUBE_TOKEN` (token de usuario SonarQube)
- `SONARQUBE_AUTH_HEADER` (opcional, default: `Authorization`)
- `SONARQUBE_AUTH_SCHEME` (opcional, default: `Basic`)

## Comandos

```bash
cd sonarqube-server
npm install
npm run build
npm run start
```

## VS Code MCP (no pam-ai)

Use `pam-ai/.vscode/mcp.json` com:

- `command`: `node`
- `args`: `${workspaceFolder}/sonarqube-server/dist/index.js`
- `cwd`: `${workspaceFolder}/sonarqube-server`
- `envFile`: `${workspaceFolder}/sonarqube-server/.env`

## Tools MCP

- `sonarqube_list_projects`
- `sonarqube_list_issues`
- `sonarqube_list_hotspots`
- `sonarqube_get_project_quality_gate`
- `sonarqube_raw_get`

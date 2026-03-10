# Checkmarx: Dependency Update Plan

Use this prompt to generate and execute a dependency remediation plan.

## Prompt

Com base nos findings do Checkmarx para `<PROJECT_ID_OR_NAME>`, cria e executa um plano de atualizacao de dependencias com minimo risco.

Instrucoes:
- Cruza findings com `package.json` e lockfile do repo atual.
- Prioriza atualizacoes `patch` e `minor`; justifica qualquer `major`.
- Aplica mudancas incrementalmente em lotes pequenos.
- Depois de cada lote, valida com build/test/lint relevantes.
- Entrega resultado final com:
  - dependencias atualizadas
  - findings mitigados estimados
  - riscos residuais
  - rollback simples por lote

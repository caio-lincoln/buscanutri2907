# Codex Contexto BuscaNutri

## Como funciona

O script define `CODEX_HOME` dedicado do BuscaNutri.

- sessao/historico local
- configuracao `config.toml`
- skills/estado local do Codex

Tambem usa MCP do projeto BuscaNutri.

## Script

- `scripts/codex/start-buscanutri.ps1`

## Uso

```powershell
.\scripts\codex\start-buscanutri.ps1
```

## Variaveis de ambiente

Defina:

```powershell
[Environment]::SetEnvironmentVariable("SUPABASE_MCP_TOKEN_BUSCANUTRI","sbp_f3358b71636e8209420e3c7cdf8a012de019b68b","User")
```

Feche e abra o terminal apos definir.

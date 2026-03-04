# Codex Contexto de Perfis (BuscaNutri e PreFest)

## Objetivo

Manter dois perfis equivalentes, com alternancia simples e isolamento de MCP:

- `buscanutri` usa somente MCP BuscaNutri
- `prefest` usa somente MCP PreFest

## Scripts

- `scripts/codex/start-buscanutri.ps1`
- `scripts/codex/start-prefest.ps1`

Cada script define um `CODEX_HOME` separado:

- BuscaNutri: `.codex-buscanutri`
- PreFest: `.codex-prefest`

Isso isola historico, estado e MCP por perfil.

## Uso

```powershell
# Perfil BuscaNutri
.\scripts\codex\start-buscanutri.ps1

# Perfil PreFest
.\scripts\codex\start-prefest.ps1
```

Opcionalmente, voce pode informar `project_ref` no start:

```powershell
.\scripts\codex\start-prefest.ps1 -ProjectRef "<project_ref_prefest>"
.\scripts\codex\start-buscanutri.ps1 -ProjectRef "<project_ref_buscanutri>"
```

## Variaveis de ambiente

Defina tokens dedicados para manter isolamento completo:

```powershell
[Environment]::SetEnvironmentVariable("SUPABASE_MCP_TOKEN_BUSCANUTRI","<token_buscanutri>","User")
[Environment]::SetEnvironmentVariable("SUPABASE_MCP_TOKEN_PREFEST","<token_prefest>","User")
```

Fallback: se a variavel dedicada nao existir, os scripts usam `SUPABASE_MCP_TOKEN` no processo atual.

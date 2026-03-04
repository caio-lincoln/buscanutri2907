Param(
  [string]$RepoPath = "c:\Users\Caio Lincoln\Documents\GitHub\buscanutri2907"
)

$ErrorActionPreference = "Stop"

$codexHome = Join-Path $env:USERPROFILE ".codex-buscanutri"
$configPath = Join-Path $codexHome "config.toml"

if (-not (Test-Path $codexHome)) {
  New-Item -ItemType Directory -Path $codexHome | Out-Null
}

@'
model = "gpt-5.3-codex"
model_reasoning_effort = "medium"

[mcp_servers.BuscaNutri]
url = "https://mcp.supabase.com/mcp?project_ref=lutokoucdfhfbwtppzwe"
bearer_token_env_var = "SUPABASE_MCP_TOKEN_BUSCANUTRI"

[windows]
sandbox = "elevated"
'@ | Set-Content -Path $configPath -Encoding UTF8

$env:CODEX_HOME = $codexHome

if (-not $env:SUPABASE_MCP_TOKEN_BUSCANUTRI) {
  Write-Host "SUPABASE_MCP_TOKEN_BUSCANUTRI nao definido no ambiente atual."
  Write-Host "Defina no User env para persistir:"
  Write-Host '[Environment]::SetEnvironmentVariable("SUPABASE_MCP_TOKEN_BUSCANUTRI","sbp_f3358b71636e8209420e3c7cdf8a012de019b68b","User")'
}

codex -C $RepoPath @args

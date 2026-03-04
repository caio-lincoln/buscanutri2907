Param(
  [string]$RepoPath = "c:\Users\Caio Lincoln\Documents\GitHub\buscanutri2907",
  [string]$ProjectRef = "wuqztevrdctctwmetjzn"
)

$ErrorActionPreference = "Stop"

$codexHome = Join-Path $env:USERPROFILE ".codex-prefest"
$configPath = Join-Path $codexHome "config.toml"
$mcpUrl = "https://mcp.supabase.com/mcp?project_ref=$ProjectRef"

if (-not (Test-Path $codexHome)) {
  New-Item -ItemType Directory -Path $codexHome | Out-Null
}

@"
model = "gpt-5.3-codex"
model_reasoning_effort = "medium"

[mcp_servers.PreFest]
url = "__MCP_URL__"
bearer_token_env_var = "SUPABASE_MCP_TOKEN_PREFEST"

[windows]
sandbox = "elevated"
"@ -replace "__MCP_URL__", $mcpUrl | Set-Content -Path $configPath -Encoding UTF8

$env:CODEX_HOME = $codexHome

# Fallback to generic MCP token if dedicated one is not set.
if (-not $env:SUPABASE_MCP_TOKEN_PREFEST -and $env:SUPABASE_MCP_TOKEN) {
  $env:SUPABASE_MCP_TOKEN_PREFEST = $env:SUPABASE_MCP_TOKEN
}

if (-not $env:SUPABASE_MCP_TOKEN_PREFEST) {
  Write-Host "SUPABASE_MCP_TOKEN_PREFEST nao definido no ambiente atual."
  Write-Host "Defina no User env para persistir:"
  Write-Host '[Environment]::SetEnvironmentVariable("SUPABASE_MCP_TOKEN_PREFEST","<seu_token_sbp>","User")'
}

# Avoid passing working-directory twice when caller already includes --cd/-C.
$forwardArgs = @()

for ($i = 0; $i -lt $args.Count; $i++) {
  $arg = [string]$args[$i]
  $parts = @($arg -split '\s+')

  for ($j = 0; $j -lt $parts.Count; $j++) {
    $part = $parts[$j]
    if ($part -eq "--cd" -or $part -eq "-C" -or $part -like "--cd=*") {
      if ($part -eq "--cd" -or $part -eq "-C") {
        if ($j -lt $parts.Count - 1) { $j++ }
        else { $i++ }
      }
      continue
    }

    $forwardArgs += $part
  }
}

Push-Location $RepoPath
try {
  codex @forwardArgs
}
finally {
  Pop-Location
}


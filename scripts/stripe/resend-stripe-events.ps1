Param(
  [string]$EndpointUrl = "https://www.buscanutri.com.br/api/stripe/webhook",
  [string[]]$EndpointIds = @(),
  [string]$EventsFile = "",
  [int]$Limit = 50,
  [string]$TypeFilter = "",
  [switch]$OnlyFailed
)

$ErrorActionPreference = "Stop"

function Require-StripeCli {
  if (-not (Get-Command stripe -ErrorAction SilentlyContinue)) {
    throw "Stripe CLI nao encontrado. Instale e execute novamente."
  }
}

function Get-EndpointIdsFromUrl {
  param([string]$Url)

  $json = stripe webhook_endpoints list --limit 100
  $data = $json | ConvertFrom-Json
  $matches = $data.data | Where-Object { $_.url -eq $Url } | Select-Object -ExpandProperty id
  if (-not $matches -or $matches.Count -eq 0) {
    throw "Nenhum webhook endpoint encontrado para URL: $Url"
  }
  return $matches
}

function Get-EventIdsFromFile {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    throw "Arquivo de eventos nao encontrado: $Path"
  }

  return (Get-Content $Path | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^evt_' })
}

function Get-RecentEventIds {
  param(
    [int]$Take,
    [string]$Type
  )

  $args = @("events", "list", "--limit", "$Take")
  if ($Type) {
    $args += @("--type", $Type)
  }

  $json = stripe @args
  $data = $json | ConvertFrom-Json
  return ($data.data | ForEach-Object { $_.id })
}

Require-StripeCli

if (-not $EndpointIds -or $EndpointIds.Count -eq 0) {
  $EndpointIds = Get-EndpointIdsFromUrl -Url $EndpointUrl
}

$eventIds = @()
if ($EventsFile) {
  $eventIds = Get-EventIdsFromFile -Path $EventsFile
} else {
  $eventIds = Get-RecentEventIds -Take $Limit -Type $TypeFilter
}

if (-not $eventIds -or $eventIds.Count -eq 0) {
  Write-Host "Nenhum evento para reenviar."
  exit 0
}

Write-Host "Endpoints: $($EndpointIds -join ', ')"
Write-Host "Eventos a reenviar: $($eventIds.Count)"

$ok = 0
$fail = 0

foreach ($evt in $eventIds) {
  foreach ($endpointId in $EndpointIds) {
    try {
      if ($OnlyFailed) {
        # Stripe CLI nao fornece filtro confiavel de falha por endpoint no events list.
        # Quando -OnlyFailed for usado sem arquivo, o operador deve fornecer EventsFile com eventos falhos.
        if (-not $EventsFile) {
          continue
        }
      }

      stripe events resend $evt --webhook-endpoint $endpointId | Out-Null
      $ok++
      Write-Host "OK  $evt -> $endpointId"
    } catch {
      $fail++
      Write-Host "ERR $evt -> $endpointId - $($_.Exception.Message)"
    }
  }
}

Write-Host ""
Write-Host "Resumo: sucesso=$ok falha=$fail total=$($eventIds.Count)"

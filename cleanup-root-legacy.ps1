param(
  [switch]$IncludeSensitive,
  [switch]$WhatIfOnly
)

$ErrorActionPreference = "Stop"

function Remove-Target {
  param([string]$RelativePath)

  if (-not (Test-Path -LiteralPath $RelativePath)) {
    return
  }

  if ($WhatIfOnly) {
    Write-Host "[dry-run] Removeria: $RelativePath"
    return
  }

  $item = Get-Item -LiteralPath $RelativePath
  if ($item.PSIsContainer) {
    Remove-Item -LiteralPath $RelativePath -Recurse -Force
  } else {
    Remove-Item -LiteralPath $RelativePath -Force
  }

  Write-Host "Removido: $RelativePath"
}

Write-Host ""
Write-Host "1) Limpando cache/backup temporário..."
@(
  ".next",
  "node_modules",
  ".workspace-migration-backup"
) | ForEach-Object { Remove-Target $_ }

Write-Host ""
Write-Host "2) Limpando legado do app antigo na raiz..."
@(
  "src",
  "public",
  "next.config.ts",
  "next-env.d.ts",
  ".firebaserc",
  "firebase.json",
  "postcss.config.mjs",
  "eslint.config.mjs"
) | ForEach-Object { Remove-Target $_ }

if ($IncludeSensitive) {
  Write-Host ""
  Write-Host "3) Removendo arquivo sensível..."
  @(
    "service-account.json"
  ) | ForEach-Object { Remove-Target $_ }
} else {
  Write-Host ""
  Write-Host "3) Arquivo sensível NÃO removido automaticamente."
  Write-Host "   Rode com -IncludeSensitive para remover service-account.json"
}

Write-Host ""
Write-Host "Concluído."

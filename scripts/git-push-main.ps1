# Sube main a GitHub (SSH). Requiere clave en https://github.com/settings/keys
# o haber ejecutado: gh auth login -h github.com -p ssh -s repo

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

git remote set-url origin git@github.com:amsnowboardcoach/am-snowboard-coach.git
git push origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host "Push completado." -ForegroundColor Green
} else {
  Write-Host "Push fallido. Añade la clave SSH en GitHub (cuenta amsnowboardcoach) o ejecuta: gh auth login -h github.com -p ssh -s repo" -ForegroundColor Yellow
  exit 1
}

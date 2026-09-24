# docker-run.ps1 - ONE COMMAND to run VIBEMATCH with Docker (live-reload)
# Usage: powershell -ExecutionPolicy Bypass -File docker-run.ps1
#        powershell -ExecutionPolicy Bypass -File docker-run.ps1 -Build   # force rebuild
#        powershell -ExecutionPolicy Bypass -File docker-run.ps1 -Down     # stop
param(
  [switch]$Build,
  [switch]$Down,
  [switch]$Watch
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if ($Down) {
  Write-Host "Stopping..." -ForegroundColor Yellow
  docker compose down
  exit $LASTEXITCODE
}

# Ensure DB file exists before mount (Docker creates a directory if file missing)
$db = Join-Path $PSScriptRoot "vibematch.db"
if (-not (Test-Path $db)) {
  Write-Host "Creating empty vibematch.db (first run)..." -ForegroundColor Cyan
  New-Item -ItemType File -Path $db -Force | Out-Null
}

# Ensure .env exists
if (-not (Test-Path (Join-Path $PSScriptRoot ".env"))) {
  if (Test-Path (Join-Path $PSScriptRoot ".env.example")) {
    Copy-Item (Join-Path $PSScriptRoot ".env.example") (Join-Path $PSScriptRoot ".env")
    Write-Host "Created .env from .env.example" -ForegroundColor Yellow
  }
}

# Check Docker engine
try { docker info 2>&1 | Out-Null } catch {}
if ($LASTEXITCODE -ne 0) {
  Write-Host "`nDocker engine not running!" -ForegroundColor Red
  Write-Host "Fix: powershell -ExecutionPolicy Bypass -File setup-docker.ps1" -ForegroundColor Yellow
  Write-Host "Then open Docker Desktop and wait for 'Engine running', then re-run this script." -ForegroundColor Yellow
  Write-Host "`nFallback (no Docker, works right now):" -ForegroundColor Cyan
  Write-Host "  powershell -ExecutionPolicy Bypass -File dev.ps1" -ForegroundColor White
  exit 1
}

Write-Host "`n=== VIBEMATCH (Docker) ===" -ForegroundColor Cyan
Write-Host "API:     http://localhost:8000  /healthz  /docs" -ForegroundColor White
Write-Host "Website: http://localhost:5173" -ForegroundColor White
Write-Host "Live reload: edit app/*.py or website/* -> auto-restarts (no rebuild needed)" -ForegroundColor Gray
Write-Host ""

# Validate
Write-Host "Validating compose..." -ForegroundColor Gray
docker compose config 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "docker compose config failed - check docker-compose.yml" -ForegroundColor Red
  docker compose config
  exit 1
}

# Run
if ($Watch) {
  Write-Host "Running: docker compose up --watch  (fastest live sync)" -ForegroundColor Green
  docker compose up --watch
} elseif ($Build) {
  Write-Host "Running: docker compose up --build" -ForegroundColor Green
  docker compose up --build
} else {
  # Auto-detect first build vs cached
  Write-Host "Running: docker compose up  (add -Build for fresh rebuild, -Watch for instant sync)" -ForegroundColor Green
  Write-Host "Tip: docker compose up --watch  = even faster sync (Compose v2.22+)" -ForegroundColor Gray
  docker compose up
}

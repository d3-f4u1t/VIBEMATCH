# setup-docker.ps1 - ONE-TIME admin setup for Docker on Windows (WSL2)
# Run:  powershell -ExecutionPolicy Bypass -File setup-docker.ps1
# It auto-elevates to Admin, installs WSL, and reboots if needed.
# After reboot: open Docker Desktop once, wait for "Engine running", then use docker-run.ps1

param(
  [switch]$NoReboot
)

$ErrorActionPreference = "Stop"

function Test-IsAdmin {
  return ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Self-elevate if not admin
if (-not (Test-IsAdmin)) {
  Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
  Write-Host "Please click YES on the UAC prompt." -ForegroundColor Cyan
  $elevateArgs = '-ExecutionPolicy Bypass -File "' + $PSCommandPath + '"'
  if ($NoReboot) { $elevateArgs += ' -NoReboot' }
  try {
    Start-Process powershell -ArgumentList $elevateArgs -Verb RunAs -Wait
    exit $LASTEXITCODE
  } catch {
    Write-Host "Failed to elevate. Please manually run as Administrator:" -ForegroundColor Red
    Write-Host "  Right-click PowerShell -> Run as Administrator" -ForegroundColor Yellow
    Write-Host "  powershell -ExecutionPolicy Bypass -File $PSCommandPath" -ForegroundColor Yellow
    exit 1
  }
}

Write-Host "`n=== VIBEMATCH Docker Setup (Admin) ===" -ForegroundColor Cyan

# Check WSL
Write-Host "`n[1/3] Checking WSL..." -ForegroundColor White
$wslVersion = $null
try { $wslVersion = wsl --version 2>&1 | Out-String } catch {}
if ($wslVersion -and $wslVersion -notlike "*not installed*") {
  Write-Host "WSL already installed:" -ForegroundColor Green
  Write-Host $wslVersion
  $wslStatus = wsl --status 2>&1 | Out-String
  Write-Host $wslStatus
} else {
  Write-Host "WSL not installed - installing..." -ForegroundColor Yellow
  # This enables VirtualMachinePlatform + WSL and installs default Ubuntu kernel
  # --no-distribution avoids downloading Ubuntu distro (Docker uses its own distro)
  Write-Host "Running: wsl --install --no-distribution" -ForegroundColor Cyan
  wsl --install --no-distribution 2>&1 | Out-String | Write-Host
  if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
    Write-Host "wsl --install exit code $LASTEXITCODE - trying alternative..." -ForegroundColor Yellow
    # Fallback: enable features directly
    try {
      Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -All -NoRestart | Out-Null
      Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All -NoRestart | Out-Null
      Write-Host "Enabled WSL features via DISM." -ForegroundColor Green
    } catch {
      Write-Host "Enable-WindowsOptionalFeature failed: $_" -ForegroundColor Red
    }
  } else {
    Write-Host "WSL installed successfully." -ForegroundColor Green
  }
  Write-Host "`n*** REBOOT REQUIRED ***" -ForegroundColor Red -BackgroundColor Black
  if (-not $NoReboot) {
    Write-Host "Rebooting in 10 seconds... (Ctrl+C to cancel, or run with -NoReboot)" -ForegroundColor Yellow
    Start-Sleep 10
    Restart-Computer -Force
    exit 0
  } else {
    Write-Host "Reboot skipped (-NoReboot). Please reboot manually, then re-run this script." -ForegroundColor Yellow
    exit 0
  }
}

# Check if reboot still pending
Write-Host "`n[2/3] Checking Docker Desktop..." -ForegroundColor White
$dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if (Test-Path $dockerPath) {
  Write-Host "Docker Desktop found at $dockerPath" -ForegroundColor Green
  # Try to start Docker Desktop if not running
  $svc = Get-Service com.docker.service -ErrorAction SilentlyContinue
  if ($svc -and $svc.Status -ne "Running") {
    Write-Host "Starting Docker Desktop service..." -ForegroundColor Cyan
    try { Start-Service com.docker.service -ErrorAction Stop; Write-Host "Service started." -ForegroundColor Green } catch { Write-Host "Service start failed: $_" -ForegroundColor Yellow }
  }
  # Start Docker Desktop app if engine not running
  try { docker info 2>&1 | Out-Null; $engineRunning = ($LASTEXITCODE -eq 0) } catch { $engineRunning = $false }
  if (-not $engineRunning) {
    Write-Host "Starting Docker Desktop app (wait 60s for Engine running)..." -ForegroundColor Cyan
    Start-Process $dockerPath -ErrorAction SilentlyContinue
    Write-Host "Waiting for Docker engine..." -ForegroundColor Yellow
    $waited = 0
    while ($waited -lt 90) {
      Start-Sleep 5; $waited += 5
      try { docker info 2>&1 | Out-Null; if ($LASTEXITCODE -eq 0) { Write-Host "Docker engine is running! ($waited s)" -ForegroundColor Green; break } } catch {}
      Write-Host "  ... still waiting ($waited s)"
    }
  } else {
    Write-Host "Docker engine already running." -ForegroundColor Green
  }
} else {
  Write-Host "Docker Desktop not found at $dockerPath" -ForegroundColor Red
  Write-Host "Install it from https://www.docker.com/products/docker-desktop/ then re-run this script." -ForegroundColor Yellow
}

Write-Host "`n[3/3] Validating compose..." -ForegroundColor White
Set-Location $PSScriptRoot
try {
  docker compose config 2>&1 | Out-String | Write-Host
  if ($LASTEXITCODE -eq 0) { Write-Host "docker compose config OK" -ForegroundColor Green }
} catch { Write-Host "compose validation failed: $_" -ForegroundColor Red }

Write-Host "`n=== Setup complete ===" -ForegroundColor Cyan
Write-Host "Next: powershell -ExecutionPolicy Bypass -File docker-run.ps1" -ForegroundColor White
Write-Host "  or: docker compose up --watch" -ForegroundColor Gray
Write-Host "Check: http://localhost:8000/healthz  and  http://localhost:5173" -ForegroundColor Gray

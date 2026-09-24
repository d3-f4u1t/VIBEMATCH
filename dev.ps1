# VIBEMATCH one-command dev runner (no Docker needed)
# Usage:  powershell -ExecutionPolicy Bypass -File dev.ps1              # api (backend) only + mobile instructions
#         powershell -ExecutionPolicy Bypass -File dev.ps1 -WithWebsite # also start intro website
param(
  [switch]$NoWebsite,
  [switch]$WithWebsite
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$env:PYTHONPATH = $root
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Ensure mobile/.env has current LAN IP (phone needs LAN IP, not localhost)
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "10.*" -or $_.IPAddress -like "192.168.*" } | Select-Object -First 1 -ExpandProperty IPAddress)
if (-not $lanIp) { $lanIp = "10.51.164.128" }
$mobileEnv = Join-Path $root "mobile\.env"
$expected = "EXPO_PUBLIC_API_BASE_URL=http://${lanIp}:8000"
if (-not (Test-Path $mobileEnv) -or ((Get-Content $mobileEnv -Raw -ErrorAction SilentlyContinue) -notlike "*$lanIp*")) {
  $expected | Set-Content $mobileEnv
  Write-Host "Updated mobile/.env -> http://${lanIp}:8000"
} else {
  Write-Host "mobile/.env exists: $(Get-Content $mobileEnv)"
}

# Firewall rule (once)
try { netsh advfirewall firewall add rule name="VibeMatch 8000" dir=in action=allow protocol=TCP localport=8000 2>&1 | Out-Null } catch {}

Write-Host "`n=== VIBEMATCH DEV ===" -ForegroundColor Cyan
Write-Host "API (backend):  http://localhost:8000  docs http://localhost:8000/docs  health http://localhost:8000/healthz"
Write-Host "LAN API:        http://${lanIp}:8000 (phone uses this)"
Write-Host "Frontend (mobile Expo):  npx expo start --prefix mobile  (scan QR with Expo Go 57) -> uses EXPO_PUBLIC_API_BASE_URL from mobile/.env"
if ($WithWebsite) { Write-Host "Intro website (optional): http://localhost:5173" } else { Write-Host "Intro website (optional): run with -WithWebsite to start it" }
Write-Host ""

# Start API in background job with --host 0.0.0.0 for phone
$apiJob = Start-Job -ScriptBlock {
  param($root)
  $env:PYTHONPATH = $root
  Set-Location $root
  python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
} -ArgumentList $root

# Start intro website only if explicitly requested (it's separate from mobile frontend)
$webJob = $null
$runWebsite = $WithWebsite -and (-not $NoWebsite)
if (-not $WithWebsite -and -not $NoWebsite) {
  # Default: backend only, no website (website is intro site, not mobile frontend)
  $runWebsite = $false
}
if ($runWebsite) {
  if (Get-Command npm -ErrorAction SilentlyContinue) {
    $webJob = Start-Job -ScriptBlock {
      param($root)
      Set-Location (Join-Path $root "website")
      npm run dev -- --host 0.0.0.0 --port 5173
    } -ArgumentList $root
    Write-Host "Intro website job started (job $($webJob.Id)) on http://localhost:5173"
  } else {
    Write-Host "npm not found - skipping intro website" -ForegroundColor Yellow
  }
} else {
  Write-Host "Intro website not started (use -WithWebsite to start it)" -ForegroundColor Gray
}

Write-Host "API job $($apiJob.Id) started - live reloads on ./app changes" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop (or close this window)`n"

# Tail logs - don't let job output terminating errors kill the loop
$prevPref = $ErrorActionPreference
$ErrorActionPreference = "Continue"
try {
  while ($true) {
    Receive-Job $apiJob 2>&1 | ForEach-Object { Write-Host "[api] $_" }
    if ($webJob) { Receive-Job $webJob 2>&1 | ForEach-Object { Write-Host "[web] $_" } }
    Start-Sleep 1
  }
} finally {
  $ErrorActionPreference = $prevPref
  Write-Host "`nStopping..."
  Stop-Job $apiJob -ErrorAction SilentlyContinue; Remove-Job $apiJob -Force -ErrorAction SilentlyContinue
  if ($webJob) { Stop-Job $webJob -ErrorAction SilentlyContinue; Remove-Job $webJob -Force -ErrorAction SilentlyContinue }
}

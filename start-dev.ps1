# ViStudio IDE - Windows Development Launcher (PowerShell)

Write-Host "=== ViStudio IDE ===" -ForegroundColor Cyan
Write-Host "Cleaning up..." -ForegroundColor Yellow

# Kill processes on port 5173
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object {
  Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

# Kill existing Node/Electron
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process electron -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

Write-Host "Starting Vite dev server..." -ForegroundColor Yellow
$viteJob = Start-Job -ScriptBlock {
  npx vite --host 127.0.0.1 --port 5173
}

Write-Host "Waiting for Vite to be ready..." -ForegroundColor Yellow
do {
  Start-Sleep -Seconds 2
  try {
    $req = [System.Net.WebRequest]::Create("http://localhost:5173")
    $req.GetResponse() | Out-Null
    $ready = $true
  } catch {
    $ready = $false
  }
} while (-not $ready)

Write-Host "Vite is ready. Starting Electron..." -ForegroundColor Green
$env:VITE_DEV_SERVER_URL = "http://localhost:5173"
npx electron .

Write-Host "Done." -ForegroundColor Cyan
pause

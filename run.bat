@echo off
REM ViStudio IDE - Windows Development Launcher

echo === ViStudio IDE ===
echo Cleaning up...

REM Kill anything on port 5173
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
  taskkill /f /pid %%a >nul 2>&1
)

REM Kill any existing Electron/vite processes
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im electron.exe >nul 2>&1

timeout /t 2 /nobreak >nul

echo Starting Vite dev server...
start "ViStudio-Vite" cmd /c "npx vite --host 127.0.0.1 --port 5173"

echo Waiting for Vite to be ready...
:waitloop
timeout /t 2 /nobreak >nul
curl -s http://localhost:5173 >nul 2>&1
if errorlevel 1 goto waitloop

echo Vite is ready. Starting Electron...
set VITE_DEV_SERVER_URL=http://localhost:5173
npx electron .

echo Done.
pause

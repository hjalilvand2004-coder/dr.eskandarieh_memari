@echo off
setlocal enableextensions
title Shiraz Smart Atlas v1.1.0 - Morphology and Energy

rem ============================================================
rem  Shiraz Smart Atlas | One-click portable launcher (Windows)
rem  Bundled Node.js runtime - no Python, no PyCharm, no install.
rem  Just double-click this file.
rem ============================================================

cd /d "%~dp0"
set "ROOT=%CD%"

if not defined PORT set "PORT=3000"
set "NODE_ENV=production"
set "HOSTNAME=127.0.0.1"
set "DATABASE_URL=file:%ROOT:\=/%/app/db/custom.db"

set "NODE_EXE=%ROOT%\runtime\windows-x64\node.exe"
if not exist "%NODE_EXE%" (
  echo [ERROR] runtime\windows-x64\node.exe not found. Re-extract the full ZIP.
  pause
  exit /b 1
)

echo ============================================================
echo   Shiraz Smart Atlas v1.1.0
echo   URL   : http://localhost:%PORT%
echo   Data  : app\db\custom.db  (SQLite)
echo.
echo   Keep this window OPEN while using the system.
echo   To stop: close this window or press Ctrl+C.
echo ============================================================
echo.
echo Starting server... your browser will open automatically.
echo.

rem Launch browser as soon as the server answers
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 60;$i++){try{Invoke-WebRequest -UseBasicParsing -Uri ('http://localhost:'+$env:PORT) -TimeoutSec 2 -ErrorAction Stop|Out-Null;break}catch{Start-Sleep -Milliseconds 700}};Start-Process ('http://localhost:'+$env:PORT)"

cd /d "%ROOT%\app"
"%NODE_EXE%" server.js

echo.
echo Server stopped.
pause

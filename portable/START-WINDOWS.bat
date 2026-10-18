@echo off
setlocal enableextensions
title Shiraz Smart Atlas v1.2.1 - Morphology and Energy

rem ============================================================
rem  Shiraz Smart Atlas | One-click portable launcher (Windows)
rem  v1.2.1 - resilient start:
rem    * Safe with folder paths containing spaces / Persian chars
rem    * Auto port fallback if 3000 is busy  (app writes port.txt)
rem    * Browser opens automatically at the correct port
rem    * No Python, no PyCharm, no install, no internet needed
rem ============================================================

cd /d "%~dp0"
set "ROOT=%CD%"
set "APPDIR=%ROOT%\app"

set "NODE_EXE=%ROOT%\runtime\windows-x64\node.exe"
if not exist "%NODE_EXE%" (
  echo [ERROR] runtime\windows-x64\node.exe not found.
  echo         Re-extract the FULL ZIP and keep the folder structure.
  pause
  exit /b 1
)
if not exist "%APPDIR%\server.cjs" (
  echo [ERROR] app\server.cjs not found.
  echo         Re-extract the FULL ZIP and keep the folder structure.
  pause
  exit /b 1
)
if not exist "%APPDIR%\db\custom.db" (
  echo [ERROR] app\db\custom.db not found.
  echo         Re-extract the FULL ZIP and keep the folder structure.
  pause
  exit /b 1
)

rem Clean stale port file from a previous run
del /f /q "%APPDIR%\port.txt" >nul 2>&1

echo ============================================================
echo   Shiraz Smart Atlas v1.2.1
echo   URL   : http://localhost:3000   auto-fallback if busy
echo   Data  : app\db\custom.db   SQLite - 100 percent local
echo.
echo   Keep this window OPEN while using the system.
echo   To stop: close this window or press Ctrl+C.
echo ============================================================
echo.
echo Starting server... your browser will open automatically.
echo.

rem Auto-open browser at the exact port written by the server
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "$f='%APPDIR%\port.txt';for($i=0;$i -lt 120;$i++){if(Test-Path -LiteralPath $f){break};Start-Sleep -Milliseconds 500};if(Test-Path -LiteralPath $f){$p=(Get-Content -LiteralPath $f -TotalCount 1 | Out-String).Trim();if($p -match '^\d+$'){Start-Process ('http://localhost:'+$p)}}"

cd /d "%APPDIR%"
"%NODE_EXE%" server.cjs

echo.
echo Server stopped.
pause

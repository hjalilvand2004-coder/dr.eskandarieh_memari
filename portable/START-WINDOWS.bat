@echo off
setlocal enableextensions
chcp 65001 >nul
title Shiraz Smart Atlas v1.2.3 - Morphology and Energy

rem ============================================================
rem  Shiraz Smart Atlas | One-click portable launcher (Windows)
rem  v1.2.3 - resilient start:
rem    * Safe with folder paths containing spaces / Persian chars
rem    * Auto port fallback if 3000 is busy  (app writes port.txt)
rem    * v1.2.3: stale instances of THIS app from earlier runs are
rem      closed automatically (old copies kept answering on port
rem      3000 with "Internal Server Error" after upgrading)
rem    * Browser opens automatically at the correct port
rem    * Pre-flight build integrity check (detects partial extraction)
rem    * Self-test after start (app\diagnostic-report.txt)
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

rem ---- v1.2.2: pre-flight integrity check of the build ----
rem Detects partial extraction, antivirus quarantine or skipped files
set "MISSING="
if not exist "%APPDIR%\.next\BUILD_ID" set "MISSING=%MISSING% .next\BUILD_ID"
if not exist "%APPDIR%\.next\required-server-files.json" set "MISSING=%MISSING% .next\required-server-files.json"
if not exist "%APPDIR%\.next\server\app\api\bootstrap\route.js" set "MISSING=%MISSING% .next\server\app\api\bootstrap\route.js"
if not exist "%APPDIR%\node_modules\.prisma\client\query_engine-windows.dll.node" set "MISSING=%MISSING% .prisma\client\query_engine-windows.dll.node"
if defined MISSING (
  echo [ERROR] Build files are incomplete. Missing:%MISSING%
  echo.
  echo   FA: فایل‌های بیلد ناقص استخراج شده‌اند.
  echo       ۱- بسته ZIP را دوباره در یک پوشهٔ جدید و خالی استخراج کنید
  echo       ۲- اگر پوشه داخل OneDrive است، اول «Always keep on this device» را بزنید
  echo       ۳- آنتی‌ویروس ممکن است فایل‌ها را قرنطینه کرده باشد؛ پوشه را مستثنا کنید
  echo   EN: The ZIP was not fully extracted. Extract again into a NEW empty
  echo       folder, keep it out of OneDrive, and allow it in your antivirus.
  echo.
  pause
  exit /b 1
)

rem Clean stale port file from a previous run
del /f /q "%APPDIR%\port.txt" >nul 2>&1

echo ============================================================
echo   Shiraz Smart Atlas v1.2.3
echo   URL   : shown below after start - browser opens automatically
echo   Data  : app\db\custom.db   SQLite - 100 percent local
echo.
echo   Keep this window OPEN while using the system.
echo   To stop: close this window or press Ctrl+C.
echo   Tip: keep this folder on a LOCAL path, not OneDrive.
echo ============================================================
echo.
echo Starting server... your browser will open automatically.
echo FA: پس از آماده‌شدن، نشانی صحیح در همین پنجره نمایش داده می‌شود
echo     و مرورگر خودکار باز می‌شود. اگر تب قدیمی localhost:3000 باز است،
echo     آن را ببندید و فقط از نشانی جدید استفاده کنید.
echo FA: نمونه‌های قدیمی همین سامانه که از اجرای قبل مانده‌اند،
echo     به‌طور خودکار بسته می‌شوند.
echo.

rem Auto-open browser at the exact port written by the server
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "$f='%APPDIR%\port.txt';for($i=0;$i -lt 120;$i++){if(Test-Path -LiteralPath $f){break};Start-Sleep -Milliseconds 500};if(Test-Path -LiteralPath $f){$p=(Get-Content -LiteralPath $f -TotalCount 1 | Out-String).Trim();if($p -match '^\d+$'){Start-Process ('http://localhost:'+$p)}}"

cd /d "%APPDIR%"
"%NODE_EXE%" server.cjs

echo.
echo Server stopped.
echo If you saw errors above, see: app\diagnostic-report.txt
pause

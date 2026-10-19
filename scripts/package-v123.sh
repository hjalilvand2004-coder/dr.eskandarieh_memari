#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Packaging v1.2.2 — Shiraz Smart Atlas Windows portable ZIP
# با گارد ضد-آلودگی: فایل .env هرگز نباید داخل بسته باشد
# ─────────────────────────────────────────────────────────────
set -euo pipefail

PROJ=/home/z/my-project
PORTABLE=$PROJ/portable
VER=1.2.3
DIST=$PROJ/dist
PKG=$DIST/Shiraz-Atlas-v$VER
ZIP=$DIST/Shiraz-Atlas-v$VER-Windows.zip

rm -rf "$PKG" "$ZIP"
mkdir -p "$PKG"

# ── ۱) app (بدون فایل‌های موقت و بدون .env) ──
mkdir -p "$PKG/app"
cp -r "$PORTABLE/app/.next"    "$PKG/app/.next"
cp -r "$PORTABLE/app/node_modules" "$PKG/app/node_modules"
cp -r "$PORTABLE/app/public"   "$PKG/app/public"
cp -r "$PORTABLE/app/db"       "$PKG/app/db"
cp    "$PORTABLE/app/server.js"    "$PKG/app/server.js"
cp    "$PORTABLE/app/server.cjs"   "$PKG/app/server.cjs"
cp    "$PORTABLE/app/package.json" "$PKG/app/package.json"

# ── ۲) ران‌تایم و لانچرها ──
cp -r "$PORTABLE/runtime" "$PKG/runtime"
cp "$PORTABLE/START-WINDOWS.bat" "$PKG/START-WINDOWS.bat"
cp "$PORTABLE/شروع-سامانه.bat"   "$PKG/شروع-سامانه.bat"
cp "$PORTABLE/START-MAC-LINUX.sh" "$PKG/START-MAC-LINUX.sh"
cp "$PORTABLE/VERSION.txt"        "$PKG/VERSION.txt"
cp "$PORTABLE/CHANGELOG.md"       "$PKG/CHANGELOG.md"
cp "$PORTABLE/README-فارسی.txt"   "$PKG/README-فارسی.txt"
cp "$PORTABLE/env.example"        "$PKG/env.example"

# ── ۳) گارد نهایی: هیچ .env / port.txt / report نباید داخل بسته باشد ──
LEAKS=$( (cd "$PKG" && find . -name ".env" -o -name "port.txt" -o -name "diagnostic-report.txt" -o -name "*.log" | grep -v node_modules) || true )
if [ -n "$LEAKS" ]; then
  echo "!!! PACKAGING ABORTED — leaked files found:"
  echo "$LEAKS"
  exit 1
fi

# ── ۴) گارد صحت: فایل‌های حیاتی ──
for f in app/.next/BUILD_ID app/.next/required-server-files.json \
         app/.next/server/app/api/bootstrap/route.js \
         app/.next/server/app/api/health/route.js \
         app/node_modules/.prisma/client/query_engine-windows.dll.node \
         app/node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node \
         runtime/windows-x64/node.exe app/server.cjs app/db/custom.db; do
  [ -f "$PKG/$f" ] || { echo "!!! MISSING critical file: $f"; exit 1; }
done

# ── ۵) ساخت ZIP ──
(cd "$DIST" && rm -f "Shiraz-Atlas-v$VER-Windows.zip" && zip -q -r -9 "Shiraz-Atlas-v$VER-Windows.zip" "Shiraz-Atlas-v$VER")

# ── ۶) گزارش ──
echo "=== PACKAGE OK ==="
du -sh "$ZIP"
echo "files in package: $(find "$PKG" -type f | wc -l)"
sha256sum "$ZIP" | tee "$DIST/Shiraz-Atlas-v$VER-Windows.zip.sha256"

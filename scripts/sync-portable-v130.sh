#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Sync v1.3.0 — standalone build → portable/app (whitelist copy)
# standalone شامل سورس کامل پروژه هم هست (Next trace)؛ بنابراین
# فقط اقلام لازم کپی می‌شوند — مثل روش بسته‌بندی v1.2.2.
# گاردها: بدون .env، بدون port.txt، فایل‌های حیاتی حاضر
# ─────────────────────────────────────────────────────────────
set -euo pipefail

PROJ=/home/z/my-project
APP=$PROJ/portable/app
STANDALONE=$PROJ/.next/standalone
MASTER_LAUNCHER=$PROJ/scripts/launcher-server.cjs
DB_BACKUP=$PROJ/scripts/portable-db-backup

[ -d "$STANDALONE" ] || { echo "!!! standalone build missing"; exit 1; }
[ -f "$MASTER_LAUNCHER" ] || { echo "!!! master launcher missing"; exit 1; }

# ── گارد ضد-آلودگی ──
if [ -f "$STANDALONE/.env" ]; then
  echo "!!! standalone contains .env — removing (pollution guard)"
  rm -f "$STANDALONE/.env"
fi

# ── پشتیبان دیتابیس پرتابل ──
mkdir -p "$DB_BACKUP"
if [ -f "$APP/db/custom.db" ]; then
  cp "$APP/db/custom.db" "$DB_BACKUP/custom.db"
  echo "[sync] portable db backed up"
fi

# ── بازسازی تمیز portable/app (whitelist) ──
rm -rf "$APP"
mkdir -p "$APP"
cp -r "$STANDALONE/.next"          "$APP/.next"
cp -r "$STANDALONE/node_modules"   "$APP/node_modules"
[ -d "$STANDALONE/public" ] && cp -r "$STANDALONE/public" "$APP/public"
cp    "$STANDALONE/server.js"      "$APP/server.js"
cp    "$STANDALONE/package.json"   "$APP/package.json"
cp    "$MASTER_LAUNCHER"           "$APP/server.cjs"
mkdir -p "$APP/db"
cp    "$DB_BACKUP/custom.db"       "$APP/db/custom.db"

# ── گارد صحت فایل‌های حیاتی ──
FAIL=0
for f in .next/BUILD_ID .next/required-server-files.json \
         .next/server/app/api/bootstrap/route.js \
         .next/server/app/api/health/route.js \
         .next/server/app/api/settings/route.js \
         node_modules/.prisma/client/query_engine-windows.dll.node \
         node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node \
         server.js package.json server.cjs db/custom.db; do
  [ -e "$APP/$f" ] || { echo "!!! MISSING after sync: $f"; FAIL=1; }
done
[ "$FAIL" = "0" ] || exit 1

# ── گارد نهایی: هیچ فایل ممنوعه ──
LEAKS=$( (cd "$APP" && find . -maxdepth 2 \( -name ".env" -o -name "port.txt" -o -name "diagnostic-report.txt" \) | head -5) || true )
if [ -n "$LEAKS" ]; then
  echo "!!! LEAKED FILES in portable/app:"; echo "$LEAKS"; exit 1
fi

echo "=== SYNC OK ==="
ls "$APP"

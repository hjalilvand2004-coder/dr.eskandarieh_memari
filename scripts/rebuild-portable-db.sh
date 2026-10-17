#!/usr/bin/env bash
# Build a pristine seeded database for the portable package
set -eu
cd /home/z/my-project
PKG=dist/Shiraz-Atlas-v1.0.0-Portable
DB="$PWD/$PKG/app/db/custom.db"

rm -f "$DB"

# 1. create schema with prisma CLI (dev environment)
export DATABASE_URL="file:$DB"
npx prisma db push --skip-generate --accept-data-loss >/dev/null 2>&1
echo "schema pushed: $(du -h "$DB" | cut -f1)"

# 2. boot packaged server and hit bootstrap to seed
ROOT="$PWD/$PKG" PORT=3460 NODE_ENV=production HOSTNAME=127.0.0.1 \
  DATABASE_URL="file:$DB" \
  "$PKG/runtime/linux-x64/node" "$PKG/app/server.js" > /tmp/smoke4.log 2>&1 &
SRV=$!
for i in $(seq 1 40); do
  curl -s -o /dev/null "http://127.0.0.1:3460/" && break
  sleep 1
done
curl -s -o /tmp/bootstrap3.json "http://127.0.0.1:3460/api/bootstrap"
curl -s -o /dev/null "http://127.0.0.1:3460/"
kill $SRV 2>/dev/null || true
sleep 1

# 3. verify content
node -e "
const d = JSON.parse(require('fs').readFileSync('/tmp/bootstrap3.json','utf8'));
if (!d.ok) { console.error('bootstrap NOT ok'); process.exit(1); }
console.log('project   :', d.data.project?.title?.slice(0,40));
console.log('questions :', d.data.questions.length);
console.log('datasets  :', d.data.datasets.length);
console.log('audit     :', d.data.audit.length);
"
echo "final db size: $(du -h "$DB" | cut -f1)"
echo "PRISTINE DB READY"

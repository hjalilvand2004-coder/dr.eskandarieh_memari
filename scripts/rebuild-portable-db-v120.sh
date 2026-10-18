#!/usr/bin/env bash
# بازسازی پایگاه داده پاک و seed اولیه برای بسته پرتابل v1.2.0
set -eu
cd /home/z/my-project
DB="$PWD/portable/app/db/custom.db"

rm -f "$DB"

# 1) ایجاد اسکیما با Prisma CLI
export DATABASE_URL="file:$DB"
npx prisma db push --skip-generate --accept-data-loss >/dev/null 2>&1
echo "schema pushed: $(du -h "$DB" | cut -f1)"

# 2) بوت سرور بسته و فراخوانی bootstrap برای seed تمیز
PORT=3461 NODE_ENV=production HOSTNAME=127.0.0.1 \
  DATABASE_URL="file:$DB" \
  node portable/app/server.js > /tmp/rebuild-db-v120.log 2>&1 &
SRV=$!
for i in $(seq 1 40); do
  curl -s -o /dev/null "http://127.0.0.1:3461/" && break
  sleep 1
done
curl -s -o /tmp/bootstrap-v120.json "http://127.0.0.1:3461/api/bootstrap"
curl -s -o /dev/null "http://127.0.0.1:3461/"
kill $SRV 2>/dev/null || true
sleep 1

# 3) راستی‌آزمایی محتوا — باید پاک باشد (بدون رکورد آزمایشی)
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:$DB' } } });
(async () => {
  const counts = {};
  for (const m of ['project','spatialEntity','morphologyIndicator','researchQuestion','dataset','mLModel','validationResult','experimentRun','auditEvent','systemSetting','chartSpecification']) {
    counts[m] = await p[m].count();
  }
  console.log(JSON.stringify(counts, null, 1));
  const ok = counts.project === 1 && counts.spatialEntity === 54 &&
             counts.researchQuestion === 4 && counts.dataset === 2 &&
             counts.mLModel === 0 && counts.validationResult === 0 &&
             counts.chartSpecification === 0 && counts.systemSetting === 0;
  console.log(ok ? 'PRISTINE-DB: OK' : 'PRISTINE-DB: FAILED');
  await p.\$disconnect();
  process.exit(ok ? 0 : 1);
})();
"

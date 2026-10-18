#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Build Shiraz-Atlas v1.1.0 portable package
# - production standalone build
# - runtime engines reused from v1.0.0 zip (no re-download)
# - pristine seeded DB
# - smoke test with bundled linux runtime
# ─────────────────────────────────────────────────────────────
set -eu
cd /home/z/my-project

OLD_ZIP=download/Shiraz-Atlas-v1.0.0-Portable.zip
NEW_PKG=dist/Shiraz-Atlas-v1.1.0-Portable

echo "── 1/7 stop dev server ──────────────────────"
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
sleep 2
pkill -9 -f "next-server" 2>/dev/null || true
sleep 1
ss -tlnp 2>/dev/null | grep -q :3000 && { echo "port 3000 still busy"; exit 1; } || echo "port free"

echo "── 2/7 production build ─────────────────────"
bun run build > /tmp/build-v110.log 2>&1 || { tail -30 /tmp/build-v110.log; exit 1; }
tail -6 /tmp/build-v110.log

echo "── 3/7 assemble package skeleton ────────────"
rm -rf "$NEW_PKG"
mkdir -p "$NEW_PKG/app/db" dist
# runtime + launchers + guides from v1.0.0 zip
unzip -q "$OLD_ZIP" \
  "Shiraz-Atlas-v1.0.0-Portable/runtime/*" \
  "Shiraz-Atlas-v1.0.0-Portable/START-WINDOWS.bat" \
  "Shiraz-Atlas-v1.0.0-Portable/شروع-سامانه.bat" \
  "Shiraz-Atlas-v1.0.0-Portable/START-MAC-LINUX.sh" \
  "Shiraz-Atlas-v1.0.0-Portable/README-فارسی.txt" \
  "Shiraz-Atlas-v1.0.0-Portable/env.example" \
  -d /tmp/v100-extract
cp -r /tmp/v100-extract/Shiraz-Atlas-v1.0.0-Portable/runtime "$NEW_PKG/runtime"
cp /tmp/v100-extract/Shiraz-Atlas-v1.0.0-Portable/START-WINDOWS.bat \
   /tmp/v100-extract/Shiraz-Atlas-v1.0.0-Portable/شروع-سامانه.bat \
   /tmp/v100-extract/Shiraz-Atlas-v1.0.0-Portable/START-MAC-LINUX.sh \
   /tmp/v100-extract/Shiraz-Atlas-v1.0.0-Portable/README-فارسی.txt \
   /tmp/v100-extract/Shiraz-Atlas-v1.0.0-Portable/env.example \
   "$NEW_PKG/"
chmod +x "$NEW_PKG/START-MAC-LINUX.sh"
du -sh "$NEW_PKG/runtime"

echo "── 4/7 copy standalone app ───────────────────"
cp -r .next/standalone/. "$NEW_PKG/app/"
ls "$NEW_PKG/app" | head -8
test -f "$NEW_PKG/app/server.js" || { echo "server.js missing"; exit 1; }
test -d "$NEW_PKG/app/.next/static" || { echo "static missing"; exit 1; }
test -d "$NEW_PKG/app/public" || { echo "public missing"; exit 1; }

echo "── 5/7 version files ─────────────────────────"
cat > "$NEW_PKG/VERSION.txt" <<'EOF'
شیراز | اطلس هوشمند ریخت‌شناسی و انرژی
نسخه: 1.1.0
تاریخ: 1404-07-26 (2025-10-18)
ساخت: 1.1.0+theme-system

تغییرات اصلی نسبت به 1.0.0:
- سیستم تم چندگانه: شیراز کلاسیک، فیروزه‌ای، آبی تیره، شیشه‌ای مدرن (گلس‌مورفیسم)، زعفرانی، زمردی
- هر تم در دو حالت روشن و تیره؛ تغییر در زمان اجرا بدون بارگذاری مجدد
- ادمین می‌تواند تم سراسری را ثبت کند (ذخیره در پایگاه + ثبت در ممیزی)؛ سایر کاربران پیش‌نمایش محلی می‌بینند
- هماهنگی خودکار نمودارها با رنگ‌بندی هر تم
- ارتقای کامل گرافیک: سایدبار مدرن، کارت‌های سایه‌دار، صفحه ورود شیشه‌ای، هاله‌های پس‌زمینه و انیمیشن‌های نرم
EOF
cat > "$NEW_PKG/CHANGELOG.md" <<'EOF'
# Changelog — شیراز | اطلس هوشمند ریخت‌شناسی و انرژی

## 1.1.0 — سیستم تم و ارتقای گرافیک
### افزوده شد
- «تم سامانه»: گالری انتخاب تم در نوار بالا برای همه کاربران
- شش تم رنگی: شیراز کلاسیک (پیش‌فرض)، فیروزه‌ای، آبی تیره، شیشه‌ای مدرن، زعفرانی، زمردی
- هر تم دو حالت روشن/تیره؛ انتقال نرم رنگ‌ها هنگام تعویض
- ذخیره تم سراسری توسط ادمین در جدول SystemSetting + ثبت AuditEvent (action: theme.set)
- پیش‌نمایش محلی تم برای پژوهشگر/مشاهده‌گر (بدون تغییر سراسری)
- هماهنگی خودکار پالت نمودارها با تم فعال (خواندن متغیرهای CSS)
- جدول SystemSetting در پایگاه داده
### ارتقای گرافیک
- بازطراحی صفحه ورود: پنل شیشه‌ای، هاله‌های رنگی، کارت‌های ویژگی، درخشش لوگو
- سایدبار مدرن با نشانگر فعال، چیپ آیکن و هاله تزئینی
- کارت‌ها با سایه چندلایه و واکنش نرم؛ کارت آماری با چیپ آیکن و عدد گرادیانی
- پس‌زمینه با هاله‌های نرم رنگ تم؛ انیمیشن ورود ماژول‌ها
### حفظ شد
- تمام قواعد صداقت علمی، برچسب داده نمایشی و پیام پیکربندی‌نشدن موتور شبیه‌سازی
- تمام مسیرهای API و سازگاری پایگاه داده قبلی

## 1.0.0 — انتشار اولیه پرتابل
- سامانه کامل ۱۱ ماژوله + بسته تک‌کلیکی ویندوز/مک/لینوکس
EOF
echo "version files written"

echo "── 6/7 pristine DB ───────────────────────────"
DB="$PWD/$NEW_PKG/app/db/custom.db"
rm -f "$DB"
export DATABASE_URL="file:$DB"
npx prisma db push --skip-generate --accept-data-loss > /dev/null 2>&1
echo "schema pushed: $(du -h "$DB" | cut -f1)"
ROOT="$PWD/$NEW_PKG" PORT=3461 NODE_ENV=production HOSTNAME=127.0.0.1 \
  DATABASE_URL="file:$DB" \
  "$NEW_PKG/runtime/linux-x64/node" "$NEW_PKG/app/server.js" > /tmp/seed-v110.log 2>&1 &
SRV=$!
for i in $(seq 1 40); do curl -s -o /dev/null "http://127.0.0.1:3461/" && break; sleep 1; done
curl -s -o /tmp/bootstrap-v110.json "http://127.0.0.1:3461/api/bootstrap"
curl -s -o /dev/null "http://127.0.0.1:3461/"
kill $SRV 2>/dev/null || true
sleep 1
node -e "
const d = JSON.parse(require('fs').readFileSync('/tmp/bootstrap-v110.json','utf8'));
if (!d.ok) { console.error('bootstrap NOT ok'); process.exit(1); }
console.log('project   :', d.data.project?.title?.slice(0,40));
console.log('questions :', d.data.questions.length, '| datasets:', d.data.datasets.length);
"
echo "final db size: $(du -h "$DB" | cut -f1)"

echo "── 7/7 smoke test (bundled runtime) ─────────"
PORT=3462
ROOT="$PWD/$NEW_PKG" PORT=$PORT NODE_ENV=production HOSTNAME=127.0.0.1 \
  DATABASE_URL="file:$DB" \
  "$NEW_PKG/runtime/linux-x64/node" "$NEW_PKG/app/server.js" > /tmp/smoke-v110.log 2>&1 &
SRV=$!
for i in $(seq 1 30); do curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break; sleep 1; done
R1=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT/")
R2=$(curl -s "http://127.0.0.1:$PORT/api/settings")
R3=$(curl -s "http://127.0.0.1:$PORT/api/atlas" | head -c 80)
R4=$(curl -s -X POST "http://127.0.0.1:$PORT/api/ml" -H "Content-Type: application/json" -d '{"op":"regression","target":"total","seed":42}' | head -c 120)
R5=$(curl -s -X POST "http://127.0.0.1:$PORT/api/settings" -H "Content-Type: application/json" -d '{"skin":"glass","role":"admin","actor":"smoke"}' | head -c 80)
R6=$(curl -s "http://127.0.0.1:$PORT/api/settings")
kill $SRV 2>/dev/null || true
echo "home          : $R1"
echo "settings GET  : $R2"
echo "atlas         : $R3"
echo "regression    : $R4"
echo "settings POST : $R5"
echo "settings reread: $R6"
echo "PORTABLE v1.1.0 READY"

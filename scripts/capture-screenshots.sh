#!/usr/bin/env bash
# Capture screenshots of all system modules in ONE session
set -u
cd /home/z/my-project
PKG=dist/Shiraz-Atlas-v1.0.0-Portable
OUT=/home/z/my-project/download/screenshots-v1.0.0
mkdir -p "$OUT"
PORT=3000

# ── 1. start server ──────────────────────────────────────────
setsid nohup env PORT=$PORT NODE_ENV=production HOSTNAME=127.0.0.1 \
  DATABASE_URL="file:$PWD/$PKG/app/db/custom.db" \
  "$PKG/runtime/linux-x64/node" "$PKG/app/server.js" > /tmp/shot-server.log 2>&1 < /dev/null &
SRV=$!
for i in $(seq 1 40); do
  curl -s -o /dev/null "http://127.0.0.1:${PORT}/" && break
  sleep 1
done
echo "[ok] server up"

# ── 2. browser: login page ───────────────────────────────────
agent-browser close >/dev/null 2>&1 || true
agent-browser set viewport 1600 900
agent-browser open "http://127.0.0.1:${PORT}/"
agent-browser wait --load networkidle
agent-browser wait 3000
agent-browser screenshot "$OUT/01-login.png"
echo "[ok] 01-login"

# ── 3. enter as researcher ───────────────────────────────────
agent-browser find text "ورود به محیط پژوهش" click || true
agent-browser wait --load networkidle
agent-browser wait 3500
agent-browser screenshot "$OUT/02-dashboard.png"
echo "[ok] 02-dashboard"

# helper: click sidebar module then shoot
shoot_module () { # $1=text $2=file $3=extra_wait_ms
  agent-browser find text "$1" click >/dev/null 2>&1 || agent-browser find first "button:has-text(\"$1\")" click >/dev/null 2>&1 || echo "[warn] nav miss: $1"
  agent-browser wait 2500
  agent-browser wait "${3:-2500}"
  agent-browser screenshot "$OUT/$2"
  echo "[ok] $2"
}

# ── 4. static modules ────────────────────────────────────────
shoot_module "میز پژوهش" "03-research.png"
shoot_module "پایگاه داده و کیفیت" "04-data.png"
shoot_module "اطلس مکانی و ریخت‌شناسی" "05-atlas.png" 3500
shoot_module "آزمایشگاه شبیه‌سازی" "06-simulation.png"

# ── 5. lab: run EDA + KMeans (real analyses) ─────────────────
shoot_module "آزمایشگاه علم داده" "07-lab-empty.png"
agent-browser find text "اجرای EDA" click >/dev/null 2>&1 || echo "[warn] EDA click"
agent-browser wait 4000
agent-browser screenshot "$OUT/07-lab-eda.png"
echo "[ok] 07-lab-eda"
agent-browser find text "اجرای خوشه‌بندی" click >/dev/null 2>&1 || echo "[warn] kmeans click"
agent-browser wait 4000
agent-browser screenshot "$OUT/08-lab-kmeans.png"
echo "[ok] 08-lab-kmeans"

# ── 6. validation, charts, scenarios ─────────────────────────
shoot_module "ارزیابی و اعتبارسنجی" "09-validation.png"
shoot_module "استودیو نمودار" "10-charts.png" 3000
shoot_module "سناریوسازی و تصمیم" "11-scenarios.png"

# ── 7. assistant: ask a real question ────────────────────────
shoot_module "دستیار پژوهشی" "12-assistant-empty.png"
REF=$(agent-browser snapshot -i --json 2>/dev/null | node -e "
let s='';process.stdin.on('data',c=>s+=c).on('end',()=>{
  try{const j=JSON.parse(s);const els=(j.elements||j.data||[]);
    const t=els.find(e=>(e.placeholder||'').includes('پرسش پژوهشی')||(e.description||'').includes('پرسش پژوهشی'));
    console.log(t?(t.ref||t.id||''):'');
  }catch(e){console.log('')}
})" 2>/dev/null)
if [ -n "$REF" ]; then
  agent-browser fill "@${REF}" "شاخص تراکم و اشتراک دیوار در بلوک حیاط‌مرکز چه می‌گویند؟"
else
  agent-browser eval "Array.from(document.querySelectorAll('textarea,input[type=text]')).find(i=>(i.placeholder||'').includes('پرسش'))?.focus()" >/dev/null 2>&1 || true
  agent-browser type "شاخص تراکم و اشتراک دیوار در بلوک حیاط‌مرکز چه می‌گویند؟" >/dev/null 2>&1 || true
fi
agent-browser find text "پرسش" click >/dev/null 2>&1 || true
agent-browser wait 5000
agent-browser screenshot "$OUT/12-assistant.png"
echo "[ok] 12-assistant"

# ── 8. about ─────────────────────────────────────────────────
shoot_module "درباره سامانه" "13-about.png"

agent-browser close >/dev/null 2>&1 || true
kill $SRV 2>/dev/null || true
echo "ALL DONE"
ls -la "$OUT"

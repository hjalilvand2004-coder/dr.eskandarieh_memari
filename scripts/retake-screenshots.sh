#!/usr/bin/env bash
# Retake the failed interactive screenshots with robust JS clicks
set -u
cd /home/z/my-project
PKG=dist/Shiraz-Atlas-v1.0.0-Portable
OUT=/home/z/my-project/download/screenshots-v1.0.0
PORT=3000

setsid nohup env PORT=$PORT NODE_ENV=production HOSTNAME=127.0.0.1 \
  DATABASE_URL="file:$PWD/$PKG/app/db/custom.db" \
  "$PKG/runtime/linux-x64/node" "$PKG/app/server.js" > /tmp/shot-server2.log 2>&1 < /dev/null &
SRV=$!
for i in $(seq 1 40); do
  curl -s -o /dev/null "http://127.0.0.1:${PORT}/" && break
  sleep 1
done
echo "[ok] server up"

agent-browser close >/dev/null 2>&1 || true
agent-browser set viewport 1600 900
agent-browser open "http://127.0.0.1:${PORT}/"
agent-browser wait --load networkidle
agent-browser wait 2500
agent-browser eval "Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('ورود به محیط پژوهش'))?.click()"
agent-browser wait 3500

# JS click helper: click first button whose text contains $1
jclick () {
  agent-browser eval "Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('$1'))?.click()"
}

# ── lab: EDA + KMeans ────────────────────────────────────────
jclick "آزمایشگاه علم داده"
agent-browser wait 2500
jclick "اجرای EDA"
agent-browser wait 4500
agent-browser screenshot "$OUT/07-lab-eda.png" && echo "[ok] 07-lab-eda"
jclick "اجرای خوشه‌بندی"
agent-browser wait 4500
agent-browser screenshot "$OUT/08-lab-kmeans.png" && echo "[ok] 08-lab-kmeans"

# ── validation: run real evaluation ──────────────────────────
jclick "ارزیابی و اعتبارسنجی"
agent-browser wait 2500
jclick "اجرای ارزیابی"
agent-browser wait 4500
agent-browser screenshot "$OUT/09-validation.png" && echo "[ok] 09-validation"

# ── assistant: real question ─────────────────────────────────
jclick "دستیار پژوهشی"
agent-browser wait 2500
agent-browser eval "
const t = Array.from(document.querySelectorAll('textarea, input[type=text], input[type=search]'))
  .find(i => (i.placeholder || '').includes('پرسش'));
if (t) {
  const proto = t.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(t, 'شاخص تراکم و اشتراک دیوار در بلوک حیاط‌مرکز چه می‌گویند؟');
  t.dispatchEvent(new Event('input', { bubbles: true }));
}
"
agent-browser wait 500
agent-browser eval "Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='پرسش')?.click()"
agent-browser wait 5000
agent-browser screenshot "$OUT/12-assistant.png" && echo "[ok] 12-assistant"

# ── atlas: select a building (selection ↔ chart sync) ────────
jclick "اطلس مکانی و ریخت‌شناسی"
agent-browser wait 3500
agent-browser eval "Array.from(document.querySelectorAll('button, [role=button], tr, .cursor-pointer')).find(e=>e.textContent.trim().startsWith('A-13'))?.click()"
agent-browser wait 2500
agent-browser screenshot "$OUT/05-atlas-selected.png" && echo "[ok] 05-atlas-selected"

agent-browser close >/dev/null 2>&1 || true
kill $SRV 2>/dev/null || true
echo "RETAKE DONE"
ls -la "$OUT" | grep -E "07|08|09|12|05-atlas"

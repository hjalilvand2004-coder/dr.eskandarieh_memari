#!/usr/bin/env bash
# Retake #2: KMeans (with tab), Regression tab, Assistant (ارسال button)
set -u
cd /home/z/my-project
PKG=dist/Shiraz-Atlas-v1.0.0-Portable
OUT=/home/z/my-project/download/screenshots-v1.0.0
PORT=3000

setsid nohup env PORT=$PORT NODE_ENV=production HOSTNAME=127.0.0.1 \
  DATABASE_URL="file:$PWD/$PKG/app/db/custom.db" \
  "$PKG/runtime/linux-x64/node" "$PKG/app/server.js" > /tmp/shot-server3.log 2>&1 < /dev/null &
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

jclick () { agent-browser eval "Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('$1'))?.click()"; }

# ── lab: KMeans tab → run; then regression tab → train ───────
jclick "آزمایشگاه علم داده"
agent-browser wait 2500
jclick "خوشه‌بندی تیپ‌ها"
agent-browser wait 1500
jclick "اجرای خوشه‌بندی"
agent-browser wait 4500
agent-browser screenshot "$OUT/08-lab-kmeans.png" && echo "[ok] 08-lab-kmeans"
jclick "رگرسیون و پیش‌بینی"
agent-browser wait 1500
jclick "آموزش مدل جدید"
agent-browser wait 5000
agent-browser screenshot "$OUT/08-lab-regression.png" && echo "[ok] 08-lab-regression"

# ── assistant: fill + ارسال ──────────────────────────────────
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
jclick "ارسال"
agent-browser wait 5000
agent-browser screenshot "$OUT/12-assistant.png" && echo "[ok] 12-assistant"

agent-browser close >/dev/null 2>&1 || true
kill $SRV 2>/dev/null || true
echo "RETAKE2 DONE"
ls -la "$OUT" | grep -E "08-lab|12-assist"

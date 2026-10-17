#!/usr/bin/env bash
# Retake #5: regression shot with correct train-button label
set -u
cd /home/z/my-project
PKG=dist/Shiraz-Atlas-v1.0.0-Portable
OUT=/home/z/my-project/download/screenshots-v1.0.0
PORT=3000

setsid nohup env PORT=$PORT NODE_ENV=production HOSTNAME=127.0.0.1 \
  DATABASE_URL="file:$PWD/$PKG/app/db/custom.db" \
  "$PKG/runtime/linux-x64/node" "$PKG/app/server.js" > /tmp/shot-server6.log 2>&1 < /dev/null &
SRV=$!
for i in $(seq 1 40); do
  curl -s -o /dev/null "http://127.0.0.1:${PORT}/" && break
  sleep 1
done

agent-browser close >/dev/null 2>&1 || true
agent-browser set viewport 1600 900
agent-browser open "http://127.0.0.1:${PORT}/"
agent-browser wait --load networkidle
agent-browser wait 2500
agent-browser eval "(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('ورود به محیط پژوهش')); if (b) { b.click(); return 'login'; } return 'already in'; })()"
agent-browser wait 3500

jclick () {
  agent-browser eval "(() => { const norm = s => (s||'').replace(/\u200c/g,''); const target = norm('$1'); const el = Array.from(document.querySelectorAll('button, [role=tab]')).find(e => norm(e.textContent).includes(target)); if (!el) return 'NOT FOUND'; ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(t => el.dispatchEvent(new MouseEvent(t, {bubbles:true, cancelable:true, view:window}))); return 'ok'; })()"
}

jclick "آزمایشگاه علم داده"
agent-browser wait 2500
jclick "رگرسیون و پیش‌بینی"
agent-browser wait 2000
echo "[train-btn] $(jclick "آموزش و ارزیابی")"
agent-browser wait 6000
agent-browser screenshot "$OUT/08-lab-regression.png" && echo "[ok] 08-lab-regression"

agent-browser close >/dev/null 2>&1 || true
kill $SRV 2>/dev/null || true
echo "RETAKE5 DONE"

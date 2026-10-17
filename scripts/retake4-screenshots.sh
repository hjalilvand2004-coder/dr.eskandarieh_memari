#!/usr/bin/env bash
# Retake #4: fixed input query + Radix event cascade
set -u
cd /home/z/my-project
PKG=dist/Shiraz-Atlas-v1.0.0-Portable
OUT=/home/z/my-project/download/screenshots-v1.0.0
PORT=3000

setsid nohup env PORT=$PORT NODE_ENV=production HOSTNAME=127.0.0.1 \
  DATABASE_URL="file:$PWD/$PKG/app/db/custom.db" \
  "$PKG/runtime/linux-x64/node" "$PKG/app/server.js" > /tmp/shot-server5.log 2>&1 < /dev/null &
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
agent-browser eval "(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('ورود به محیط پژوهش')); if (b) { b.click(); return 'logged-in now'; } return 'already in'; })()"
agent-browser wait 3500

# Radix-safe click: full pointer event cascade + ZWNJ-stripped match
jclick () {
  echo "[click $1] $(agent-browser eval "(() => { const norm = s => (s||'').replace(/\u200c/g,''); const target = norm('$1'); const els = Array.from(document.querySelectorAll('button, [role=tab]')); const el = els.find(e => norm(e.textContent).includes(target)); if (!el) return 'NOT FOUND'; ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(t => el.dispatchEvent(new MouseEvent(t, {bubbles:true, cancelable:true, view:window}))); return 'ok'; })()")"
}

# ── lab: KMeans tab → run ────────────────────────────────────
jclick "آزمایشگاه علم داده"
agent-browser wait 2500
jclick "خوشه‌بندی تیپ‌ها"
agent-browser wait 2000
jclick "اجرای خوشه‌بندی"
agent-browser wait 4500
agent-browser screenshot "$OUT/08-lab-kmeans.png" && echo "[ok] 08-lab-kmeans"

# ── lab: regression tab → train ──────────────────────────────
jclick "رگرسیون و پیش‌بینی"
agent-browser wait 2000
jclick "آموزش مدل جدید"
agent-browser wait 5500
agent-browser screenshot "$OUT/08-lab-regression.png" && echo "[ok] 08-lab-regression"

# ── assistant: fill (any input) + send ───────────────────────
jclick "دستیار پژوهشی"
agent-browser wait 2500
echo "[fill] $(agent-browser eval "(() => { const norm = s => (s||'').replace(/\u200c/g,''); const t = Array.from(document.querySelectorAll('input, textarea')).find(i => norm(i.placeholder).includes('پرسش')); if (!t) return 'NO INPUT'; const proto = t.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(t, 'شاخص تراکم و اشتراک دیوار در بلوک حیاط‌مرکز چه میگویند؟'); t.dispatchEvent(new Event('input', { bubbles: true })); return 'filled'; })()")"
agent-browser wait 800
echo "[send] $(agent-browser eval "(() => { const btn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent||'').trim() === 'ارسال'); if (!btn) return 'NO BTN'; ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(t => btn.dispatchEvent(new MouseEvent(t, {bubbles:true, cancelable:true, view:window}))); return 'sent, disabled=' + btn.disabled; })()")"
agent-browser wait 6000
agent-browser screenshot "$OUT/12-assistant.png" && echo "[ok] 12-assistant"

agent-browser close >/dev/null 2>&1 || true
kill $SRV 2>/dev/null || true
echo "RETAKE4 DONE"

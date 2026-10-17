#!/usr/bin/env bash
# Retake #3: ZWNJ-safe IIFE evals with visible status output
set -u
cd /home/z/my-project
PKG=dist/Shiraz-Atlas-v1.0.0-Portable
OUT=/home/z/my-project/download/screenshots-v1.0.0
PORT=3000

setsid nohup env PORT=$PORT NODE_ENV=production HOSTNAME=127.0.0.1 \
  DATABASE_URL="file:$PWD/$PKG/app/db/custom.db" \
  "$PKG/runtime/linux-x64/node" "$PKG/app/server.js" > /tmp/shot-server4.log 2>&1 < /dev/null &
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
echo "[login] $(agent-browser eval "Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('ورود به محیط پژوهش'))?.click() ?? 'no-btn'")"
agent-browser wait 3500

# click by ZWNJ-stripped text across buttons AND role=tab
jclick () {
  echo "[click $1] $(agent-browser eval "(() => { const norm = s => (s||'').replace(/\u200c/g,''); const target = norm('$1'); const els = Array.from(document.querySelectorAll('button, [role=tab]')); const el = els.find(e => norm(e.textContent).includes(target)); if (!el) return 'NOT FOUND'; el.click(); return 'ok: ' + norm(el.textContent).trim().slice(0,24); })()")"
}

# ── lab: KMeans ──────────────────────────────────────────────
jclick "آزمایشگاه علم داده"
agent-browser wait 2500
jclick "خوشه‌بندی تیپ‌ها"
agent-browser wait 1800
jclick "اجرای خوشه‌بندی"
agent-browser wait 4500
agent-browser screenshot "$OUT/08-lab-kmeans.png" && echo "[ok] 08-lab-kmeans"

# ── lab: regression ──────────────────────────────────────────
jclick "رگرسیون و پیش‌بینی"
agent-browser wait 1800
jclick "آموزش مدل جدید"
agent-browser wait 5500
agent-browser screenshot "$OUT/08-lab-regression.png" && echo "[ok] 08-lab-regression"

# ── assistant ────────────────────────────────────────────────
jclick "دستیار پژوهشی"
agent-browser wait 2500
echo "[inputs] $(agent-browser eval "(() => Array.from(document.querySelectorAll('textarea, input')).map(i => i.tagName + ':' + (i.placeholder || i.type)).join(' | ') || 'none')()")"
echo "[fill] $(agent-browser eval "(() => { const norm = s => (s||'').replace(/\u200c/g,''); const t = Array.from(document.querySelectorAll('textarea, input[type=text], input[type=search]')).find(i => norm(i.placeholder).includes('پرسش') || norm(i.placeholder).includes('بنویسید')); if (!t) return 'NO INPUT'; const proto = t.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(t, 'شاخص تراکم و اشتراک دیوار در بلوک حیاط‌مرکز چه میگویند؟'); t.dispatchEvent(new Event('input', { bubbles: true })); return 'filled: ' + t.value.slice(0, 20); })()")"
agent-browser wait 800
echo "[send] $(agent-browser eval "(() => { const btn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent||'').trim() === 'ارسال' || (b.textContent||'').includes('ارسال')); if (!btn) return 'NO BTN'; btn.click(); return 'sent, disabled=' + btn.disabled; })()")"
agent-browser wait 5500
agent-browser screenshot "$OUT/12-assistant.png" && echo "[ok] 12-assistant"

agent-browser close >/dev/null 2>&1 || true
kill $SRV 2>/dev/null || true
echo "RETAKE3 DONE"

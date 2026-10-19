#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Smoke test v1.3.0 — isolated portable run (simulates user's PC)
# 7 checks: root, bootstrap, settings, atlas, ml-ols, ml-kmeans, validation
# ─────────────────────────────────────────────────────────────
set -u
PORT=${PORT:-3600}
SRC=${SRC:-/home/z/my-project/portable/app}
ISO=/tmp/iso-smoke

pkill -f "server\.cjs" 2>/dev/null
sleep 1
rm -rf "$ISO"
mkdir -p "$ISO"
cp -r "$SRC" "$ISO/app"
cd "$ISO/app" || exit 1

PORT=$PORT nohup node server.cjs > "$ISO/run.log" 2>&1 &
SRV=$!

# wait for readiness (max 30s)
ready=0
for i in $(seq 1 60); do
  sleep 0.5
  if curl -s -m 2 "http://127.0.0.1:$PORT/api/health" 2>/dev/null | grep -q '"ok":true'; then
    ready=1; break
  fi
done

echo "ready=$ready"
B="http://127.0.0.1:$PORT"
pass=0; fail=0
chk() { # name, condition
  if [ "$2" = "1" ]; then echo "PASS  $1"; pass=$((pass+1)); else echo "FAIL  $1"; fail=$((fail+1)); fi
}

R1=$(curl -s -m 10 -o /dev/null -w "%{http_code}" "$B/")
chk "1. root page (200)" "$([ "$R1" = "200" ] && echo 1 || echo 0)"

R2=$(curl -s -m 30 "$B/api/bootstrap" | head -c 30)
chk "2. bootstrap ok:true" "$(echo "$R2" | grep -q '"ok":true' && echo 1 || echo 0)"

R3=$(curl -s -m 10 "$B/api/settings" | head -c 60)
chk "3. settings ok:true" "$(echo "$R3" | grep -q '"ok":true' && echo 1 || echo 0)"

R4=$(curl -s -m 15 "$B/api/atlas" | head -c 30)
chk "4. atlas ok:true" "$(echo "$R4" | grep -q '"ok":true' && echo 1 || echo 0)"

R5=$(curl -s -m 30 -X POST "$B/api/ml" -H "Content-Type: application/json" -d '{"op":"regression","target":"total","seed":42}')
chk "5. ml regression ok:true" "$(echo "$R5" | grep -q '"ok":true' && echo 1 || echo 0)"

R6=$(curl -s -m 30 -X POST "$B/api/ml" -H "Content-Type: application/json" -d '{"op":"kmeans","k":3,"seed":42}')
chk "6. ml kmeans ok:true" "$(echo "$R6" | grep -q '"ok":true' && echo 1 || echo 0)"

R7=$(curl -s -m 15 "$B/api/validation" | head -c 30)
chk "7. validation ok:true" "$(echo "$R7" | grep -q '"ok":true' && echo 1 || echo 0)"

R8=$(curl -s -m 10 "$B/api/health")
echo "health: $(echo "$R8" | head -c 160)"
chk "8. health version=1.3.0" "$(echo "$R8" | grep -q '"version":"1.3.0"' && echo 1 || echo 0)"

echo "────────────────────────────"
echo "PASS=$pass FAIL=$fail"
[ "$fail" = "0" ] || { echo "--- run.log tail ---"; tail -20 "$ISO/run.log"; }
kill $SRV 2>/dev/null
wait $SRV 2>/dev/null
exit "$fail"

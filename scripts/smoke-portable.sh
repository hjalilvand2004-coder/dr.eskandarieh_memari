#!/usr/bin/env bash
# Smoke test for the portable package — runs entirely in one shell session
set -u
PKG=/home/z/my-project/dist/Shiraz-Atlas-v1.0.0-Portable
PORT=3457

ROOT="$PKG" PORT=$PORT NODE_ENV=production HOSTNAME=127.0.0.1 \
  DATABASE_URL="file:${PKG}/app/db/custom.db" \
  "$PKG/runtime/linux-x64/node" "$PKG/app/server.js" > /tmp/portable-smoke.log 2>&1 &
SRV=$!

for i in $(seq 1 30); do
  curl -s -o /dev/null "http://127.0.0.1:${PORT}/" && break
  sleep 1
done

echo "=== 1. root page ==="
curl -s -o /dev/null -w "HTTP %{http_code}, %{size_download} bytes\n" "http://127.0.0.1:${PORT}/"

echo "=== 2. bootstrap (GET, seed/status) ==="
curl -s "http://127.0.0.1:${PORT}/api/bootstrap" | head -c 300; echo

echo "=== 3. atlas (geometry indicators) ==="
curl -s "http://127.0.0.1:${PORT}/api/atlas" | head -c 200; echo

echo "=== 4. ml regression (real OLS) ==="
curl -s -X POST "http://127.0.0.1:${PORT}/api/ml" \
  -H "Content-Type: application/json" \
  -d '{"op":"regression","target":"total","seed":42}' | head -c 400; echo

echo "=== 5. validation ==="
curl -s "http://127.0.0.1:${PORT}/api/validation" | head -c 200; echo

echo "=== 6. ml kmeans ==="
curl -s -X POST "http://127.0.0.1:${PORT}/api/ml" \
  -H "Content-Type: application/json" \
  -d '{"op":"kmeans","k":3,"seed":42}' | head -c 300; echo

kill $SRV 2>/dev/null
wait $SRV 2>/dev/null
echo "DONE"

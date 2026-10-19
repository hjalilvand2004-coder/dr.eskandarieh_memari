#!/usr/bin/env bash
# ============================================================
#  Shiraz Smart Atlas | One-click portable launcher (Mac/Linux)
#  v1.2.3 — resilient start:
#    * Safe with paths containing spaces / non-ASCII chars
#      (server.cjs builds a percent-encoded DATABASE_URL)
#    * Auto port fallback if 3000 is busy (app writes port.txt)
#    * Browser opens automatically at the correct port
#  This repo copy bundles ONLY the Windows runtime (node.exe).
#  On macOS/Linux it falls back to the system Node.js (v20+),
#  or you can download the full 3-platform ZIP from Releases:
#  https://github.com/hjalilvand2004-coder/dr.eskandarieh_memari/releases
# ============================================================
set -u
cd "$(dirname "$0")"
ROOT="$(pwd)"
APPDIR="$ROOT/app"

OS="$(uname -s)"; ARCH="$(uname -m)"
case "$OS" in
  Darwin) OS_ID="macos"; [ "$ARCH" = "arm64" ] && ARCH_ID="arm64" || ARCH_ID="x64" ;;
  Linux)  OS_ID="linux"; [ "$ARCH" = "x86_64" ] && ARCH_ID="x64" || ARCH_ID="$ARCH" ;;
  *) OS_ID="unknown"; ARCH_ID="x64" ;;
esac

NODE_EXE="$ROOT/runtime/${OS_ID}-${ARCH_ID}/node"
if [ ! -x "$NODE_EXE" ]; then
  if command -v node >/dev/null 2>&1; then
    echo "[i] Bundled runtime for ${OS_ID}-${ARCH_ID} is not in this repo copy."
    echo "    Falling back to system Node.js: $(node --version)"
    NODE_EXE="$(command -v node)"
  else
    echo "[ERROR] No Node.js found."
    echo "        Install Node.js 20+ OR download the full portable ZIP (includes runtimes for Windows/macOS/Linux) from:"
    echo "        https://github.com/hjalilvand2004-coder/dr.eskandarieh_memari/releases"
    exit 1
  fi
fi

if [ ! -f "$APPDIR/server.cjs" ] || [ ! -f "$APPDIR/db/custom.db" ]; then
  echo "[ERROR] app/server.cjs or app/db/custom.db missing — re-extract the FULL package."
  exit 1
fi

rm -f "$APPDIR/port.txt"

echo "============================================================"
echo "  Shiraz Smart Atlas v1.2.3"
echo "  URL   : shown below after start (browser opens automatically)"
echo "  v1.2.3: stale instances of this app from earlier runs are closed automatically"
echo "  Data  : app/db/custom.db  (SQLite, 100% local)"
echo ""
echo "  Keep this terminal OPEN while using the system."
echo "  To stop: press Ctrl+C."
echo "============================================================"

# Open the browser at the exact port reported by the server (port.txt)
(
  for i in $(seq 1 120); do
    [ -s "$APPDIR/port.txt" ] && break
    sleep 0.5
  done
  if [ -s "$APPDIR/port.txt" ]; then
    SRVPORT="$(head -n1 "$APPDIR/port.txt" | tr -dc '0-9')"
    for i in $(seq 1 40); do
      curl -s -o /dev/null "http://127.0.0.1:${SRVPORT}" && break
      sleep 0.7
    done
    ( open "http://localhost:${SRVPORT}" 2>/dev/null || xdg-open "http://localhost:${SRVPORT}" 2>/dev/null ) >/dev/null 2>&1
  fi
) &

cd "$APPDIR"
exec "$NODE_EXE" server.cjs

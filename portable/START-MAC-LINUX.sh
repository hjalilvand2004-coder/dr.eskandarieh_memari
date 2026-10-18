#!/usr/bin/env bash
# ============================================================
#  Shiraz Smart Atlas | One-click portable launcher (Mac/Linux)
#  This repo copy bundles ONLY the Windows runtime (node.exe).
#  On macOS/Linux it falls back to the system Node.js (v20+),
#  or you can download the full 3-platform ZIP from Releases:
#  https://github.com/hjalilvand2004-coder/dr.eskandarieh_memari/releases
# ============================================================
set -u
cd "$(dirname "$0")"
ROOT="$(pwd)"
PORT="${PORT:-3000}"
export NODE_ENV=production
export HOSTNAME=127.0.0.1
export DATABASE_URL="file:${ROOT}/app/db/custom.db"

OS="$(uname -s)"; ARCH="$(uname -m)"
case "$OS" in
  Darwin) OS_ID="macos"; [ "$ARCH" = "arm64" ] && ARCH_ID="arm64" || ARCH_ID="x64" ;;
  Linux)  OS_ID="linux"; [ "$ARCH" = "x86_64" ] && ARCH_ID="x64" || ARCH_ID="$ARCH" ;;
  *) OS_ID="unknown" ;;
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

echo "============================================================"
echo "  Shiraz Smart Atlas v1.1.0"
echo "  URL   : http://localhost:${PORT}"
echo "  Data  : app/db/custom.db  (SQLite)"
echo ""
echo "  Keep this terminal OPEN while using the system."
echo "  To stop: press Ctrl+C."
echo "============================================================"

( for i in $(seq 1 60); do
    curl -s -o /dev/null "http://127.0.0.1:${PORT}" && break
    sleep 0.7
  done
  ( open "http://localhost:${PORT}" 2>/dev/null || xdg-open "http://localhost:${PORT}" 2>/dev/null ) >/dev/null 2>&1
) &

cd "$ROOT/app"
exec "$NODE_EXE" server.js

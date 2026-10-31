#!/usr/bin/env bash
# Run from anywhere — serves opus-landing-demo (default port 8093)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

port_in_use() {
  lsof -iTCP:"$1" -sTCP:LISTEN -t >/dev/null 2>&1
}

PORT="${PORT:-8093}"
if port_in_use "$PORT"; then
  echo "Port ${PORT} is already in use."
  OLD_PID="$(lsof -iTCP:${PORT} -sTCP:LISTEN -t 2>/dev/null | head -1)"
  if [[ -n "$OLD_PID" ]]; then
    echo "  Likely an old preview (PID ${OLD_PID}). Stop it with: kill ${OLD_PID}"
    echo "  Or open the site now: http://127.0.0.1:${PORT}/"
  fi
  FOUND=""
  for try in $(seq "$((PORT + 1))" "$((PORT + 10))"); do
    if ! port_in_use "$try"; then
      FOUND="$try"
      break
    fi
  done
  if [[ -z "$FOUND" ]]; then
    echo "No free port found near ${PORT}. Set another: PORT=8095 ./preview.sh"
    exit 1
  fi
  echo "Starting on next free port: ${FOUND}"
  PORT="$FOUND"
fi

echo "OPUS landing preview"
echo "  Folder: $ROOT"
echo "  Open:   http://127.0.0.1:${PORT}/"
echo "  Stop:   Ctrl+C"
echo ""
exec python3 -m http.server "$PORT"

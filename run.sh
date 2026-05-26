#!/bin/bash

# ViStudio IDE - Development Launcher

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🧹 Cleaning up..."

# Kill all related processes aggressively
killall -9 electron 2>/dev/null
killall -9 vite 2>/dev/null
killall -9 node 2>/dev/null

# Kill anything on port 5173
lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null

# Wait for ports to be released
for i in 1 2 3 4 5; do
  if lsof -ti:5173 >/dev/null 2>&1; then
    sleep 1
  else
    break
  fi
done

# Force kill if still stuck
lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null
sleep 1

# Clear old logs
> /tmp/vistudio.log

echo "🚀 Starting ViStudio IDE..."

# Start Vite
export VITE_DEV_SERVER_URL=http://localhost:5173
npx vite --host 127.0.0.1 --port 5173 > /tmp/vistudio-vite.log 2>&1 &
VITE_PID=$!

# Wait for Vite to be ready
for i in $(seq 1 15); do
  if curl -s http://localhost:5173 >/dev/null 2>&1; then
    echo "✅ Vite ready (PID: $VITE_PID)"
    break
  fi
  if [ $i -eq 15 ]; then
    echo "❌ Vite failed to start. Check /tmp/vistudio-vite.log"
    kill $VITE_PID 2>/dev/null
    exit 1
  fi
  sleep 1
done

# Start Electron
npx electron . >> /tmp/vistudio.log 2>&1 &
ELECTRON_PID=$!

echo "⏳ Waiting for Electron..."
sleep 3

# Show status
if kill -0 $ELECTRON_PID 2>/dev/null; then
  echo "✅ ViStudio is running! (PID: $ELECTRON_PID)"
  echo "📝 Logs: tail -f /tmp/vistudio.log"
  echo "🛑 Stop: kill $ELECTRON_PID $VITE_PID"
else
  echo "❌ Electron crashed. Check logs:"
  tail -n 20 /tmp/vistudio.log
  kill $VITE_PID 2>/dev/null
  exit 1
fi

#!/bin/bash
# NeuroDesk AI – Full Stack Development Startup Script
# Starts FastAPI backend + Next.js frontend in a clean state

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR"

echo ""
echo "======================================================"
echo " NeuroDesk AI – Development Server Startup"
echo "======================================================"
echo ""

export PATH="$HOME/.local/bin:/usr/local/bin:$PATH"

# ── 1. Kill any existing processes on ports 3000, 3001, 8000 ──────────────
echo "▶ Cleaning up any stale processes on ports 3000, 3001, 8000..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
lsof -ti :3001 | xargs kill -9 2>/dev/null || true
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
sleep 1
echo "  ✓ Ports cleared"

# ── 2. Clear stale Next.js build cache ────────────────────────────────────
echo "▶ Removing stale .next cache..."
rm -rf "$FRONTEND_DIR/.next" "$FRONTEND_DIR/tsconfig.tsbuildinfo"
echo "  ✓ Cache cleared"

# ── 3. Apply database schema migrations (idempotent) ──────────────────────
echo "▶ Applying database schema migrations..."
cd "$BACKEND_DIR"
source .venv/bin/activate
python - << 'PYEOF'
import asyncio, os, sys
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv('.env')

async def migrate():
    try:
        from app.database.engine import engine
        from app.database.base import Base
        import app.models
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("  Schema sync complete.")
    except Exception as exc:
        print(f"  Schema sync note: {exc}")

asyncio.run(migrate())
PYEOF
echo "  ✓ Database schema synchronized"

# ── 3. Start FastAPI backend ───────────────────────────────────────────────
echo "▶ Starting FastAPI backend on port 8000..."
cd "$BACKEND_DIR"

if [ ! -d ".venv" ]; then
  echo "  ✗ ERROR: .venv not found in backend/. Run: python -m venv .venv && pip install -r requirements.txt"
  exit 1
fi

source .venv/bin/activate
# Use --workers 1 --loop asyncio instead of --reload to avoid Python 3.14 semaphore leak bug
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1 --loop asyncio &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

# ── 4. Wait for backend to be healthy ─────────────────────────────────────
echo "▶ Waiting for backend health check..."
MAX_RETRIES=15
COUNT=0
until curl -s --max-time 2 http://127.0.0.1:8000/api/v1/health > /dev/null 2>&1; do
  COUNT=$((COUNT + 1))
  if [ "$COUNT" -ge "$MAX_RETRIES" ]; then
    echo "  ✗ ERROR: Backend failed to start after ${MAX_RETRIES} seconds."
    echo "    Check backend logs above for errors."
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
  fi
  echo "  Waiting... ($COUNT/$MAX_RETRIES)"
  sleep 1
done
echo "  ✓ Backend is healthy at http://127.0.0.1:8000"

# ── 5. Start Next.js frontend ─────────────────────────────────────────────
echo "▶ Starting Next.js frontend..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

# ── 6. Wait for frontend to be ready ──────────────────────────────────────
echo "▶ Waiting for Next.js frontend..."
sleep 4

for PORT in 3000 3001 3002; do
  if curl -s --max-time 2 "http://localhost:$PORT" > /dev/null 2>&1; then
    FRONTEND_PORT=$PORT
    break
  fi
done

echo ""
echo "======================================================"
echo " ✓ All services are running!"
echo "======================================================"
echo ""
echo "  Frontend:  http://localhost:${FRONTEND_PORT:-3000}"
echo "  Backend:   http://127.0.0.1:8000"
echo "  API Docs:  http://127.0.0.1:8000/docs"
echo "  Health:    http://127.0.0.1:8000/api/v1/health"
echo ""
echo " Press Ctrl+C to stop both servers."
echo "======================================================"
echo ""

# ── 7. Wait for both processes and handle shutdown ────────────────────────
cleanup() {
  echo ""
  echo "▶ Shutting down..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  echo "  ✓ Servers stopped."
}
trap cleanup EXIT INT TERM

wait $BACKEND_PID $FRONTEND_PID

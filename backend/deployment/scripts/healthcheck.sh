#!/bin/bash
set -e

HOST="http://localhost:8000"

echo "Checking Liveness probe..."
LIVE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HOST/api/v1/health/live")

if [ "$LIVE_STATUS" -eq 200 ]; then
  echo "✅ Liveness probe passed (HTTP 200)"
else
  echo "❌ Liveness probe failed (HTTP $LIVE_STATUS)"
  exit 1
fi

echo "Checking Readiness probe..."
READY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HOST/api/v1/health/ready")

if [ "$READY_STATUS" -eq 200 ]; then
  echo "✅ Readiness probe passed (HTTP 200)"
else
  echo "⚠️ Readiness probe returned status (HTTP $READY_STATUS)"
fi

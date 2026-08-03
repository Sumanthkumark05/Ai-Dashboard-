#!/bin/bash
set -e

echo "🚀 Starting NeuroDesk AI Automated Deployment..."

# 1. Pull latest changes
git pull origin main

# 2. Build production Docker images
docker compose -f deployment/docker/docker-compose.yml build

# 3. Run database migrations inside container
docker compose -f deployment/docker/docker-compose.yml run --rm api alembic upgrade head

# 4. Start updated services in detached mode
docker compose -f deployment/docker/docker-compose.yml up -d

# 5. Verify system health
echo "🔍 Running Health Checks..."
sleep 5
bash deployment/scripts/healthcheck.sh

echo "✅ NeuroDesk AI Deployment Completed Successfully!"

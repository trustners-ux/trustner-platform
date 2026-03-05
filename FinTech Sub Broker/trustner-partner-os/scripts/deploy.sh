#!/bin/bash
# Trustner Partner OS - Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

ENV=${1:-staging}
echo "Deploying Trustner Partner OS to $ENV..."

# 1. Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker required"; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo "Docker Compose required"; exit 1; }

# 2. Check .env exists
if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo "IMPORTANT: Edit .env with your production values before proceeding!"
  exit 1
fi

# 3. Build images
docker compose build --no-cache

# 4. Start services
docker compose up -d

# 5. Wait for database
echo "Waiting for database..."
sleep 10

# 6. Run migrations
docker compose exec -T backend npx prisma migrate deploy

# 7. Seed data (staging only)
if [ "$ENV" = "staging" ]; then
  docker compose exec -T backend npx ts-node src/seed.ts
fi

# 8. Health check
echo "Running health check..."
sleep 5
curl -f http://localhost:5000/api/health || { echo "Backend health check failed"; exit 1; }
curl -f http://localhost/ || { echo "Frontend health check failed"; exit 1; }

echo "Deployment complete! Access at http://localhost"

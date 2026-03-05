#!/bin/bash
# Service health monitoring
echo "=== Trustner Partner OS Health Check ==="
echo "Time: $(date)"
echo ""

# Check containers
echo "--- Container Status ---"
docker compose ps

echo ""
echo "--- Backend Health ---"
curl -s http://localhost:5000/api/health | python3 -m json.tool 2>/dev/null || echo "Backend: DOWN"

echo ""
echo "--- Database ---"
docker compose exec -T postgres pg_isready -U trustner_admin -d trustner_partner_os 2>/dev/null && echo "Database: UP" || echo "Database: DOWN"

echo ""
echo "--- Redis ---"
docker compose exec -T redis redis-cli ping 2>/dev/null && echo "Redis: UP" || echo "Redis: DOWN"

echo ""
echo "--- Disk Usage ---"
df -h | grep -E '^/dev'

echo ""
echo "--- Memory Usage ---"
free -h

#!/bin/bash
# Daily database backup
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
docker compose exec -T postgres pg_dump -U trustner_admin trustner_partner_os | gzip > "$BACKUP_DIR/trustner_backup_$TIMESTAMP.sql.gz"
# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
echo "Backup complete: trustner_backup_$TIMESTAMP.sql.gz"

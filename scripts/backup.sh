#!/bin/bash
# ═══════════════════════════════════════════════════════
#  OncoAI — Database Backup Script
#  Run daily via cron: 0 2 * * * /path/to/backup.sh
# ═══════════════════════════════════════════════════════

BACKUP_DIR="/backups/oncoai"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="oncoai"
DB_USER="oncoai"
KEEP_DAYS=30

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting OncoAI backup..."

# Database backup
if command -v docker &> /dev/null; then
    # Docker deployment
    docker exec oncoai-db-1 pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/db_${TIMESTAMP}.sql.gz"
else
    # Direct PostgreSQL
    pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/db_${TIMESTAMP}.sql.gz"
fi

# Uploads backup
if [ -d "uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz" uploads/
fi

# Clean old backups
find "$BACKUP_DIR" -name "*.gz" -mtime +$KEEP_DAYS -delete

echo "[$(date)] Backup complete: $BACKUP_DIR/db_${TIMESTAMP}.sql.gz"
ls -lh "$BACKUP_DIR"/db_${TIMESTAMP}*

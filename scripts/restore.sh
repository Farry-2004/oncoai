#!/bin/bash
# ═══════════════════════════════════════════════════════
#  OncoAI — Database Restore Script
#  Usage: ./restore.sh /backups/oncoai/db_20260618.sql.gz
# ═══════════════════════════════════════════════════════

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Available backups:"
    ls -lht /backups/oncoai/db_*.sql.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="oncoai"
DB_USER="oncoai"

echo "⚠ This will REPLACE the current database with: $BACKUP_FILE"
read -p "Are you sure? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then echo "Cancelled."; exit 0; fi

echo "[$(date)] Restoring from $BACKUP_FILE..."

if command -v docker &> /dev/null; then
    gunzip -c "$BACKUP_FILE" | docker exec -i oncoai-db-1 psql -U "$DB_USER" "$DB_NAME"
else
    gunzip -c "$BACKUP_FILE" | psql -U "$DB_USER" "$DB_NAME"
fi

echo "[$(date)] Restore complete."

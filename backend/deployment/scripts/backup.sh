#!/bin/bash
set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating NeuroDesk AI Production Database Backup..."
docker exec neurodesk_postgres pg_dump -U neurodesk neurodesk_db | gzip > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

echo "💾 Backing up file storage uploads..."
tar -czf "$BACKUP_DIR/storage_backup_$TIMESTAMP.tar.gz" -C ./storage .

echo "✅ Backup Completed: $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

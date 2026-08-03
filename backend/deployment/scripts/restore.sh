#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <path_to_backup_sql.gz>"
  exit 1
fi

BACKUP_FILE=$1

echo "⚠️ Restoring Database from $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | docker exec -i neurodesk_postgres psql -U neurodesk -d neurodesk_db

echo "✅ Database Restore Completed Successfully!"

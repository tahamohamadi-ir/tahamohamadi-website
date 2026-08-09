#!/bin/bash
# restore.sh - Restores PostgreSQL database and media files from a backup archive

if [ -z "$1" ]; then
    echo "Error: Backup file not specified."
    echo "Usage: ./restore.sh <path-to-backup.tar.gz>"
    exit 1
fi

BACKUP_FILE="$1"
DB_CONTAINER="tahamohamadi-postgres"
DB_USER="postgres"
DB_NAME="tahamohamadi"
MEDIA_DIR="$(pwd)/backend/media"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: File $BACKUP_FILE does not exist!"
    exit 1
fi

echo "Warning: This will overwrite the current database and media files."
read -p "Are you sure you want to proceed? (y/N) " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Restore aborted."
    exit 0
fi

echo "Preparing restore environment..."
rm -rf "/tmp/tm_restore"
mkdir -p "/tmp/tm_restore"

echo "Extracting archive..."
tar -xzf "$BACKUP_FILE" -C "/tmp/tm_restore"

# 1. Restore Database
if [ -f "/tmp/tm_restore/db_backup.dump" ]; then
    echo "Restoring database..."
    # Drop and recreate DB (requires superuser access, alternative is to clean schema)
    # Using pg_restore with --clean --if-exists to replace existing objects
    docker cp "/tmp/tm_restore/db_backup.dump" $DB_CONTAINER:/tmp/db_backup.dump
    docker exec -t $DB_CONTAINER pg_restore -U $DB_USER -d $DB_NAME --clean --if-exists -1 /tmp/db_backup.dump
    docker exec -t $DB_CONTAINER rm /tmp/db_backup.dump
else
    echo "Warning: db_backup.dump not found in archive."
fi

# 2. Restore Media
if [ -d "/tmp/tm_restore/media" ]; then
    echo "Restoring media files..."
    rm -rf "$MEDIA_DIR"
    cp -r "/tmp/tm_restore/media" "$MEDIA_DIR"
else
    echo "Warning: Media folder not found in archive."
fi

# Cleanup
rm -rf "/tmp/tm_restore"

echo "Restore completed successfully!"

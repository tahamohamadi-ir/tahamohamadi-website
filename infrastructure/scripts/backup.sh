#!/bin/bash
# backup.sh - Creates a backup of PostgreSQL database and media files

# Set variables
BACKUP_DIR="$(pwd)/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_CONTAINER="tahamohamadi-postgres"  # Adjust based on your docker-compose service name
DB_USER="postgres"
DB_NAME="tahamohamadi"
MEDIA_DIR="$(pwd)/backend/media"
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.tar.gz"

mkdir -p "$BACKUP_DIR"
mkdir -p "/tmp/tm_backup"

echo "Starting backup process..."

# 1. Database Backup
echo "Dumping PostgreSQL database..."
docker exec -t $DB_CONTAINER pg_dump -U $DB_USER -d $DB_NAME -F c -f /tmp/db_backup.dump
docker cp $DB_CONTAINER:/tmp/db_backup.dump "/tmp/tm_backup/db_backup.dump"
docker exec -t $DB_CONTAINER rm /tmp/db_backup.dump

# 2. Media Backup
echo "Copying media files..."
if [ -d "$MEDIA_DIR" ]; then
    cp -r "$MEDIA_DIR" "/tmp/tm_backup/media"
else
    echo "Warning: Media directory not found, skipping media backup."
fi

# 3. Archive
echo "Creating archive..."
tar -czf "$BACKUP_FILE" -C "/tmp/tm_backup" .

# Cleanup
rm -rf "/tmp/tm_backup"

echo "Backup completed successfully!"
echo "Saved to: $BACKUP_FILE"

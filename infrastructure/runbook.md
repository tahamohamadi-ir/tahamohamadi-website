# Backup and Restore Runbook

This document describes the procedures to safely back up and restore the Taha Mohamadi Website environment (Database & Media Files).

## Overview
The application consists of:
1. **PostgreSQL Database**: Contains all textual content, users, and metadata.
2. **Media Files (`backend/media`)**: Contains user-uploaded images, videos, and documents.

Backups must capture both simultaneously to avoid broken media references.

## Performing a Backup

The backup script will dump the PostgreSQL database and archive the media folder into a single `.tar.gz` file.

1. Navigate to the root of the project:
   ```bash
   cd /path/to/tahamohamadi-website
   ```
2. Make the script executable (first time only):
   ```bash
   chmod +x infrastructure/scripts/backup.sh
   ```
3. Run the script:
   ```bash
   ./infrastructure/scripts/backup.sh
   ```
4. A new backup archive will be created in the `backups/` directory (e.g., `backups/backup_20260809_153000.tar.gz`).
5. **Important**: Store this backup file in a secure, off-site location (e.g., S3, Google Drive, or another server).

## Performing a Restore

> **Warning**: Restoring a backup will OVERWRITE the current database and media files. Ensure you have a recent backup of the *current* state before restoring an older one.

1. Ensure your Docker containers are running (specifically the `tahamohamadi-postgres` container).
2. Make the restore script executable (first time only):
   ```bash
   chmod +x infrastructure/scripts/restore.sh
   ```
3. Run the restore script, passing the path to the backup archive:
   ```bash
   ./infrastructure/scripts/restore.sh backups/backup_YYYYMMDD_HHMMSS.tar.gz
   ```
4. Type `y` to confirm when prompted.
5. The script will automatically clean the existing schema, restore the database dump, and replace the contents of `backend/media`.

## Incident Response (Disaster Recovery)

If the server completely fails:
1. Provision a new server and install Docker & Docker Compose.
2. Clone the repository and configure the `.env` files.
3. Start the containers using `docker-compose up -d`.
4. Wait for the Postgres database to initialize.
5. Download your latest backup archive to the server.
6. Run the restore script as described above.
7. Restart the backend container to ensure Django reconnects smoothly:
   ```bash
   docker-compose restart backend
   ```

#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# restore.sh — Restore PostgreSQL database and media files from a backup
#
# Restores from a backup archive created by backup.sh. Performs pg_restore
# for the database and extracts media files into the Django media volume.
#
# Usage:
#   ./scripts/restore.sh backups/backup_20250101_120000.tar.gz
#   ./scripts/restore.sh -f docker-compose.prod.yml backups/backup_20250101_120000.tar.gz
#   ./scripts/restore.sh --db-only backups/backup_20250101_120000.tar.gz
#   ./scripts/restore.sh --media-only backups/backup_20250101_120000.tar.gz
#
# Requirements: 14.5
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
RESTORE_DB=true
RESTORE_MEDIA=true
BACKUP_FILE=""

# ─── Parse Arguments ──────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case $1 in
    -f|--compose-file)
      COMPOSE_FILE="$2"
      shift 2
      ;;
    --db-only)
      RESTORE_MEDIA=false
      shift
      ;;
    --media-only)
      RESTORE_DB=false
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS] <backup_archive.tar.gz>"
      echo ""
      echo "Options:"
      echo "  -f, --compose-file FILE  Docker Compose file (default: docker-compose.prod.yml)"
      echo "  --db-only                Restore only the database"
      echo "  --media-only             Restore only media files"
      echo "  -h, --help               Show this help"
      echo ""
      echo "Examples:"
      echo "  $0 backups/backup_20250101_120000.tar.gz"
      echo "  $0 --db-only backups/backup_20250101_120000.tar.gz"
      exit 0
      ;;
    -*)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
    *)
      BACKUP_FILE="$1"
      shift
      ;;
  esac
done

# ─── Helpers ──────────────────────────────────────────────────────────────────

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
err() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2; }

# ─── Validate Input ──────────────────────────────────────────────────────────

if [ -z "$BACKUP_FILE" ]; then
  err "No backup file specified. Use -h for help."
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  err "Backup file not found: $BACKUP_FILE"
  exit 1
fi

if ! command -v docker &>/dev/null; then
  err "docker is not installed or not in PATH"
  exit 1
fi

cd "$PROJECT_DIR"

if [ ! -f "$COMPOSE_FILE" ]; then
  err "Compose file not found: $COMPOSE_FILE"
  exit 1
fi

# ─── Confirmation ─────────────────────────────────────────────────────────────

echo ""
echo "┌────────────────────────────────────────────────────────────────────┐"
echo "│  RESTORE WARNING                                                    │"
echo "├────────────────────────────────────────────────────────────────────┤"
echo "│  This will OVERWRITE existing data:                                 │"
if [ "$RESTORE_DB" = true ]; then
echo "│    • PostgreSQL database will be dropped and recreated              │"
fi
if [ "$RESTORE_MEDIA" = true ]; then
echo "│    • Media files will be replaced                                   │"
fi
echo "│                                                                     │"
echo "│  Backup: $(basename "$BACKUP_FILE")              │"
echo "└────────────────────────────────────────────────────────────────────┘"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  log "Restore cancelled."
  exit 0
fi

# ─── Extract Archive ─────────────────────────────────────────────────────────

log "Extracting backup archive..."

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

tar xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the extracted backup directory
EXTRACTED_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "backup_*" | head -1)

if [ -z "$EXTRACTED_DIR" ]; then
  err "Invalid backup archive: no backup directory found"
  exit 1
fi

# Display metadata if available
if [ -f "$EXTRACTED_DIR/metadata.json" ]; then
  log "Backup metadata:"
  cat "$EXTRACTED_DIR/metadata.json" | sed 's/^/  /'
  echo ""
fi

# ─── Load Environment Variables ───────────────────────────────────────────────

if [ -f .env ]; then
  export $(grep -E '^(POSTGRES_USER|POSTGRES_DB|POSTGRES_PASSWORD)=' .env | xargs)
fi

# ─── Restore Database ────────────────────────────────────────────────────────

if [ "$RESTORE_DB" = true ]; then
  if [ ! -f "$EXTRACTED_DIR/database.dump" ]; then
    err "Database dump not found in backup archive"
    exit 1
  fi

  log "Restoring PostgreSQL database..."

  # Drop existing connections and recreate database
  log "  Dropping existing database..."
  docker compose -f "$COMPOSE_FILE" exec -T postgres \
    psql -U "${POSTGRES_USER}" -d postgres -c "
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${POSTGRES_DB}'
        AND pid <> pg_backend_pid();
    " >/dev/null 2>&1 || true

  docker compose -f "$COMPOSE_FILE" exec -T postgres \
    dropdb -U "${POSTGRES_USER}" --if-exists "${POSTGRES_DB}"

  docker compose -f "$COMPOSE_FILE" exec -T postgres \
    createdb -U "${POSTGRES_USER}" "${POSTGRES_DB}"

  # Restore from dump
  log "  Restoring from dump..."
  docker compose -f "$COMPOSE_FILE" exec -T postgres \
    pg_restore -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
    --no-owner --no-acl --clean --if-exists \
    < "$EXTRACTED_DIR/database.dump"

  log "Database restore complete."
fi

# ─── Restore Media ───────────────────────────────────────────────────────────

if [ "$RESTORE_MEDIA" = true ]; then
  if [ ! -f "$EXTRACTED_DIR/media.tar.gz" ]; then
    log "No media archive in backup, skipping media restore."
  else
    log "Restoring media files..."

    # Clear existing media and extract backup
    docker compose -f "$COMPOSE_FILE" exec -T django \
      sh -c "rm -rf /app/media/* && rm -rf /app/media/.[!.]*" 2>/dev/null || true

    docker compose -f "$COMPOSE_FILE" exec -T django \
      tar xzf - -C /app < "$EXTRACTED_DIR/media.tar.gz"

    log "Media restore complete."
  fi
fi

# ─── Post-Restore Steps ──────────────────────────────────────────────────────

if [ "$RESTORE_DB" = true ]; then
  log "Running Django migrations to ensure schema is up to date..."
  docker compose -f "$COMPOSE_FILE" exec -T django \
    python manage.py migrate --no-input 2>/dev/null || true
fi

# ─── Summary ─────────────────────────────────────────────────────────────────

log "Restore complete!"
log "  Source: $(basename "$BACKUP_FILE")"
[ "$RESTORE_DB" = true ] && log "  Database: restored"
[ "$RESTORE_MEDIA" = true ] && log "  Media: restored"
log ""
log "Recommended post-restore actions:"
log "  1. Verify the application is working correctly"
log "  2. Check Django admin for data integrity"
log "  3. Restart services if needed: docker compose -f $COMPOSE_FILE restart"

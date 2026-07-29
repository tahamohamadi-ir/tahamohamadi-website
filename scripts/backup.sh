#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# backup.sh — Automated backup for PostgreSQL database and media files
#
# Creates timestamped backups using Docker Compose exec to access the running
# postgres container and django container (for media). Supports rotation to
# keep only the last N backups.
#
# Usage:
#   ./scripts/backup.sh                     # Uses defaults
#   ./scripts/backup.sh -d /path/to/backups # Custom backup directory
#   ./scripts/backup.sh -k 14              # Keep last 14 backups
#   ./scripts/backup.sh -f docker-compose.prod.yml  # Custom compose file
#
# Requirements: 14.5
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Defaults (overridable via flags or environment)
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
KEEP_LAST="${KEEP_LAST:-7}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_NAME="backup_${TIMESTAMP}"

# ─── Parse Arguments ──────────────────────────────────────────────────────────

while getopts "d:k:f:h" opt; do
  case $opt in
    d) BACKUP_DIR="$OPTARG" ;;
    k) KEEP_LAST="$OPTARG" ;;
    f) COMPOSE_FILE="$OPTARG" ;;
    h)
      echo "Usage: $0 [-d backup_dir] [-k keep_count] [-f compose_file]"
      echo ""
      echo "Options:"
      echo "  -d DIR   Backup directory (default: ./backups)"
      echo "  -k N     Number of backups to keep (default: 7)"
      echo "  -f FILE  Docker Compose file (default: docker-compose.prod.yml)"
      echo "  -h       Show this help"
      exit 0
      ;;
    *)
      echo "Invalid option. Use -h for help." >&2
      exit 1
      ;;
  esac
done

# ─── Helpers ──────────────────────────────────────────────────────────────────

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
err() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2; }

# ─── Pre-flight Checks ───────────────────────────────────────────────────────

if ! command -v docker &>/dev/null; then
  err "docker is not installed or not in PATH"
  exit 1
fi

cd "$PROJECT_DIR"

if [ ! -f "$COMPOSE_FILE" ]; then
  err "Compose file not found: $COMPOSE_FILE"
  exit 1
fi

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
mkdir -p "$BACKUP_PATH"

log "Starting backup: $BACKUP_NAME"
log "Compose file: $COMPOSE_FILE"
log "Backup directory: $BACKUP_PATH"

# ─── Database Backup (pg_dump) ────────────────────────────────────────────────

log "Dumping PostgreSQL database..."

docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --format=custom --compress=6 \
  > "$BACKUP_PATH/database.dump" 2>/dev/null

if [ ! -s "$BACKUP_PATH/database.dump" ]; then
  # Try reading env from .env file if env vars not set
  if [ -f .env ]; then
    source <(grep -E '^(POSTGRES_USER|POSTGRES_DB)=' .env)
    docker compose -f "$COMPOSE_FILE" exec -T postgres \
      pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
      --format=custom --compress=6 \
      > "$BACKUP_PATH/database.dump"
  fi
fi

if [ -s "$BACKUP_PATH/database.dump" ]; then
  DB_SIZE=$(du -h "$BACKUP_PATH/database.dump" | cut -f1)
  log "Database dump complete: $DB_SIZE"
else
  err "Database dump is empty or failed"
  rm -rf "$BACKUP_PATH"
  exit 1
fi

# ─── Media Backup (tar) ──────────────────────────────────────────────────────

log "Archiving media files..."

docker compose -f "$COMPOSE_FILE" exec -T django \
  tar czf - -C /app media \
  > "$BACKUP_PATH/media.tar.gz" 2>/dev/null

if [ -s "$BACKUP_PATH/media.tar.gz" ]; then
  MEDIA_SIZE=$(du -h "$BACKUP_PATH/media.tar.gz" | cut -f1)
  log "Media archive complete: $MEDIA_SIZE"
else
  # Media might be empty, which is acceptable
  log "Media archive is empty (no media files found)"
  rm -f "$BACKUP_PATH/media.tar.gz"
fi

# ─── Create Metadata ─────────────────────────────────────────────────────────

cat > "$BACKUP_PATH/metadata.json" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$(date -Iseconds)",
  "compose_file": "$COMPOSE_FILE",
  "database_file": "database.dump",
  "media_file": "media.tar.gz",
  "hostname": "$(hostname)"
}
EOF

# ─── Create Combined Archive ─────────────────────────────────────────────────

log "Creating combined archive..."
tar czf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "$BACKUP_PATH"

TOTAL_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)
log "Combined archive: ${BACKUP_NAME}.tar.gz ($TOTAL_SIZE)"

# ─── Rotation (keep last N backups) ──────────────────────────────────────────

log "Applying rotation policy: keep last $KEEP_LAST backups"

# List backup archives sorted by name (timestamp-based), delete oldest
BACKUP_COUNT=$(find "$BACKUP_DIR" -maxdepth 1 -name "backup_*.tar.gz" | wc -l)

if [ "$BACKUP_COUNT" -gt "$KEEP_LAST" ]; then
  DELETE_COUNT=$((BACKUP_COUNT - KEEP_LAST))
  find "$BACKUP_DIR" -maxdepth 1 -name "backup_*.tar.gz" | sort | head -n "$DELETE_COUNT" | while read -r old_backup; do
    log "Removing old backup: $(basename "$old_backup")"
    rm -f "$old_backup"
  done
fi

# ─── Summary ─────────────────────────────────────────────────────────────────

log "Backup complete!"
log "  Archive: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
log "  Size: $TOTAL_SIZE"
log "  Backups retained: $(find "$BACKUP_DIR" -maxdepth 1 -name "backup_*.tar.gz" | wc -l)/$KEEP_LAST"

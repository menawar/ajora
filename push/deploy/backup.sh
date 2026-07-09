#!/usr/bin/env bash
# Nightly SQLite backup for the push service (#66).
# Usage: ./push/deploy/backup.sh [dest-dir]
# Default dest: /opt/ajora/backups/push/
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="$ROOT/push/.env"
DEST="${1:-/opt/ajora/backups/push}"

# Source .env to find DB_PATH
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

DB="${DB_PATH:-$ROOT/push/push.db}"
[ -f "$DB" ] || { echo "backup: no database at $DB"; exit 1; }

mkdir -p "$DEST"
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP="$DEST/push-$TIMESTAMP.db"

sqlite3 "$DB" ".backup '$BACKUP'"
sqlite3 "$BACKUP" "PRAGMA integrity_check;" > /dev/null

echo "backup: $BACKUP ($(du -h "$BACKUP" | cut -f1))"

# Prune backups older than 30 days
find "$DEST" -name 'push-*.db' -mtime +30 -delete

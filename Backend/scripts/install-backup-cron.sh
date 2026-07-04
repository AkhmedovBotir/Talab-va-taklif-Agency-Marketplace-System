#!/usr/bin/env bash
# Linux server: har kuni 00:00 backup cron qo'shadi.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN="$ROOT/bin/backup-db"
CRON_LINE="0 0 * * * cd $ROOT && $BIN >> $ROOT/backups/backup.log 2>&1"

mkdir -p "$ROOT/backups"
cd "$ROOT"
go build -o "$BIN" ./cmd/backup-db

TMP="$(mktemp)"
crontab -l 2>/dev/null | grep -Fv "$BIN" >"$TMP" || true
echo "$CRON_LINE" >>"$TMP"
crontab "$TMP"
rm -f "$TMP"

echo "Cron o'rnatildi: har kuni 00:00"
echo "$CRON_LINE"

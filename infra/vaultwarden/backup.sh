#!/bin/sh
# Daily Vaultwarden backup: a consistent copy of the SQLite database (its
# .backup command, safe while running) plus the keys and attachments, as
# one archive in /data/vaultwarden/backups; the last 14 kept. Everything in
# it is end-to-end encrypted by the clients except the server's own keys.
set -eu
DIR=/data/vaultwarden
STAMP=$(date +%Y%m%d-%H%M)
TMP=$(mktemp -d)
docker run --rm -v "$DIR/data:/data:ro" -v "$TMP:/out" alpine:3.20 \
  sh -c "apk add -q --no-cache sqlite && sqlite3 /data/db.sqlite3 \".backup '/out/db.sqlite3'\""
cp -a "$DIR/data/rsa_key"* "$TMP/" 2>/dev/null || true
[ -d "$DIR/data/attachments" ] && cp -a "$DIR/data/attachments" "$TMP/"
[ -d "$DIR/data/sends" ] && cp -a "$DIR/data/sends" "$TMP/"
tar -czf "$DIR/backups/vaultwarden-$STAMP.tar.gz" -C "$TMP" .
chmod 600 "$DIR/backups/vaultwarden-$STAMP.tar.gz"
rm -rf "$TMP"
ls -1t "$DIR"/backups/vaultwarden-*.tar.gz | tail -n +15 | xargs -r rm -f

#!/usr/bin/env bash
#
# Releases Kretya Flow (the Mac app): builds the universal app, uploads it
# and points the in-place updater at it.
#
#   scripts/release-mac.sh                      # build + upload + publish
#   NOTES="Ada fitur baru" scripts/release-mac.sh
#   SKIP_BUILD=1 scripts/release-mac.sh         # upload what's already built
#   CHANNEL=test scripts/release-mac.sh         # only apps on that channel
#
# 1. Bump the version in desktop/src-tauri/tauri.conf.json and Cargo.toml
#    (they must match; the script stops otherwise).
# 2. Run this from anywhere in the repo. It:
#    - builds `npx tauri build --target universal-apple-darwin` in desktop/
#      with the updater signing key from ~/.tauri/kretya-flow.key (password
#      in ~/.tauri/kretya-flow.password, if any). Never commit those.
#    - finds the .dmg, Kretya Flow.app.tar.gz and its .sig in
#      desktop/src-tauri/target/universal-apple-darwin/release/bundle/
#    - uploads to storage, bucket app-releases (service key from .env.local):
#        kretya-flow/<version>/Kretya-Flow-<version>-universal.dmg
#        kretya-flow/<version>/Kretya-Flow-<version>-universal.app.tar.gz
#    - writes kretya-flow/latest.json LAST ({version, notes, pub_date,
#      signature, path}), which /api/desktop/update serves to the apps
#      (CHANNEL=x: kretya-flow/channels/x/latest.json instead).
# 3. Post the release notes in Aturan & Update (category "Update aplikasi",
#    the version in the title): the web download card and "Yang baru" link
#    there. Apps 0.2.0+ update themselves within 6 hours (or "Cek update" in
#    Setelan app); 0.1.0 installs once by hand from the .dmg card.
#
# See docs/releasing-mac-app.md.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TAURI_DIR="$ROOT/desktop/src-tauri"
BUNDLE="$TAURI_DIR/target/universal-apple-darwin/release/bundle"
KEY_FILE="$HOME/.tauri/kretya-flow.key"
PASSWORD_FILE="$HOME/.tauri/kretya-flow.password"
BUCKET="app-releases"

die() { echo "release-mac: $*" >&2; exit 1; }

VERSION="$(node -p "require('$TAURI_DIR/tauri.conf.json').version")"
CARGO_VERSION="$(sed -n 's/^version = "\(.*\)"/\1/p' "$TAURI_DIR/Cargo.toml" | head -1)"
[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "odd version in tauri.conf.json: $VERSION"
[[ "$VERSION" == "$CARGO_VERSION" ]] ||
  die "tauri.conf.json ($VERSION) and Cargo.toml ($CARGO_VERSION) don't match"

NOTES="${NOTES:-Kretya Flow $VERSION}"
CHANNEL="${CHANNEL:-}"
[[ -z "$CHANNEL" || "$CHANNEL" =~ ^[a-z0-9-]{1,32}$ ]] || die "CHANNEL: a-z, 0-9 and - only"

# Supabase URL + service key from .env.local (never printed).
env_value() {
  sed -n "s/^$1=//p" "$ROOT/.env.local" | tail -1 | sed -e 's/^["'\'']//' -e 's/["'\'']$//'
}
[[ -f "$ROOT/.env.local" ]] || die ".env.local not found"
SUPABASE_URL="$(env_value NEXT_PUBLIC_SUPABASE_URL)"
SERVICE_KEY="$(env_value SUPABASE_SERVICE_KEY)"
[[ -n "$SUPABASE_URL" && -n "$SERVICE_KEY" ]] ||
  die "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY missing in .env.local"

echo "Kretya Flow $VERSION${CHANNEL:+ (channel $CHANNEL)}"

# --- Build -----------------------------------------------------------------
if [[ -z "${SKIP_BUILD:-}" ]]; then
  [[ -f "$KEY_FILE" ]] || die "signing key not found: $KEY_FILE (npx tauri signer generate -w $KEY_FILE)"
  TAURI_SIGNING_PRIVATE_KEY="$(cat "$KEY_FILE")"
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""
  [[ -f "$PASSWORD_FILE" ]] && TAURI_SIGNING_PRIVATE_KEY_PASSWORD="$(cat "$PASSWORD_FILE")"
  export TAURI_SIGNING_PRIVATE_KEY TAURI_SIGNING_PRIVATE_KEY_PASSWORD
  echo "Building (universal)…"
  (cd "$ROOT/desktop" && npx tauri build --target universal-apple-darwin)
  unset TAURI_SIGNING_PRIVATE_KEY TAURI_SIGNING_PRIVATE_KEY_PASSWORD
fi

# --- Artifacts -------------------------------------------------------------
DMG="$(ls -t "$BUNDLE"/dmg/*_"$VERSION"_*.dmg 2>/dev/null | head -1 || true)"
TARBALL="$(ls -t "$BUNDLE"/macos/*.app.tar.gz 2>/dev/null | head -1 || true)"
SIG="$TARBALL.sig"
[[ -n "$DMG" && -f "$DMG" ]] || die "no .dmg for $VERSION in $BUNDLE/dmg"
[[ -n "$TARBALL" && -f "$TARBALL" ]] || die "no .app.tar.gz in $BUNDLE/macos (bundle.createUpdaterArtifacts?)"
[[ -s "$SIG" ]] || die "no signature next to $TARBALL (was the signing key set?)"
# The tarball has no version in its name: make sure it's this build's.
[[ "$TARBALL" -nt "$TAURI_DIR/tauri.conf.json" ]] ||
  die "$TARBALL is older than tauri.conf.json; build again"
INFO_VERSION="$(/usr/libexec/PlistBuddy -c 'Print CFBundleShortVersionString' \
  "$BUNDLE/macos/Kretya Flow.app/Contents/Info.plist" 2>/dev/null || true)"
[[ -z "$INFO_VERSION" || "$INFO_VERSION" == "$VERSION" ]] ||
  die "the built app is $INFO_VERSION, not $VERSION; build again"

FOLDER="kretya-flow/$VERSION"
DMG_PATH="$FOLDER/Kretya-Flow-$VERSION-universal.dmg"
TAR_PATH="$FOLDER/Kretya-Flow-$VERSION-universal.app.tar.gz"
if [[ -n "$CHANNEL" ]]; then
  MANIFEST_PATH="kretya-flow/channels/$CHANNEL/latest.json"
else
  MANIFEST_PATH="kretya-flow/latest.json"
fi

# --- Upload ----------------------------------------------------------------
# The key goes in a header file (not on the command line, where `ps` shows it).
auth_headers() {
  printf 'Authorization: Bearer %s\napikey: %s\n' "$SERVICE_KEY" "$SERVICE_KEY"
}

# The storage gateway cuts a request off after about 4 s (a 12 MB .dmg
# came back 504 about half the time; resumable TUS isn't supported by its
# S3 backend), so a 5xx is tried again, up to 10 times.
upload() { # <storage path> <local file> <content type>
  local code try
  for try in 1 2 3 4 5 6 7 8 9 10; do
    code="$(curl -sS -o /dev/null -w '%{http_code}' -X POST \
      "$SUPABASE_URL/storage/v1/object/$BUCKET/$1" \
      -H @<(auth_headers) \
      -H "x-upsert: true" \
      -H "cache-control: no-cache" \
      -H "Content-Type: $3" \
      --data-binary @"$2")"
    [[ "$code" == 200 ]] && { echo "  ✓ $BUCKET/$1"; return; }
    [[ "$code" == 5* ]] || break
    echo "  … $1: HTTP $code, again ($try)"
  done
  die "upload of $1 failed (HTTP $code)"
}

echo "Uploading…"
upload "$DMG_PATH" "$DMG" "application/x-apple-diskimage"
upload "$TAR_PATH" "$TARBALL" "application/gzip"

# Last: the apps start updating once this is there.
MANIFEST="$(mktemp -t kretya-flow-latest)"
trap 'rm -f "$MANIFEST"' EXIT
VERSION="$VERSION" NOTES="$NOTES" SIG_FILE="$SIG" TAR_PATH="$TAR_PATH" node -e '
  const fs = require("fs")
  process.stdout.write(JSON.stringify({
    version: process.env.VERSION,
    notes: process.env.NOTES,
    pub_date: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    signature: fs.readFileSync(process.env.SIG_FILE, "utf8").trim(),
    path: process.env.TAR_PATH,
  }, null, 2))
' > "$MANIFEST"
upload "$MANIFEST_PATH" "$MANIFEST" "application/json"

echo "Done: Kretya Flow $VERSION is out${CHANNEL:+ on channel $CHANNEL}."
echo "Next: post the release notes in Aturan & Update (\"Update aplikasi\", version in the title)."

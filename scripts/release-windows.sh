#!/usr/bin/env bash
#
# Releases Kretya Flow for Windows: builds the x64 installer (cross-compiled
# from this Mac), uploads it and points the Windows apps' updater at it.
#
#   scripts/release-windows.sh                    # build + upload + publish
#   NOTES="Ada fitur baru" scripts/release-windows.sh
#   SKIP_BUILD=1 scripts/release-windows.sh       # upload what's already built
#   CHANNEL=test scripts/release-windows.sh       # only apps on that channel
#
# Needs, once:  brew install llvm lld   (+ Docker/OrbStack for makensis)
#               cargo install --locked cargo-xwin
#               rustup target add x86_64-pc-windows-msvc
# (or build on Windows / the "Windows app" GitHub workflow and put the
# setup .exe + its .sig where BUNDLE below points, then SKIP_BUILD=1).
#
# Same version as the Mac app (tauri.conf.json + Cargo.toml). It:
#   - builds `tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc
#     --bundles nsis` in desktop/, signed for the updater with
#     ~/.tauri/kretya-flow.key (never commit it)
#   - uploads to storage, bucket app-releases (service key from .env.local):
#       kretya-flow/<version>/Kretya-Flow-<version>-x64-setup.exe
#   - writes kretya-flow/windows/latest.json LAST, which
#     /api/desktop/update?target=windows serves to the apps
#     (CHANNEL=x: kretya-flow/channels/x/windows/latest.json).
# The web's download card on Windows picks the .exe up from the bucket.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TAURI_DIR="$ROOT/desktop/src-tauri"
TARGET="x86_64-pc-windows-msvc"
BUNDLE="$TAURI_DIR/target/$TARGET/release/bundle/nsis"
KEY_FILE="$HOME/.tauri/kretya-flow.key"
PASSWORD_FILE="$HOME/.tauri/kretya-flow.password"
BUCKET="app-releases"

die() { echo "release-windows: $*" >&2; exit 1; }

VERSION="$(node -p "require('$TAURI_DIR/tauri.conf.json').version")"
CARGO_VERSION="$(sed -n 's/^version = "\(.*\)"/\1/p' "$TAURI_DIR/Cargo.toml" | head -1)"
[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "odd version in tauri.conf.json: $VERSION"
[[ "$VERSION" == "$CARGO_VERSION" ]] ||
  die "tauri.conf.json ($VERSION) and Cargo.toml ($CARGO_VERSION) don't match"

NOTES="${NOTES:-Kretya Flow $VERSION}"
CHANNEL="${CHANNEL:-}"
[[ -z "$CHANNEL" || "$CHANNEL" =~ ^[a-z0-9-]{1,32}$ ]] || die "CHANNEL: a-z, 0-9 and - only"

env_value() {
  sed -n "s/^$1=//p" "$ROOT/.env.local" | tail -1 | sed -e 's/^["'\'']//' -e 's/["'\'']$//'
}
[[ -f "$ROOT/.env.local" ]] || die ".env.local not found"
SUPABASE_URL="$(env_value NEXT_PUBLIC_SUPABASE_URL)"
SERVICE_KEY="$(env_value SUPABASE_SERVICE_KEY)"
[[ -n "$SUPABASE_URL" && -n "$SERVICE_KEY" ]] ||
  die "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY missing in .env.local"

echo "Kretya Flow $VERSION for Windows${CHANNEL:+ (channel $CHANNEL)}"

# --- Build -----------------------------------------------------------------
if [[ -z "${SKIP_BUILD:-}" ]]; then
  [[ -f "$KEY_FILE" ]] || die "signing key not found: $KEY_FILE"
  # Homebrew's makensis 3.13 crashes on this macOS (std::bad_alloc, even on
  # an empty script), so makensis runs in a Linux container (OrbStack /
  # Docker) instead, same paths mounted. MAKENSIS=local uses the system one.
  if [[ "${MAKENSIS:-docker}" == docker ]]; then
    docker info >/dev/null 2>&1 || die "Docker isn't running (orb start)"
    SHIM="$(mktemp -d -t makensis-shim)"
    cat > "$SHIM/makensis" <<'SHIM_EOF'
#!/usr/bin/env bash
exec docker run --rm -v "$HOME:$HOME" -w "$PWD" debian:trixie-slim sh -c \
  'apt-get update -qq >/dev/null && apt-get install -y -qq nsis >/dev/null 2>&1 && makensis "$@"' \
  makensis "$@"
SHIM_EOF
    chmod +x "$SHIM/makensis"
    export PATH="$SHIM:$PATH"
  fi
  command -v makensis >/dev/null || die "makensis missing (brew install nsis)"
  command -v cargo-xwin >/dev/null || die "cargo-xwin missing (cargo install --locked cargo-xwin)"
  TAURI_SIGNING_PRIVATE_KEY="$(cat "$KEY_FILE")"
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""
  [[ -f "$PASSWORD_FILE" ]] && TAURI_SIGNING_PRIVATE_KEY_PASSWORD="$(cat "$PASSWORD_FILE")"
  export TAURI_SIGNING_PRIVATE_KEY TAURI_SIGNING_PRIVATE_KEY_PASSWORD
  # Homebrew's LLVM (clang-cl, llvm-lib) and lld (lld-link) first.
  export PATH="/opt/homebrew/opt/llvm/bin:/opt/homebrew/opt/lld/bin:$PATH"
  echo "Building (Windows x64)…"
  (cd "$ROOT/desktop" &&
    npx tauri build --runner cargo-xwin --target "$TARGET" --bundles nsis)
  unset TAURI_SIGNING_PRIVATE_KEY TAURI_SIGNING_PRIVATE_KEY_PASSWORD
fi

# --- Artifacts -------------------------------------------------------------
EXE="$(ls -t "$BUNDLE"/*_"$VERSION"_x64-setup.exe 2>/dev/null | head -1 || true)"
[[ -n "$EXE" && -f "$EXE" ]] || die "no setup .exe for $VERSION in $BUNDLE"
SIG="$EXE.sig"
[[ -s "$SIG" ]] || die "no signature next to $EXE (was the signing key set?)"

FOLDER="kretya-flow/$VERSION"
EXE_PATH="$FOLDER/Kretya-Flow-$VERSION-x64-setup.exe"
if [[ -n "$CHANNEL" ]]; then
  MANIFEST_PATH="kretya-flow/channels/$CHANNEL/windows/latest.json"
else
  MANIFEST_PATH="kretya-flow/windows/latest.json"
fi

# --- Upload ----------------------------------------------------------------
upload() { # <storage path> <local file> <content type>
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' -X POST \
    "$SUPABASE_URL/storage/v1/object/$BUCKET/$1" \
    -H @<(printf 'Authorization: Bearer %s\napikey: %s\n' "$SERVICE_KEY" "$SERVICE_KEY") \
    -H "x-upsert: true" \
    -H "cache-control: no-cache" \
    -H "Content-Type: $3" \
    --data-binary @"$2")"
  [[ "$code" == 200 ]] || die "upload of $1 failed (HTTP $code)"
  echo "  ✓ $BUCKET/$1"
}

echo "Uploading…"
upload "$EXE_PATH" "$EXE" "application/vnd.microsoft.portable-executable"

MANIFEST="$(mktemp -t kretya-flow-windows-latest)"
trap 'rm -f "$MANIFEST"' EXIT
VERSION="$VERSION" NOTES="$NOTES" SIG_FILE="$SIG" EXE_PATH="$EXE_PATH" node -e '
  const fs = require("fs")
  process.stdout.write(JSON.stringify({
    version: process.env.VERSION,
    notes: process.env.NOTES,
    pub_date: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    signature: fs.readFileSync(process.env.SIG_FILE, "utf8").trim(),
    path: process.env.EXE_PATH,
  }, null, 2))
' > "$MANIFEST"
upload "$MANIFEST_PATH" "$MANIFEST" "application/json"

echo "Done: Kretya Flow $VERSION for Windows is out${CHANNEL:+ on channel $CHANNEL}."

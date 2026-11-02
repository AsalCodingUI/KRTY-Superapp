# Releasing Kretya Flow (Mac app)

Kretya Flow updates itself (tauri-plugin-updater) from 0.2.0 on. 0.1.0
installs 0.2.0 once by hand from the .dmg card.

## Release

1. Bump `version` in `desktop/src-tauri/tauri.conf.json` and
   `desktop/src-tauri/Cargo.toml` (same value).
2. `scripts/release-mac.sh` (optional `NOTES="…"`, `SKIP_BUILD=1`,
   `CHANNEL=test`). It builds the universal app with the updater key,
   uploads the .dmg and .app.tar.gz to `app-releases/kretya-flow/<version>/`,
   then writes `app-releases/kretya-flow/latest.json` last.
3. Post the release notes in Aturan & Update (category "Update aplikasi",
   version in the title).

Apps check at launch and every 6 hours, download in the background, then
show "Update siap" (sidebar card, Setelan app, one notification per
version); Restart installs it.

## Pieces

- Signing key: `~/.tauri/kretya-flow.key` (+ `.pub`, `kretya-flow.password`),
  outside the repo. Lose it and installed apps can't verify new updates:
  keep a backup. The public key is in `tauri.conf.json` → `plugins.updater`.
- Endpoint: `GET /api/desktop/update?target=darwin&arch=…&current=…`
  (`src/app/api/desktop/update/route.ts`): 204 when nothing newer, else
  `{ version, notes, pub_date, url, signature }` with a 15-minute signed
  link. `&channel=x` reads `kretya-flow/channels/x/latest.json`.
- App side: `desktop/src-tauri/src/updater.rs` (commands `update_status`,
  `update_check`, `update_install`, event `update-status`); web side:
  `src/shared/lib/desktop-app.ts`, `useAppUpdater` / `useMacUpdate` in
  `src/shared/hooks/useMacApp.ts`.
- The .dmg download (web card, first install, fallback when the updater
  fails) is unchanged: `kretya-flow/<version>/Kretya-Flow-<version>-universal.dmg`.

## Rolling back

Point `latest.json` at an older build only with a *higher* version number
(the updater never downgrades): rebuild the old code as a new version.

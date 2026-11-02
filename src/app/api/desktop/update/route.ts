import { createAdminClient } from "@/shared/api/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

/**
 * Kretya Flow's in-place updater (tauri-plugin-updater, see
 * desktop/src-tauri/tauri.conf.json → plugins.updater):
 *
 *   GET /api/desktop/update?target=darwin&arch=aarch64&current=0.2.0
 *     204                       no newer version (or no manifest yet)
 *     200 { version, notes, pub_date, url, signature }
 *
 * Reads the manifest scripts/release-mac.sh writes last,
 * app-releases/kretya-flow/latest.json ({ version, notes, pub_date,
 * signature, path }), with the service key, and answers with a 15-minute
 * signed link to that version's .app.tar.gz. No account needed (the app's
 * updater sends no cookies): it reveals only the version and that link.
 * `channel=<name>` reads kretya-flow/channels/<name>/latest.json instead
 * (testing a release before everyone gets it).
 */

export const dynamic = "force-dynamic"

const BUCKET = "app-releases"
const LINK_SECONDS = 15 * 60

type Manifest = {
  version: string
  notes?: string
  pub_date?: string
  signature: string
  /** The .app.tar.gz, inside the bucket. */
  path: string
}

const VERSION = /^\d+\.\d+\.\d+$/

/** "0.10.0" > "0.9.3", piece by piece (pre-release tags ignored). */
function isNewer(a: string, b: string) {
  const pa = a.split(/[.+-]/).slice(0, 3).map(Number)
  const pb = b.split(/[.+-]/).slice(0, 3).map(Number)
  for (let i = 0; i < 3; i++)
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0)
  return false
}

const none = () =>
  new NextResponse(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  })

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const target = params.get("target") ?? "darwin"
  const current = params.get("current") ?? "0.0.0"
  const channel = params.get("channel")
  // Only the Mac app (one universal build serves both arches).
  if (target !== "darwin") return none()
  if (channel && !/^[a-z0-9-]{1,32}$/.test(channel)) return none()

  const supabase = createAdminClient()
  const manifestPath = channel
    ? `kretya-flow/channels/${channel}/latest.json`
    : "kretya-flow/latest.json"
  const { data: file } = await supabase.storage
    .from(BUCKET)
    .download(manifestPath)
  if (!file) return none()

  let manifest: Manifest
  try {
    manifest = JSON.parse(await file.text()) as Manifest
  } catch {
    return none()
  }
  if (
    !manifest ||
    typeof manifest.version !== "string" ||
    !VERSION.test(manifest.version) ||
    typeof manifest.signature !== "string" ||
    typeof manifest.path !== "string" ||
    !manifest.path.startsWith("kretya-flow/")
  )
    return none()
  if (!isNewer(manifest.version, current)) return none()

  const { data: link, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(manifest.path, LINK_SECONDS)
  if (error || !link) return none()

  return NextResponse.json(
    {
      version: manifest.version,
      notes: manifest.notes ?? "",
      pub_date: manifest.pub_date ?? new Date().toISOString(),
      url: link.signedUrl,
      signature: manifest.signature,
    },
    { headers: { "Cache-Control": "no-store" } },
  )
}

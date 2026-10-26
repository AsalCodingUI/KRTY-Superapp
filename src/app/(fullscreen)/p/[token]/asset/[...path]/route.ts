import { createAdminClient } from "@/shared/api/supabase/admin"
import { isPortalSignedIn, portalByToken } from "@/shared/lib/portal"
import { proxyStorageObject } from "@/shared/lib/storage-proxy"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /p/<key>/asset/<path>: a picture or attachment a note embeds (its
 * `lampiran/` uploads in project-files), for a client signed in to that
 * project's portal; nothing else in the bucket.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; path: string[] }> },
) {
  const { token, path: parts } = await params
  const portal = await portalByToken(token)
  if (!portal || !(await isPortalSignedIn(portal))) {
    return new NextResponse(null, { status: 404 })
  }
  const path = parts.map(decodeURIComponent)
  // "<project-slug>--<project-id>/lampiran/…" of this project only.
  if (
    path.length < 3 ||
    !path[0].endsWith(`--${portal.project_id}`) ||
    path[1] !== "lampiran" ||
    path.some((part) => part === ".." || part === "")
  ) {
    return new NextResponse(null, { status: 404 })
  }
  const { data } = await createAdminClient()
    .storage.from("project-files")
    .createSignedUrl(path.join("/"), 60)
  if (!data) return new NextResponse(null, { status: 404 })
  return proxyStorageObject(request, data.signedUrl)
}

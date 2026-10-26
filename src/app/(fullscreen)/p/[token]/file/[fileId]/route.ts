import { createAdminClient } from "@/shared/api/supabase/admin"
import { isPortalSignedIn, portalByToken } from "@/shared/lib/portal"
import {
  clientSafeMarkdown,
  proxyStorageObject,
} from "@/shared/lib/storage-proxy"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /p/<token>/file/<id>: a library file for a signed-in client, never
 * one in an internal folder; streams it from storage (`?download=1`: saved under its name).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; fileId: string }> },
) {
  const { token, fileId } = await params
  const portal = await portalByToken(token)
  if (!portal || !(await isPortalSignedIn(portal))) {
    return new NextResponse(null, { status: 404 })
  }
  const admin = createAdminClient()
  const { data: file } = await admin
    .from("project_files")
    .select(
      "file_path, name, project_id, folder:project_folders ( is_internal )",
    )
    .eq("id", fileId)
    .maybeSingle()
  const row = file as unknown as {
    file_path: string
    name: string
    project_id: string
    folder: { is_internal: boolean } | null
  } | null
  if (!row || row.project_id !== portal.project_id || row.folder?.is_internal) {
    return new NextResponse(null, { status: 404 })
  }
  const download = request.nextUrl.searchParams.has("download")
  const { data } = await admin.storage
    .from("project-files")
    .createSignedUrl(row.file_path!, 60)
  if (!data) return new NextResponse(null, { status: 404 })
  // A note: its embedded pictures re-pointed at routes the client can open.
  if (/\.(md|markdown)$/i.test(row.name) && !download) {
    const text = await fetch(data.signedUrl, { cache: "no-store" }).then((r) =>
      r.ok ? r.text() : null,
    )
    if (text === null) return new NextResponse(null, { status: 404 })
    return new NextResponse(clientSafeMarkdown(text, `/p/${token}`), {
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "cache-control": "private, max-age=60",
      },
    })
  }
  // Streamed through the app: storage isn't reachable from the client site.
  return proxyStorageObject(request, data.signedUrl, {
    downloadName: download ? row.name : undefined,
  })
}

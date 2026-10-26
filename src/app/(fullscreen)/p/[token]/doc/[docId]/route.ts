import { createAdminClient } from "@/shared/api/supabase/admin"
import { isPortalSignedIn, portalByToken } from "@/shared/lib/portal"
import { CLIENT_DOC_STATUSES } from "@/shared/lib/portal-docs"
import { proxyStorageObject } from "@/shared/lib/storage-proxy"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /p/<token>/doc/<id>: a project document the client may see (not a
 * draft) for a signed-in client; streams it from storage (`?download=1`: saved under its name).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; docId: string }> },
) {
  const { token, docId } = await params
  const portal = await portalByToken(token)
  if (!portal || !(await isPortalSignedIn(portal))) {
    return new NextResponse(null, { status: 404 })
  }
  const admin = createAdminClient()
  const { data: doc } = await admin
    .from("project_documents")
    .select("file_path, file_name, title, project_id, status")
    .eq("id", docId)
    .maybeSingle()
  if (
    !doc?.file_path ||
    doc.project_id !== portal.project_id ||
    !CLIENT_DOC_STATUSES.includes(doc.status)
  ) {
    return new NextResponse(null, { status: 404 })
  }
  const download = request.nextUrl.searchParams.has("download")
  const { data } = await admin.storage
    .from("project-files")
    .createSignedUrl(doc.file_path!, 60)
  if (!data) return new NextResponse(null, { status: 404 })
  // Streamed through the app: storage isn't reachable from the client site.
  return proxyStorageObject(request, data.signedUrl, {
    downloadName: download ? (doc.file_name ?? doc.title) : undefined,
  })
}

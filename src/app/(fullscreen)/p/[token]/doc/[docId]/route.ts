import { createAdminClient } from "@/shared/api/supabase/admin"
import { isPortalSignedIn, portalByToken } from "@/shared/lib/portal"
import { CLIENT_DOC_STATUSES } from "@/shared/lib/portal-docs"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /p/<token>/doc/<id>: a project document the client may see (not a
 * draft) for a signed-in client; redirects to a signed link that works for half an hour
 * (`?download=1`: one that saves it under its name).
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
  const { data } = await admin.storage
    .from("project-files")
    .createSignedUrl(doc.file_path, 30 * 60, {
      download: request.nextUrl.searchParams.has("download")
        ? (doc.file_name ?? doc.title)
        : undefined,
    })
  if (!data) return new NextResponse(null, { status: 404 })
  return NextResponse.redirect(data.signedUrl, 302)
}

import { createAdminClient } from "@/shared/api/supabase/admin"
import { isPortalSignedIn, portalByToken } from "@/shared/lib/portal"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /p/<token>/file/<id>: a library file for a signed-in client, never
 * one in an internal folder; redirects to a signed link that works for half an hour (long enough to seek through a video)
 * (`?download=1`: one that saves it under its name).
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
  const { data } = await admin.storage
    .from("project-files")
    .createSignedUrl(row.file_path, 30 * 60, {
      download: request.nextUrl.searchParams.has("download")
        ? row.name
        : undefined,
    })
  if (!data) return new NextResponse(null, { status: 404 })
  return NextResponse.redirect(data.signedUrl, 302)
}

import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { BRIEF_BUCKET } from "@/shared/lib/briefs/server"
import { proxyStorageObject } from "@/shared/lib/storage-proxy"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/briefs/files/<id>: a client's upload for the team. Whether they
 * may see it is the brief_files RLS (PMs, stakeholders, the project's
 * team); the bytes come through the app (`?download=1`: saved by name).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { data: file } = await (await createClient())
    .from("brief_files")
    .select("file_path, name")
    .eq("id", id)
    .maybeSingle()
  if (!file) return new NextResponse(null, { status: 404 })
  const { data } = await createAdminClient()
    .storage.from(BRIEF_BUCKET)
    .createSignedUrl(file.file_path, 60)
  if (!data) return new NextResponse(null, { status: 404 })
  return proxyStorageObject(request, data.signedUrl, {
    downloadName: request.nextUrl.searchParams.has("download")
      ? file.name
      : undefined,
  })
}

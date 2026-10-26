import { createClient } from "@/shared/api/supabase/server"
import { NextRequest, NextResponse } from "next/server"

/** Private buckets whose files notes and task descriptions link to. */
const BUCKETS = new Set(["project-files"])

/**
 * GET /api/files/<bucket>/<path>: an internal file (a picture or attachment
 * in a project note or task description) for someone signed in. The
 * bucket's rules decide (project members and admins); the answer is a
 * redirect to a link that works for two minutes, so the address in the
 * note never opens anything on its own.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const [bucket, ...rest] = (await params).path
  const path = rest.map(decodeURIComponent).join("/")
  if (!bucket || !BUCKETS.has(bucket) || !path) {
    return new NextResponse(null, { status: 404 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse(null, { status: 401 })

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 120)
  if (error || !data) return new NextResponse(null, { status: 404 })

  const response = NextResponse.redirect(data.signedUrl, 302)
  response.headers.set("Cache-Control", "private, max-age=60")
  return response
}

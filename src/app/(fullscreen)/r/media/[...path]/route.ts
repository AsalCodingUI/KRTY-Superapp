import {
  PUBLIC_MEDIA_BUCKETS,
  proxyStorageObject,
} from "@/shared/lib/storage-proxy"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /r/media/<bucket>/<path>: a picture or attachment from a public
 * bucket (report images, doc files), streamed through the app so the
 * client site can show it (storage itself is private).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const [bucket, ...rest] = (await params).path
  if (!bucket || !PUBLIC_MEDIA_BUCKETS.includes(bucket) || !rest.length) {
    return new NextResponse(null, { status: 404 })
  }
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")
  const path = rest.map((part) => encodeURIComponent(decodeURIComponent(part)))
  return proxyStorageObject(
    request,
    `${base}/storage/v1/object/public/${bucket}/${path.join("/")}`,
    { cache: "public, max-age=86400" },
  )
}

import { NextResponse } from "next/server"

/**
 * Serves a storage object through the app instead of redirecting to it:
 * storage sits on the team's private network, and the client site is the
 * only public address. Passes Range through (videos seek, PDFs load in
 * parts) and streams the body.
 */
export async function proxyStorageObject(
  request: Request,
  signedUrl: string,
  options: { downloadName?: string; cache?: string } = {},
) {
  const range = request.headers.get("range")
  const upstream = await fetch(signedUrl, {
    headers: range ? { range } : undefined,
    cache: "no-store",
  })
  if (!upstream.ok && upstream.status !== 206) {
    return new NextResponse(null, {
      status: upstream.status === 416 ? 416 : 404,
    })
  }
  const headers = new Headers()
  // fetch() has already decompressed a gzip / br body, so its length no
  // longer matches; only pass the length on for bodies sent as they are.
  const encoded = Boolean(upstream.headers.get("content-encoding"))
  for (const name of [
    "content-type",
    ...(encoded ? [] : ["content-length"]),
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
  ]) {
    const value = upstream.headers.get(name)
    if (value) headers.set(name, value)
  }
  headers.set("cache-control", options.cache ?? "private, max-age=300")
  headers.set("x-content-type-options", "nosniff")
  // Served from our own origin now: an uploaded SVG or HTML file opened on
  // its own must not run scripts there.
  if (/svg|html|xml/i.test(headers.get("content-type") ?? "")) {
    headers.set(
      "content-security-policy",
      "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; sandbox",
    )
  }
  if (options.downloadName) {
    headers.set(
      "content-disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(options.downloadName)}`,
    )
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers })
}

/** Public buckets whose pictures and attachments reports and notes embed. */
export const PUBLIC_MEDIA_BUCKETS = ["report-images", "doc-files"]

/**
 * Markdown made readable on the client site: embedded storage links
 * (public report pictures and attachments, and a note's private
 * attachments) point at the app's own routes, since storage itself is
 * private. `portalBase` (`/p/<key>`) serves the private ones.
 */
export function clientSafeMarkdown(body: string, portalBase?: string) {
  const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(
    /\/$/,
    "",
  )
  let out = body
  if (supabase) {
    for (const bucket of PUBLIC_MEDIA_BUCKETS) {
      out = out
        .split(`${supabase}/storage/v1/object/public/${bucket}/`)
        .join(`/r/media/${bucket}/`)
    }
  }
  if (portalBase) {
    out = out.split("/api/files/project-files/").join(`${portalBase}/asset/`)
  }
  return out
}

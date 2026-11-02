import { NextResponse } from "next/server"
import { clientSafeMentions } from "./mentions"

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

/**
 * Public buckets the client site may show: pictures and attachments that
 * reports and notes embed, and the team's profile pictures.
 */
export const PUBLIC_MEDIA_BUCKETS = ["report-images", "doc-files", "avatars"]

/**
 * One public storage URL (e.g. a profile picture) made loadable on the
 * client site: /r/media/<bucket>/<path> instead of the private storage
 * host. Anything else (an outside URL, null) is returned as it is.
 */
export function clientSafeMediaUrl(url: string | null | undefined) {
  if (!url) return url ?? null
  const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(
    /\/$/,
    "",
  )
  if (!supabase) return url
  for (const bucket of PUBLIC_MEDIA_BUCKETS) {
    const prefix = `${supabase}/storage/v1/object/public/${bucket}/`
    if (url.startsWith(prefix))
      return `/r/media/${bucket}/${url.slice(prefix.length)}`
  }
  return url
}

/**
 * Markdown made readable on the client site: embedded storage links
 * (public report pictures and attachments, and a note's private
 * attachments) point at the app's own routes, since storage itself is
 * private. `portalBase` (`/p/<key>`) serves the private ones. @mentions
 * keep their label only (no ids, no internal links).
 */
export function clientSafeMarkdown(body: string, portalBase?: string) {
  const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(
    /\/$/,
    "",
  )
  let out = clientSafeMentions(body)
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

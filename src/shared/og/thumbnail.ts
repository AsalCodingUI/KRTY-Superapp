import { PUBLIC_MEDIA_BUCKETS } from "@/shared/lib/storage-proxy"

const MAX_BYTES = 1_500_000
const DRAWABLE = /^image\/(png|jpe?g)$/i

/**
 * A report picture as a data URI a share card can draw, fetched by the
 * server straight from storage (never through the VPN-only app host).
 * Only pictures from the report buckets; through storage's image resizer
 * (small, and WebP etc. come back as JPEG) with the original as a
 * fallback. Null when it can't be had quickly.
 */
export async function cardThumbnail(
  src: string | null,
  box: { width: number; height: number },
  /** Fetched at this share of the box (e.g. 0.5 for a cheaper copy). */
  scale = 1,
) {
  if (!src) return null
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")
  if (!base) return null
  // `/r/media/<bucket>/<path>` (already client-safe) or the storage URL.
  let object: string | null = null
  const media = /^\/r\/media\/(.+)$/.exec(src)
  if (media) object = media[1]
  else if (src.startsWith(`${base}/storage/v1/object/public/`)) {
    object = src.slice(`${base}/storage/v1/object/public/`.length)
  }
  if (!object) return null
  const [bucket, ...rest] = object.split("/")
  if (!PUBLIC_MEDIA_BUCKETS.includes(bucket) || !rest.length) return null
  const path = [bucket, ...rest].join("/")

  const resized = `${base}/storage/v1/render/image/public/${path}?width=${Math.round(box.width * scale)}&height=${Math.round(box.height * scale)}&resize=cover&quality=70`
  const original = `${base}/storage/v1/object/public/${path}`
  for (const url of [resized, original]) {
    const data = await fetchImage(url)
    if (data) return data
  }
  return null
}

async function fetchImage(url: string) {
  try {
    const res = await fetch(url, {
      headers: { accept: "image/jpeg,image/png" },
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    })
    const type = (res.headers.get("content-type") ?? "").split(";")[0]
    if (!res.ok || !DRAWABLE.test(type)) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    if (!buffer.length || buffer.length > MAX_BYTES) return null
    return `data:${type};base64,${buffer.toString("base64")}`
  } catch {
    return null
  }
}

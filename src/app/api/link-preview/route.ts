import { createClient } from "@/shared/api/supabase/server"
import { embedInfo } from "@/shared/lib/embeds"
import { lookup as dnsLookup, type LookupAddress } from "node:dns"
import http from "node:http"
import https from "node:https"
import { BlockList, isIP } from "node:net"
import { NextRequest, NextResponse } from "next/server"

/**
 * A link's title (and picture) for the cards in documents: GET
 * /api/link-preview?url=… → { title, image, siteName }. Any public site may
 * be asked, so the fetch is kept from reaching the team's own network: only
 * http(s), and every address the name resolves to (on each redirect, at
 * connect time, so a name can't switch to a private one in between) must be
 * public. Reads at most MAX_BYTES of the page, for TIMEOUT_MS.
 */

const TIMEOUT_MS = 5_000
const MAX_BYTES = 512 * 1024
const MAX_REDIRECTS = 4
const CACHE_MS = 60 * 60 * 1000
const CACHE_MISS_MS = 5 * 60 * 1000
const CACHE_MAX = 500

type Preview = {
  title: string | null
  image: string | null
  siteName: string | null
}

const cache = new Map<string, { at: number; preview: Preview }>()

const blocked = new BlockList()
for (const [net, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // carrier-grade NAT (and Tailscale)
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  blocked.addSubnet(net, prefix, "ipv4")
for (const [net, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
  ["64:ff9b::", 96],
  ["2001:db8::", 32],
] as const)
  blocked.addSubnet(net, prefix, "ipv6")

function isPublicAddress(address: string) {
  const family = isIP(address)
  if (family === 4) return !blocked.check(address, "ipv4")
  if (family === 6) {
    // An IPv4 address written as IPv6 (::ffff:10.0.0.1) is checked as IPv4.
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address)?.[1]
    if (mapped) return !blocked.check(mapped, "ipv4")
    return !blocked.check(address, "ipv6")
  }
  return false
}

/** dns.lookup that refuses names pointing anywhere private. */
const safeLookup: typeof dnsLookup = ((
  hostname: string,
  options: unknown,
  callback: (
    err: NodeJS.ErrnoException | null,
    address: string | LookupAddress[],
    family?: number,
  ) => void,
) => {
  const opts = (typeof options === "object" && options) || {}
  dnsLookup(hostname, { ...opts, all: true }, (err, addresses) => {
    if (err) return callback(err, "")
    const list = addresses as LookupAddress[]
    if (list.length === 0 || !list.every((a) => isPublicAddress(a.address))) {
      const e: NodeJS.ErrnoException = new Error("Blocked address")
      e.code = "EBLOCKED"
      return callback(e, "")
    }
    if ((opts as { all?: boolean }).all) return callback(null, list)
    callback(null, list[0].address, list[0].family)
  })
}) as typeof dnsLookup

type Page = { url: URL; html: string }

function get(
  url: URL,
  signal: AbortSignal,
  redirects = 0,
): Promise<Page | null> {
  return new Promise((resolve) => {
    if (url.protocol !== "http:" && url.protocol !== "https:")
      return resolve(null)
    // A literal IP skips the lookup, so check it here.
    const host = url.hostname.replace(/^\[|\]$/g, "")
    if (isIP(host) && !isPublicAddress(host)) return resolve(null)
    if (signal.aborted) return resolve(null)
    const client = url.protocol === "https:" ? https : http
    const req = client.get(
      url,
      {
        lookup: safeLookup,
        timeout: TIMEOUT_MS,
        signal,
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; KretyaLinkPreview/1.0; +https://kretyastudio.com)",
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
          "accept-language": "id,en;q=0.8",
          "accept-encoding": "identity",
        },
      },
      (res) => {
        const status = res.statusCode ?? 0
        const location = res.headers.location
        if (status >= 300 && status < 400 && location) {
          res.resume()
          if (redirects >= MAX_REDIRECTS) return resolve(null)
          let next: URL
          try {
            next = new URL(location, url)
          } catch {
            return resolve(null)
          }
          return resolve(get(next, signal, redirects + 1))
        }
        const type = String(res.headers["content-type"] ?? "")
        if (status >= 400 || !/html|xml|json/i.test(type)) {
          res.resume()
          return resolve(null)
        }
        const charset = /charset=([\w-]+)/i.exec(type)?.[1] ?? "utf-8"
        const chunks: Buffer[] = []
        let size = 0
        const done = () => {
          let decoder: TextDecoder
          try {
            decoder = new TextDecoder(charset)
          } catch {
            decoder = new TextDecoder("utf-8")
          }
          resolve({ url, html: decoder.decode(Buffer.concat(chunks)) })
        }
        res.on("data", (chunk: Buffer) => {
          chunks.push(chunk)
          size += chunk.length
          // The head is all we read; stop at its end or at the cap.
          if (size >= MAX_BYTES || /<\/head>/i.test(chunk.toString("latin1"))) {
            res.destroy()
            done()
          }
        })
        res.on("end", done)
        res.on("error", () => resolve(null))
      },
    )
    req.on("timeout", () => req.destroy())
    req.on("error", () => resolve(null))
  })
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
}

function decodeEntities(s: string) {
  return s.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code =
        e[1] === "x" || e[1] === "X"
          ? parseInt(e.slice(2), 16)
          : parseInt(e.slice(1), 10)
      return Number.isFinite(code) && code > 0 && code < 0x110000
        ? String.fromCodePoint(code)
        : m
    }
    return ENTITIES[e.toLowerCase()] ?? m
  })
}

function meta(html: string, key: string) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = /\b(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]
    if (name?.toLowerCase() !== key) continue
    const content = /\bcontent\s*=\s*"([^"]*)"|\bcontent\s*=\s*'([^']*)'/i.exec(
      tag,
    )
    const value = content?.[1] ?? content?.[2]
    if (value?.trim()) return decodeEntities(value.trim())
  }
  return null
}

/** Sign-in walls and app shells say nothing about the link. */
const USELESS_TITLE =
  /^(figma|google drive|google docs|google sheets|google slides|youtube|loom|vimeo|sign[ -]?in.*|log[ -]?in.*|masuk.*|.*\bsign[ -]in\b.*|just a moment\.*)$/i

function parse({ url, html }: Page): Preview {
  const head = html.slice(0, MAX_BYTES)
  const rawTitle =
    meta(head, "og:title") ??
    meta(head, "twitter:title") ??
    (() => {
      const t = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1]
      return t ? decodeEntities(t.replace(/\s+/g, " ").trim()) : null
    })()
  // "Homepage – Figma", "Report - Google Docs": the site is shown anyway.
  let title =
    rawTitle
      ?.replace(
        /\s+[–—-]\s+(Figma|Google (Docs|Sheets|Slides|Drive|Forms)|YouTube|Loom|Vimeo)$/i,
        "",
      )
      .slice(0, 200) ?? null
  if (title && USELESS_TITLE.test(title)) title = null
  let image = meta(head, "og:image") ?? meta(head, "twitter:image")
  try {
    image = image ? new URL(image, url).toString() : null
    if (image && !image.startsWith("https://")) image = null
  } catch {
    image = null
  }
  return { title, image, siteName: meta(head, "og:site_name") }
}

/**
 * Video and design services answer a small oEmbed request with the title
 * (their pages put it far down a very large head).
 */
function oembedUrl(url: string) {
  const q = encodeURIComponent(url)
  switch (embedInfo(url).provider) {
    case "youtube":
      return `https://www.youtube.com/oembed?format=json&url=${q}`
    case "vimeo":
      return `https://vimeo.com/api/oembed.json?url=${q}`
    case "loom":
      return `https://www.loom.com/v1/oembed?url=${q}`
    case "figma":
      return `https://www.figma.com/api/oembed?url=${q}`
    default:
      return null
  }
}

async function lookUp(url: URL, signal: AbortSignal): Promise<Preview> {
  const oembed = oembedUrl(url.toString())
  if (oembed) {
    const page = await get(new URL(oembed), signal)
    try {
      const data = page
        ? (JSON.parse(page.html) as Record<string, unknown>)
        : null
      const title = typeof data?.title === "string" ? data.title.trim() : ""
      if (title)
        return {
          title: title.slice(0, 200),
          image:
            typeof data?.thumbnail_url === "string" &&
            data.thumbnail_url.startsWith("https://")
              ? data.thumbnail_url
              : null,
          siteName:
            typeof data?.provider_name === "string" ? data.provider_name : null,
        }
    } catch {
      // Not JSON: read the page instead.
    }
  }
  const page = await get(url, signal)
  return page ? parse(page) : { title: null, image: null, siteName: null }
}

export async function GET(request: NextRequest) {
  // For the team's editor only; it isn't an open fetcher.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const raw = request.nextUrl.searchParams.get("url") ?? ""
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return NextResponse.json({ error: "Bad url" }, { status: 400 })
  }
  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    raw.length > 2048 ||
    url.username ||
    url.password
  )
    return NextResponse.json({ error: "Bad url" }, { status: 400 })
  url.hash = ""
  const key = url.toString()

  const hit = cache.get(key)
  let preview: Preview
  // Nothing found may be a passing failure: kept briefly.
  const ttl = hit?.preview.title ? CACHE_MS : CACHE_MISS_MS
  if (hit && Date.now() - hit.at < ttl) preview = hit.preview
  else {
    // One deadline for the whole thing, redirects included.
    preview = await lookUp(url, AbortSignal.timeout(TIMEOUT_MS))
    if (cache.size >= CACHE_MAX) {
      const oldest = cache.keys().next().value
      if (oldest !== undefined) cache.delete(oldest)
    }
    cache.set(key, { at: Date.now(), preview })
  }
  return NextResponse.json(preview, {
    headers: { "Cache-Control": "private, max-age=3600" },
  })
}

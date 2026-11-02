/**
 * Links shown as cards or live previews in documents (project reports and
 * notes).
 *
 * Markdown has no embeds, so the version picked in the editor rides in the
 * link's URL fragment, like a picture's width does ("…#size=small"). An
 * embed is a paragraph holding nothing but that link:
 *
 *   [Homepage v2](https://www.figma.com/design/abc/Homepage#embed=card)
 *   [Homepage v2](https://www.figma.com/design/abc/Homepage#embed=preview-small)
 *   [Homepage v2](https://www.figma.com/design/abc/Homepage#embed=preview-wide)
 *
 * The link text is the card's title. Anywhere that doesn't know the marker
 * it reads as an ordinary link (the fragment is ignored by the site). The
 * plain "Link" version is just that link, with no marker.
 */

export const EMBED_VIEWS = ["card", "preview-small", "preview-wide"] as const
export type EmbedView = (typeof EMBED_VIEWS)[number]

const MARKER = /#embed=(card|preview-small|preview-wide)$/

/** The link and its version, if `href` carries an embed marker. */
export function parseEmbedHref(
  href: string | null | undefined,
): { url: string; view: EmbedView } | null {
  const m = MARKER.exec(href ?? "")
  if (!m || !href) return null
  const url = href.slice(0, m.index)
  if (!/^https?:\/\//i.test(url)) return null
  return { url, view: m[1] as EmbedView }
}

export function embedHref(url: string, view: EmbedView) {
  return `${url}#embed=${view}`
}

export type EmbedProvider =
  | "figma"
  | "drive"
  | "docs"
  | "sheets"
  | "slides"
  | "forms"
  | "youtube"
  | "loom"
  | "vimeo"
  | "generic"

export const PROVIDER_NAMES: Record<EmbedProvider, string> = {
  figma: "Figma",
  drive: "Google Drive",
  docs: "Google Docs",
  sheets: "Google Sheets",
  slides: "Google Slides",
  forms: "Google Forms",
  youtube: "YouTube",
  loom: "Loom",
  vimeo: "Vimeo",
  generic: "",
}

export type EmbedInfo = {
  provider: EmbedProvider
  /** The page to frame for a live preview; null when there's none. */
  src: string | null
  /** Width / height of the preview. */
  aspect: number
}

function toUrl(raw: string) {
  try {
    const u = new URL(raw.trim())
    return u.protocol === "https:" || u.protocol === "http:" ? u : null
  } catch {
    return null
  }
}

/** A trimmed http(s) URL, or null. */
export function normalizeUrl(raw: string) {
  return toUrl(raw)?.toString() ?? null
}

const GENERIC: EmbedInfo = { provider: "generic", src: null, aspect: 16 / 9 }

/** Which service a link is from and how to show it live. */
export function embedInfo(raw: string): EmbedInfo {
  const u = toUrl(raw)
  if (!u) return GENERIC
  const host = u.hostname.replace(/^www\./, "").toLowerCase()
  const path = u.pathname

  if (host === "figma.com" || host.endsWith(".figma.com")) {
    if (/^\/(file|design|proto|board|slides|deck|make)\//.test(path))
      return {
        provider: "figma",
        src: `https://www.figma.com/embed?embed_host=kretya&url=${encodeURIComponent(u.toString())}`,
        aspect: 16 / 9,
      }
    return { ...GENERIC, provider: "figma" }
  }

  if (host === "drive.google.com") {
    const file =
      /\/file\/d\/([\w-]+)/.exec(path)?.[1] ?? u.searchParams.get("id")
    if (file && !/\/folders\//.test(path))
      return {
        provider: "drive",
        src: `https://drive.google.com/file/d/${file}/preview`,
        aspect: 4 / 3,
      }
    const folder = /\/folders\/([\w-]+)/.exec(path)?.[1]
    if (folder)
      return {
        provider: "drive",
        src: `https://drive.google.com/embeddedfolderview?id=${folder}#grid`,
        aspect: 16 / 10,
      }
    return { ...GENERIC, provider: "drive" }
  }

  if (host === "docs.google.com") {
    const m = /^\/(document|spreadsheets|presentation)\/d\/([\w-]+)/.exec(path)
    if (m) {
      const [, kind, id] = m
      const base = `https://docs.google.com/${kind}/d/${id}`
      if (kind === "document")
        return { provider: "docs", src: `${base}/preview`, aspect: 4 / 3 }
      if (kind === "spreadsheets")
        return { provider: "sheets", src: `${base}/preview`, aspect: 16 / 10 }
      return { provider: "slides", src: `${base}/preview`, aspect: 16 / 9.6 }
    }
    const form = /^\/forms\/d\/(e\/)?([\w-]+)/.exec(path)
    if (form)
      return {
        provider: "forms",
        src: `https://docs.google.com/forms/d/${form[1] ?? ""}${form[2]}/viewform?embedded=true`,
        aspect: 3 / 4,
      }
    return { ...GENERIC, provider: "docs" }
  }

  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtu.be" ||
    host === "youtube-nocookie.com"
  ) {
    const short = /^\/shorts\/([\w-]{6,})/.exec(path)?.[1]
    const id =
      short ??
      (host === "youtu.be"
        ? /^\/([\w-]{6,})/.exec(path)?.[1]
        : (u.searchParams.get("v") ??
          /^\/(?:embed|live|v)\/([\w-]{6,})/.exec(path)?.[1]))
    if (id && /^[\w-]+$/.test(id)) {
      const t = /^(\d+)s?$/.exec(u.searchParams.get("t") ?? "")?.[1]
      return {
        provider: "youtube",
        src: `https://www.youtube-nocookie.com/embed/${id}${t ? `?start=${t}` : ""}`,
        aspect: short ? 9 / 16 : 16 / 9,
      }
    }
    return { ...GENERIC, provider: "youtube" }
  }

  if (host === "loom.com") {
    const id = /^\/(?:share|embed)\/([\da-f]{16,})/i.exec(path)?.[1]
    if (id)
      return {
        provider: "loom",
        src: `https://www.loom.com/embed/${id}`,
        aspect: 16 / 9,
      }
    return { ...GENERIC, provider: "loom" }
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = /^\/(?:video\/)?(\d+)(?:\/([\da-f]+))?/i.exec(path)
    if (m) {
      const hash = m[2] ?? u.searchParams.get("h")
      return {
        provider: "vimeo",
        src: `https://player.vimeo.com/video/${m[1]}${hash ? `?h=${hash}` : ""}`,
        aspect: 16 / 9,
      }
    }
    return { ...GENERIC, provider: "vimeo" }
  }

  return GENERIC
}

/** The site's name for a link: "figma.com", "docs.google.com". */
export function embedDomain(raw: string) {
  return toUrl(raw)?.hostname.replace(/^www\./, "") ?? raw
}

/** What to call a link before (or without) its page title. */
export function fallbackTitle(raw: string) {
  const { provider } = embedInfo(raw)
  if (provider !== "generic") return PROVIDER_NAMES[provider]
  const u = toUrl(raw)
  if (!u) return raw
  const path = decodeURIComponent(u.pathname).replace(/\/$/, "")
  return `${u.hostname.replace(/^www\./, "")}${path.length > 40 ? `${path.slice(0, 40)}…` : path}`
}

/** The site's icon, for the card. */
export function faviconUrl(raw: string) {
  const u = toUrl(raw)
  return u
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=64`
    : null
}

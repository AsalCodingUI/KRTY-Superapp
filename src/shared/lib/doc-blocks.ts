/**
 * Callouts, toggles and galleries in documents (project reports, notes,
 * rules): how each is written in Markdown, so the editor, the read-only
 * editor and `<Markdown>` read the same source, and anywhere else (GitHub,
 * a plain viewer) still reads sensibly.
 *
 * Callout: a GitHub alert. The tone is the marker on the first line.
 *
 *   > [!NOTE]        info
 *   > [!TIP]         sukses
 *   > [!WARNING]     peringatan
 *   > [!CAUTION]     bahaya
 *   > [!NEUTRAL]     netral (outline only; ours, not GitHub's)
 *   > Isi callout, any blocks.
 *
 *   ([!IMPORTANT] reads as info.)
 *
 * Toggle: an HTML details element, the only raw HTML that's read. The
 * summary is plain text (&, <, > escaped); the body is Markdown between
 * blank lines, so it may hold any blocks, other toggles too.
 *
 *   <details>
 *   <summary>Judul toggle</summary>
 *
 *   Isi toggle.
 *
 *   </details>
 *
 * Gallery: a paragraph of pictures only, one per line, each marked with
 * "#gallery" in its URL fragment, like a picture's width ("#size=small")
 * and an embed's version ("#embed=card"). Anywhere that doesn't know the
 * marker shows the pictures one after another. The URLs are ordinary
 * storage URLs, so the client site's rewrite (clientSafeMarkdown) applies.
 *
 *   ![](https://…/report-images/a.webp#gallery&w=1352&h=608)
 *   ![](https://…/report-images/b.webp#gallery)
 *
 * "&w=…&h=…" (the picture's pixel size, when known) lets readers reserve
 * its space before it loads.
 */

export const CALLOUT_TONES = [
  "neutral",
  "info",
  "success",
  "warning",
  "danger",
] as const
export type CalloutTone = (typeof CALLOUT_TONES)[number]

const TONE_MARKER: Record<CalloutTone, string> = {
  neutral: "NEUTRAL",
  info: "NOTE",
  success: "TIP",
  warning: "WARNING",
  danger: "CAUTION",
}

const MARKER_TONE: Record<string, CalloutTone> = {
  NEUTRAL: "neutral",
  NOTE: "info",
  IMPORTANT: "info",
  TIP: "success",
  WARNING: "warning",
  CAUTION: "danger",
}

export const isCalloutTone = (v: unknown): v is CalloutTone =>
  CALLOUT_TONES.includes(v as CalloutTone)

/** "> [!NOTE]" for a tone. */
export const calloutMarker = (tone: CalloutTone) =>
  `[!${TONE_MARKER[tone] ?? "NOTE"}]`

/** The tone of a GitHub alert marker ("NOTE", "tip"…), if it is one. */
export function toneOfMarker(marker: string): CalloutTone | null {
  return MARKER_TONE[marker.toUpperCase()] ?? null
}

/** "[!NOTE]" at the start of a callout's text, and the line break after. */
export const CALLOUT_MARKER =
  /^\[!(NEUTRAL|NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*(?:\r?\n|$)/i

const GALLERY = /#gallery(?:&w=(\d+)&h=(\d+))?$/

export const isGallerySrc = (src: string | null | undefined) =>
  GALLERY.test(src ?? "")

/** "…#gallery&w=1352&h=608" → the bare URL and the size, if given. */
export function parseGallerySrc(src: string) {
  const m = GALLERY.exec(src)
  if (!m) return null
  const w = Number(m[1])
  const h = Number(m[2])
  return {
    src: src.slice(0, m.index),
    ...(w > 0 && h > 0 ? { w, h } : {}),
  }
}

/** The URL with the marker (and the size, when known). */
export const withGallery = (src: string, w?: number, h?: number) =>
  `${src.replace(/#.*$/, "")}#gallery${w && h ? `&w=${Math.round(w)}&h=${Math.round(h)}` : ""}`

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
}

/** A toggle's summary as it sits in `<summary>…</summary>`. */
export const escapeSummary = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

export const unescapeSummary = (s: string) =>
  s.replace(/&(?:amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m] ?? m).trim()

/** `<details>` (with any attributes), opening a toggle. */
export const DETAILS_OPEN = /^<details(?:\s[^>]*)?>/i
export const DETAILS_CLOSE = /^<\/details>\s*$/i
const SUMMARY = /<summary>([\s\S]*?)<\/summary>/i

/* ------------------------------------------------------------------ */
/* react-markdown: a remark plugin that turns the three into elements. */
/* ------------------------------------------------------------------ */

type MdNode = {
  type: string
  value?: string
  url?: string
  children?: MdNode[]
  data?: {
    hName?: string
    hProperties?: Record<string, unknown>
  }
}

/**
 * `<details>…</details>` runs among siblings → one `details` element (with
 * a `summary`). react-markdown drops raw HTML, so nothing else of it shows;
 * only this exact shape is read, and only as text.
 */
function foldToggles(children: MdNode[]): MdNode[] {
  const out: MdNode[] = []
  for (let i = 0; i < children.length; i++) {
    const node = children[i]
    const open =
      node.type === "html" ? DETAILS_OPEN.exec(node.value?.trim() ?? "") : null
    if (!open) {
      out.push(node)
      continue
    }
    const head = node.value?.trim() ?? ""
    let summary = SUMMARY.exec(head)?.[1]
    let j = i + 1
    // "<summary>" on its own block (a blank line after "<details>").
    if (summary === undefined && children[j]?.type === "html") {
      const s = SUMMARY.exec(children[j].value ?? "")
      if (s) {
        summary = s[1]
        j++
      }
    }
    // Up to the matching "</details>".
    let depth = 0
    let end = -1
    for (let k = j; k < children.length; k++) {
      const c = children[k]
      if (c.type !== "html") continue
      const v = c.value?.trim() ?? ""
      if (DETAILS_OPEN.test(v)) depth++
      else if (DETAILS_CLOSE.test(v)) {
        if (depth === 0) {
          end = k
          break
        }
        depth--
      }
    }
    if (end < 0) {
      out.push(node)
      continue
    }
    out.push({
      type: "docToggle",
      data: { hName: "details", hProperties: { dataToggle: "" } },
      children: [
        {
          type: "docToggleSummary",
          data: { hName: "summary" },
          children: [{ type: "text", value: unescapeSummary(summary ?? "") }],
        },
        ...foldToggles(children.slice(j, end)),
      ],
    })
    i = end
  }
  return out
}

/** A blockquote starting "[!NOTE]" (etc.) → a callout of that tone. */
function markCallout(node: MdNode) {
  if (node.type !== "blockquote") return
  const first = node.children?.[0]
  // "[!NOTE]" over a "-" line (an empty bullet) reads as a setext heading.
  if (first?.type === "heading" && first.children?.length === 1) {
    const only = first.children[0]
    const m =
      only.type === "text" ? CALLOUT_MARKER.exec(only.value ?? "") : null
    const tone = m && toneOfMarker(m[1])
    if (m && tone && m[0].length === (only.value ?? "").length) {
      node.children = node.children?.slice(1)
      node.data = { ...node.data, hProperties: { dataCallout: tone } }
      return
    }
  }
  const para = node.children?.[0]
  const text = para?.type === "paragraph" ? para.children?.[0] : undefined
  if (text?.type !== "text") return
  const m = CALLOUT_MARKER.exec(text.value ?? "")
  const tone = m && toneOfMarker(m[1])
  if (!m || !tone || !para) return
  text.value = (text.value ?? "").slice(m[0].length)
  if (!text.value) para.children = para.children?.slice(1)
  // A marker alone on its line leaves an empty paragraph behind.
  if (para.children?.length === 0) node.children = node.children?.slice(1)
  node.data = { ...node.data, hProperties: { dataCallout: tone } }
}

function walk(node: MdNode) {
  if (!node.children) return
  node.children = foldToggles(node.children)
  for (const c of node.children) {
    markCallout(c)
    walk(c)
  }
}

/** remark plugin: callouts and toggles (see the top of this file). */
export function remarkDocBlocks() {
  return (tree: MdNode) => walk(tree)
}

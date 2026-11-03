/*
 * Plain-text bits of a report's Markdown for link previews (Open Graph
 * description, the share card): no Markdown syntax, mentions keep their
 * label, links their text, and bare URLs and embeds are left out.
 */

const PICTOGRAPH = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu

/** One line of Markdown without its syntax. */
function plainLine(line: string) {
  return (
    line
      // Images (any size / gallery hint) say nothing in a preview.
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      // Links: the label, unless it is a URL itself or an embed card.
      .replace(
        /\[((?:\\.|[^\]\\])*)\]\(([^)]*)\)/g,
        (_, label: string, href: string) =>
          /#embed=/.test(href) || /^https?:\/\//.test(label.trim())
            ? " "
            : label.replace(/\\(.)/g, "$1"),
      )
      .replace(/<[^>]+>/g, " ")
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/^\s*>\s?/g, "")
      .replace(/^\s*\[![A-Z]+\]\s*/i, "")
      .replace(/^\s*#{1,6}\s+/, "")
      .replace(/^\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]?\]\s*)?/, "")
      .replace(/^\s*\|?(?:\s*:?-{2,}:?\s*\|)+\s*$/, " ")
      .replace(/\|/g, " ")
      .replace(/(\*\*|__|~~|`)/g, "")
      .replace(/(^|[\s(])[*_]([^*_]+)[*_]/g, "$1$2")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(PICTOGRAPH, "")
      .replace(/\s+/g, " ")
      .trim()
  )
}

/** The report's text as one line (code blocks and empty lines left out). */
export function markdownPlainText(markdown: string) {
  let inCode = false
  const out: string[] = []
  for (const raw of markdown.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(raw)) {
      inCode = !inCode
      continue
    }
    if (inCode) continue
    const line = plainLine(raw)
    // A lone "-" or ":" left from an empty list item or template.
    if (line && /[\p{L}\p{N}]/u.test(line)) out.push(line)
  }
  return out.join(" ").replace(/\s+/g, " ").trim()
}

/** `text` cut to `max` characters at a word, with "…" when cut. */
export function clampText(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const space = cut.lastIndexOf(" ")
  return `${(space > max * 0.5 ? cut.slice(0, space) : cut).replace(/[\s,.;:–—-]+$/, "")}…`
}

/** A short description (~160 characters) of a report's body. */
export function markdownExcerpt(markdown: string, max = 160) {
  return clampText(markdownPlainText(markdown), max)
}

/** The report's section headings (## and ###), in order, without repeats. */
export function markdownHeadings(markdown: string, limit = 4) {
  const seen = new Set<string>()
  const out: string[] = []
  let inCode = false
  for (const raw of markdown.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(raw)) inCode = !inCode
    if (inCode || !/^#{2,3}\s+\S/.test(raw)) continue
    const text = plainLine(raw)
    if (!text || seen.has(text.toLowerCase())) continue
    seen.add(text.toLowerCase())
    out.push(text)
    if (out.length >= limit) break
  }
  return out
}

/** The first picture's address in the Markdown (without its #size hint). */
export function firstMarkdownImage(markdown: string) {
  const m = /!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/.exec(markdown)
  return m ? m[1].replace(/#.*$/, "") : null
}

/** Text a share card can draw: no emoji (they'd need a network font). */
export function cardText(text: string) {
  return text.replace(PICTOGRAPH, "").replace(/\s+/g, " ").trim()
}

import type { AccessLevel } from "@/shared/config/access"
import { isFor } from "./audience"
import type { WhatsNewAudience, WhatsNewEntry } from "./types"

/**
 * A guide's body split at its top headings: the shallowest of "#" / "##"
 * present starts a section (the table of contents). A heading ending in
 * "(khusus stakeholder)" or "(PM & stakeholder)" narrows that section to
 * them; the marker isn't shown.
 */
export type GuideSection = {
  id: string
  title: string
  body: string
  audience: WhatsNewAudience
}

const MARKER =
  /\s*\((khusus stakeholder|stakeholder only|pm & stakeholder|pm dan stakeholder|khusus pm)\)\s*$/i

function audienceOf(marker: string): WhatsNewAudience {
  return /stakeholder only|khusus stakeholder/i.test(marker)
    ? "stakeholder"
    : "pm"
}

export function slugifyHeading(text: string) {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "bagian"
  )
}

/** Inline Markdown stripped for a heading's plain text. */
const plain = (s: string) => s.replace(/[*_`~]/g, "").replace(/\\(.)/g, "$1")

export function splitGuide(body: string): {
  intro: string
  sections: GuideSection[]
} {
  const lines = body.split("\n")
  let fence = false
  const levels: number[] = []
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence
    const m = !fence && /^(#{1,2})\s+\S/.exec(line)
    if (m) levels.push(m[1].length)
  }
  if (!levels.length) return { intro: body.trim(), sections: [] }
  const level = Math.min(...levels)
  const head = new RegExp(`^#{${level}}\\s+(.+?)\\s*#*\\s*$`)

  const intro: string[] = []
  const sections: GuideSection[] = []
  const used = new Map<string, number>()
  let current: {
    title: string
    audience: WhatsNewAudience
    lines: string[]
  } | null = null
  fence = false
  const flush = () => {
    if (!current) return
    const base = slugifyHeading(current.title)
    const n = used.get(base) ?? 0
    used.set(base, n + 1)
    sections.push({
      id: n ? `${base}-${n + 1}` : base,
      title: current.title,
      body: current.lines.join("\n").trim(),
      audience: current.audience,
    })
  }
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence
    const m = !fence && head.exec(line)
    if (m) {
      flush()
      const raw = plain(m[1])
      const marker = MARKER.exec(raw)
      current = {
        title: marker ? raw.slice(0, marker.index).trim() : raw.trim(),
        audience: marker ? audienceOf(marker[1]) : "everyone",
        lines: [],
      }
    } else if (current) current.lines.push(line)
    else intro.push(line)
  }
  flush()
  return { intro: intro.join("\n").trim(), sections }
}

/** The guide as this viewer gets it (narrowed sections dropped). */
export function guideFor(entry: WhatsNewEntry, level: AccessLevel) {
  const { intro, sections } = splitGuide(entry.body)
  return { intro, sections: sections.filter((s) => isFor(s.audience, level)) }
}

/** Plain text of what this viewer can read of an entry, for search. */
export function searchText(entry: WhatsNewEntry, level: AccessLevel) {
  const { intro, sections } = guideFor(entry, level)
  return [
    entry.title,
    entry.summary,
    intro,
    ...sections.flatMap((s) => [s.title, s.body]),
  ]
    .join(" ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[`*_>#[\]()]/g, " ")
    .toLowerCase()
}

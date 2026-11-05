/**
 * What a plain element is, for the generic layers: no registration, just
 * the DOM. Pure (no React, no i18n) so the resolver tests run on it.
 */

export type NativeHit =
  | {
      kind: "link"
      el: HTMLAnchorElement
      /** Absolute address. */
      href: string
      text: string
      /** Same origin as the app (opens in place). */
      internal: boolean
      scheme: "web" | "mailto" | "tel" | "other"
    }
  | { kind: "image"; el: HTMLImageElement; src: string; alt: string }
  | { kind: "video" | "audio"; el: HTMLMediaElement; src: string }
  | {
      kind: "field"
      el: HTMLElement
      /** input / textarea, or a contentEditable host (rich text). */
      mode: "input" | "rich"
      password: boolean
      readOnly: boolean
    }
  | { kind: "code"; el: HTMLElement; text: string }
  | {
      kind: "table"
      el: HTMLTableElement
      row: HTMLTableRowElement | null
      cell: HTMLTableCellElement | null
    }
  | {
      kind: "button"
      el: HTMLElement
      label: string
      shortcut: string | null
      disabled: boolean
    }

export type NativeKind = NativeHit["kind"]

const TEXT_INPUTS = new Set([
  "text",
  "search",
  "email",
  "url",
  "tel",
  "password",
  "number",
  "",
])

const origin = () =>
  typeof window === "undefined" ? "http://localhost" : window.location.origin

/** The absolute form of an address (as the browser would follow it). */
export function absoluteUrl(href: string) {
  try {
    return new URL(href, origin()).href
  } catch {
    return href
  }
}

/** A short visible name for an element (aria-label, text, title). */
export function labelOf(el: Element) {
  const aria = el.getAttribute("aria-label")
  if (aria?.trim()) return aria.trim()
  const labelledBy = el.getAttribute("aria-labelledby")
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => el.ownerDocument.getElementById(id)?.textContent ?? "")
      .join(" ")
      .trim()
    if (text) return text
  }
  // innerText keeps the gaps between blocks ("Oakland 2026-Q4", not
  // "Oakland2026-Q4"); textContent where there is none (tests).
  const raw = (el as HTMLElement).innerText || el.textContent || ""
  const text = raw.replace(/\s+/g, " ").trim()
  if (text) return text.length > 40 ? `${text.slice(0, 38)}…` : text
  return el.getAttribute("title")?.trim() ?? ""
}

function isEditableHost(el: HTMLElement) {
  const attr = el.getAttribute("contenteditable")
  if (attr === null || attr === "false") return false
  // The host, not an editable descendant of one.
  const parent = el.parentElement
  return !parent?.closest('[contenteditable]:not([contenteditable="false"])')
}

/** What `el` itself is, or null for a plain element. */
export function detectNative(el: Element): NativeHit | null {
  const tag = el.tagName.toLowerCase()

  if (tag === "a" && el.hasAttribute("href")) {
    const a = el as HTMLAnchorElement
    const raw = a.getAttribute("href") ?? ""
    if (!raw || raw.startsWith("javascript:")) return null
    const href = absoluteUrl(raw)
    const scheme = href.startsWith("mailto:")
      ? "mailto"
      : href.startsWith("tel:")
        ? "tel"
        : /^https?:/.test(href)
          ? "web"
          : "other"
    let internal = false
    try {
      internal = scheme === "web" && new URL(href).origin === origin()
    } catch {
      // Not a URL: external.
    }
    return {
      kind: "link",
      el: a,
      href,
      text: (a.textContent ?? "").replace(/\s+/g, " ").trim(),
      internal,
      scheme,
    }
  }

  if (tag === "img") {
    const img = el as HTMLImageElement
    const src =
      img.getAttribute("data-lightbox-src") ||
      img.currentSrc ||
      img.src ||
      img.getAttribute("src") ||
      ""
    if (!src) return null
    return { kind: "image", el: img, src: absoluteUrl(src), alt: img.alt }
  }

  if (tag === "video" || tag === "audio") {
    const media = el as HTMLMediaElement
    const src =
      media.currentSrc ||
      media.getAttribute("src") ||
      media.querySelector("source")?.getAttribute("src") ||
      ""
    return { kind: tag, el: media, src: src ? absoluteUrl(src) : "" }
  }

  if (tag === "textarea") {
    const ta = el as HTMLTextAreaElement
    return {
      kind: "field",
      el: ta,
      mode: "input",
      password: false,
      readOnly: ta.readOnly || ta.disabled,
    }
  }
  if (tag === "input") {
    const input = el as HTMLInputElement
    const type = (input.getAttribute("type") ?? "").toLowerCase()
    if (TEXT_INPUTS.has(type))
      return {
        kind: "field",
        el: input,
        mode: "input",
        password: type === "password",
        readOnly: input.readOnly || input.disabled,
      }
  }
  if (el instanceof HTMLElement && isEditableHost(el))
    return {
      kind: "field",
      el,
      mode: "rich",
      password: false,
      readOnly: false,
    }

  if (tag === "pre" || (tag === "code" && !el.closest("pre"))) {
    const text = el.textContent ?? ""
    if (text.trim())
      return {
        kind: "code",
        el: el as HTMLElement,
        text: text.replace(/\n$/, ""),
      }
  }

  if (tag === "table")
    return { kind: "table", el: el as HTMLTableElement, row: null, cell: null }

  const role = el.getAttribute("role")
  const isButton =
    tag === "button" ||
    tag === "summary" ||
    (tag === "input" &&
      ["button", "submit", "reset"].includes(
        (el.getAttribute("type") ?? "").toLowerCase(),
      )) ||
    role === "button" ||
    role === "switch" ||
    role === "checkbox" ||
    role === "tab" ||
    role === "menuitem" ||
    role === "option"
  if (isButton) {
    const label =
      tag === "input"
        ? (el as HTMLInputElement).value || labelOf(el)
        : labelOf(el)
    if (!label) return null
    return {
      kind: "button",
      el: el as HTMLElement,
      label,
      shortcut: el.getAttribute("aria-keyshortcuts"),
      disabled:
        (el as HTMLButtonElement).disabled === true ||
        el.getAttribute("aria-disabled") === "true" ||
        el.hasAttribute("data-disabled"),
    }
  }
  return null
}

/** The table's rows as tab-separated lines (cells' text, one line each). */
export function rowToTsv(row: HTMLTableRowElement) {
  return [...row.cells]
    .map((c) => (c.textContent ?? "").replace(/\s+/g, " ").trim())
    .join("\t")
}

export function tableToTsv(table: HTMLTableElement) {
  return [...table.rows].map(rowToTsv).join("\n")
}

// ---------------------------------------------------------------------------
// Things in plain text: an email, a phone number, a date, a bare address
// ---------------------------------------------------------------------------

export type TextToken = {
  kind: "email" | "url" | "phone" | "date"
  value: string
}

const MONTHS =
  "jan(?:uari|uary)?|feb(?:ruari|ruary)?|mar(?:et|ch)?|apr(?:il)?|mei|may|jun(?:i|e)?|jul(?:i|y)?|agu(?:stus)?|agt|aug(?:ust)?|sep(?:t|tember)?|okt(?:ober)?|oct(?:ober)?|nov(?:ember)?|des(?:ember)?|dec(?:ember)?"

const TOKEN_PATTERNS: [TextToken["kind"], RegExp][] = [
  ["email", /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g],
  ["url", /\bhttps?:\/\/[^\s<>"')\]]+|\bwww\.[^\s<>"')\]]+\.[^\s<>"')\]]+/g],
  ["phone", /(?:\+\d{1,3}|\b0)[\d\s-]{7,16}\d/g],
  [
    "date",
    new RegExp(
      `\\b\\d{4}-\\d{2}-\\d{2}\\b|\\b\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{2,4}\\b|\\b\\d{1,2}\\s+(?:${MONTHS})\\.?\\s+\\d{4}\\b`,
      "gi",
    ),
  ],
]

/** The email / address / phone / date covering `offset` in `text`. */
export function detectTokenAt(text: string, offset: number): TextToken | null {
  for (const [kind, pattern] of TOKEN_PATTERNS) {
    pattern.lastIndex = 0
    for (const m of text.matchAll(pattern)) {
      const start = m.index ?? 0
      const end = start + m[0].length
      if (offset < start || offset > end) continue
      let value = m[0].replace(/[.,;:!?]+$/, "")
      if (kind === "phone") {
        value = value.trim()
        const digits = value.replace(/\D/g, "")
        if (digits.length < 9 || digits.length > 15) continue
      }
      return { kind, value }
    }
  }
  return null
}

/** Digits for wa.me: Indonesian 08… becomes 628…. */
export function waNumber(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits
}

/** The text node and offset under a viewport point (where supported). */
export function textAtPoint(
  x: number,
  y: number,
): { text: string; offset: number } | null {
  const doc = document as Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offsetNode: Node; offset: number } | null
    caretRangeFromPoint?: (x: number, y: number) => Range | null
  }
  let node: Node | null = null
  let offset = 0
  if (doc.caretPositionFromPoint) {
    const pos = doc.caretPositionFromPoint(x, y)
    if (pos) {
      node = pos.offsetNode
      offset = pos.offset
    }
  } else if (doc.caretRangeFromPoint) {
    const range = doc.caretRangeFromPoint(x, y)
    if (range) {
      node = range.startContainer
      offset = range.startOffset
    }
  }
  if (!node || node.nodeType !== Node.TEXT_NODE) return null
  return { text: node.textContent ?? "", offset }
}

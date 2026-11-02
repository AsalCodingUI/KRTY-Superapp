/**
 * Browser plumbing for the generic items: clipboard (with fallbacks),
 * editing a field the way typing would (so ⌘Z still undoes it), downloads,
 * shortcut hints.
 */

export const isMac = () =>
  typeof navigator !== "undefined" &&
  /mac|iphone|ipad/i.test(navigator.userAgent)

/** "Mod+Shift+C" → "⌘⇧C" on a Mac, "Ctrl+Shift+C" elsewhere. */
export function formatShortcut(shortcut: string) {
  const mac = isMac()
  const parts = shortcut.split("+").map((p) => p.trim())
  const map: Record<string, [string, string]> = {
    mod: ["⌘", "Ctrl"],
    meta: ["⌘", "Win"],
    cmd: ["⌘", "Ctrl"],
    control: ["⌃", "Ctrl"],
    ctrl: ["⌃", "Ctrl"],
    alt: ["⌥", "Alt"],
    option: ["⌥", "Alt"],
    shift: ["⇧", "Shift"],
    enter: ["↵", "Enter"],
    escape: ["Esc", "Esc"],
    backspace: ["⌫", "Backspace"],
    delete: ["⌦", "Del"],
    arrowup: ["↑", "↑"],
    arrowdown: ["↓", "↓"],
    arrowleft: ["←", "←"],
    arrowright: ["→", "→"],
  }
  const out = parts.map((p) => {
    const m = map[p.toLowerCase()]
    if (m) return mac ? m[0] : m[1]
    return p.length === 1 ? p.toUpperCase() : p
  })
  return mac ? out.join("") : out.join("+")
}

/** Copies text; true when it worked. */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older WebKit / no permission: the old way.
    const ta = document.createElement("textarea")
    ta.value = text
    ta.setAttribute("readonly", "")
    ta.style.cssText = "position:fixed;top:-1000px;opacity:0"
    document.body.append(ta)
    ta.select()
    let ok = false
    try {
      ok = document.execCommand("copy")
    } catch {
      ok = false
    }
    ta.remove()
    return ok
  }
}

/** Copies rich text (HTML) with a plain fallback. */
export async function copyRich(html: string, plain: string) {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      }),
    ])
    return true
  } catch {
    return copyText(plain)
  }
}

/** A PNG of the picture (the clipboard only takes PNG everywhere). */
async function pngOf(src: string): Promise<Blob> {
  const res = await fetch(src, { mode: "cors" })
  if (!res.ok) throw new Error("fetch")
  const blob = await res.blob()
  if (blob.type === "image/png") return blob
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0)
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("png"))),
      "image/png",
    ),
  )
}

/** Copies the picture itself; false when it can't (cross-origin, Firefox). */
export async function copyImage(src: string) {
  try {
    // Safari wants the promise inside the item, in the click's turn.
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": pngOf(src) }),
    ])
    return true
  } catch {
    return false
  }
}

const fileNameOf = (url: string, fallback: string) => {
  try {
    const name = decodeURIComponent(
      new URL(url, window.location.href).pathname.split("/").pop() ?? "",
    )
    return name || fallback
  } catch {
    return fallback
  }
}

/** Downloads a file; falls back to opening it in a new tab. */
export async function download(url: string, fallbackName = "download") {
  const name = fileNameOf(url, fallbackName)
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error("fetch")
    const blob = await res.blob()
    const href = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = href
    a.download = name
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(href), 10_000)
  } catch {
    window.open(url, "_blank", "noopener")
  }
}

type FieldEl = HTMLInputElement | HTMLTextAreaElement

const isInputLike = (el: Element): el is FieldEl =>
  el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement

/** A field's selection, kept while the menu has focus. */
export type FieldSnapshot =
  | { kind: "input"; el: FieldEl; start: number; end: number }
  | { kind: "rich"; el: HTMLElement; range: Range | null }

export function snapshotField(el: HTMLElement): FieldSnapshot {
  if (isInputLike(el)) {
    let start = 0
    let end = 0
    try {
      start = el.selectionStart ?? 0
      end = el.selectionEnd ?? 0
    } catch {
      // type=number / email have no selection API.
    }
    return { kind: "input", el, start, end }
  }
  const sel = window.getSelection()
  const range =
    sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)
      ? sel.getRangeAt(0).cloneRange()
      : null
  return { kind: "rich", el, range }
}

/** Focus back in the field with its selection as it was. */
export function restoreField(snap: FieldSnapshot) {
  snap.el.focus({ preventScroll: true })
  if (snap.kind === "input") {
    try {
      snap.el.setSelectionRange(snap.start, snap.end)
    } catch {
      // No selection API on this input type.
    }
  } else if (snap.range) {
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(snap.range)
  }
}

export function selectedTextOf(snap: FieldSnapshot) {
  if (snap.kind === "input") return snap.el.value.slice(snap.start, snap.end)
  return snap.range?.toString() ?? ""
}

/** Types `text` over the selection, as the keyboard would (undoable). */
export function insertText(snap: FieldSnapshot, text: string) {
  restoreField(snap)
  let ok = false
  try {
    ok = document.execCommand("insertText", false, text)
  } catch {
    ok = false
  }
  if (ok || snap.kind !== "input") return ok
  // No execCommand: set it directly and tell React.
  snap.el.setRangeText(text, snap.start, snap.end, "end")
  snap.el.dispatchEvent(new Event("input", { bubbles: true }))
  return true
}

export function selectAll(snap: FieldSnapshot) {
  snap.el.focus({ preventScroll: true })
  if (snap.kind === "input") snap.el.select()
  else document.execCommand("selectAll")
}

export function clearField(snap: FieldSnapshot) {
  if (snap.kind !== "input") return
  snap.el.focus({ preventScroll: true })
  snap.el.select()
  if (!document.execCommand("delete")) {
    snap.el.value = ""
    snap.el.dispatchEvent(new Event("input", { bubbles: true }))
  }
}

/** The selection's text and the point covered by it. */
export function selectionAt(
  x: number,
  y: number,
  target: Element,
  keyboard = false,
) {
  const field = target.closest("input, textarea")
  if (field && isInputLike(field)) {
    try {
      const start = field.selectionStart ?? 0
      const end = field.selectionEnd ?? 0
      const text = field.value.slice(start, end)
      return { text, onSelection: text.length > 0 }
    } catch {
      return { text: "", onSelection: false }
    }
  }
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || sel.rangeCount === 0)
    return { text: "", onSelection: false }
  const text = sel.toString()
  const range = sel.getRangeAt(0)
  let onSelection = false
  for (const r of range.getClientRects()) {
    if (
      x >= r.left - 2 &&
      x <= r.right + 2 &&
      y >= r.top - 2 &&
      y <= r.bottom + 2
    ) {
      onSelection = true
      break
    }
  }
  // From the keyboard: the focused element holds the selection.
  if (!onSelection && keyboard)
    onSelection = target.contains(range.commonAncestorContainer)
  return { text, onSelection }
}

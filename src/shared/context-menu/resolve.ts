import type { AccessLevel } from "@/shared/config/access"
import {
  absoluteUrl,
  detectNative,
  type NativeHit,
  type NativeKind,
  type TextToken,
} from "./detect"
import { targetOf, typeResolver } from "./registry"
import type {
  CtxContext,
  CtxItem,
  CtxItems,
  CtxLayer,
  CtxSection,
} from "./types"

/*
 * From the right-clicked element up to <html>, collecting layers, most
 * specific first:
 *
 *   selection (when the click is on it) → a token under the pointer
 *   (email, phone, date, address) → for each element going up: its React
 *   target, its data-ctx type, what it natively is (link, image, field,
 *   code, table, media, button — each kind once, the nearest) → page.
 *
 * An entity with an `href` brings Buka / tab baru / Salin link and hides
 * the generic link layer for the same address (a row's covering link).
 * `data-ctx="native"` (or an iframe) anywhere up the chain means: leave it
 * to the browser.
 */

export type ResolveInput = {
  target: Element
  x: number
  y: number
  /** Selected text (document selection, or the field's selected part). */
  selectionText: string
  /** The click landed on the selection. */
  onSelection: boolean
  /** An email / phone / date / address under the pointer. */
  token: TextToken | null
  access: AccessLevel | null
  keyboard: boolean
}

type Built = { label?: string; items: CtxItem[] } | null

/** Turn generic things into items (i18n and actions live in the caller). */
export type LayerBuilders = {
  selection: (text: string, ctx: CtxContext) => Built
  token: (token: TextToken, ctx: CtxContext) => Built
  native: (hit: NativeHit, ctx: CtxContext) => Built
  /** Open / new tab / copy link items for an entity's page. */
  entityLinks: (href: string, ctx: CtxContext) => CtxItem[]
  /** The page layer; `alone` when nothing else is in the menu. */
  page: (ctx: CtxContext, alone: boolean) => Built
}

export type Resolved = { native: true } | { native: false; layers: CtxLayer[] }

const isSections = (items: CtxItems): items is CtxSection[] =>
  items.length > 0 && "items" in items[0] && !("id" in items[0])

/** Sections of whatever a target returned. */
function sectionsOf(items: CtxItems | null | undefined): CtxSection[] {
  if (!items || items.length === 0) return []
  return isSections(items) ? items : [{ items: items as CtxItem[] }]
}

/** Items the viewer may see: `hidden` and `access` applied, recursively. */
export function visibleItems(
  items: CtxItem[],
  access: AccessLevel | null,
): CtxItem[] {
  const out: CtxItem[] = []
  for (const item of items) {
    if (item.hidden) continue
    if (item.access && (!access || !item.access.includes(access))) continue
    if (Array.isArray(item.submenu)) {
      const sub = visibleItems(item.submenu, access)
      // A submenu with nothing left in it goes too (unless it also acts).
      if (sub.length === 0 && !item.onSelect) continue
      out.push({ ...item, submenu: sub })
    } else out.push(item)
  }
  return out
}

/** Images this small are icons / avatars: no image layer for them. */
function isTiny(el: Element) {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.width < 40 && r.height < 40
}

export function resolveLayers(
  input: ResolveInput,
  build: LayerBuilders,
): Resolved {
  const { target } = input
  if (target.closest('[data-ctx="native"], iframe')) return { native: true }

  const base: Omit<CtxContext, "el"> = {
    target,
    x: input.x,
    y: input.y,
    selectionText: input.selectionText,
    access: input.access,
    keyboard: input.keyboard,
  }
  const layers: CtxLayer[] = []
  let n = 0
  const push = (
    kind: string,
    el: Element | null,
    built: Built | undefined,
    label?: string,
  ) => {
    if (!built) return
    const items = visibleItems(built.items, input.access)
    if (items.length === 0) return
    layers.push({
      key: `${kind}-${n++}`,
      kind,
      label: built.label ?? label,
      items,
      el,
    })
  }

  if (input.onSelection && input.selectionText.trim())
    push(
      "selection",
      null,
      build.selection(input.selectionText.trim(), { ...base, el: target }),
    )

  const inLinkOrField = target.closest(
    "a[href], input, textarea, [contenteditable]:not([contenteditable=false])",
  )
  if (input.token && !inLinkOrField)
    push(
      input.token.kind,
      null,
      build.token(input.token, { ...base, el: target }),
    )

  const seen = new Set<NativeKind>()
  const entityHrefs = new Set<string>()
  const suppressors: { el: Element; kinds: string[] }[] = []

  for (
    let el: Element | null = target;
    el && el !== el.ownerDocument.documentElement;
    el = el.parentElement
  ) {
    const ctx: CtxContext = { ...base, el }

    const entry = targetOf(el)
    const marker = el.getAttribute("data-ctx")
    const resolver = marker ? typeResolver(marker) : undefined
    let entity = false

    if (entry) {
      const sections = sectionsOf(entry.items?.(ctx))
      // No items of its own: the type's resolver, if there is one.
      const fallback =
        sections.length === 0 && resolver && el instanceof HTMLElement
          ? normalize(resolver(el, { ...ctx, id: entry.id ?? null }))
          : null
      const all = fallback ?? { label: undefined, sections }
      const links = entry.href ? build.entityLinks(entry.href, ctx) : []
      if (entry.href) entityHrefs.add(absoluteUrl(entry.href))
      all.sections.forEach((section, i) =>
        push(entry.type ?? "target", el, {
          label:
            section.label ?? (i === 0 ? (all.label ?? entry.label) : undefined),
          items: i === 0 ? [...links, ...section.items] : section.items,
        }),
      )
      if (all.sections.length === 0 && links.length)
        push(entry.type ?? "target", el, { label: entry.label, items: links })
      entity = true
    } else if (resolver && el instanceof HTMLElement) {
      const out = normalize(
        resolver(el, { ...ctx, id: el.getAttribute("data-ctx-id") }),
      )
      const href = el.getAttribute("data-ctx-href")
      const links = href ? build.entityLinks(href, ctx) : []
      if (href) entityHrefs.add(absoluteUrl(href))
      out?.sections.forEach((section, i) =>
        push(marker!, el, {
          label: section.label ?? (i === 0 ? out.label : undefined),
          items: i === 0 ? [...links, ...section.items] : section.items,
        }),
      )
      entity = Boolean(out?.sections.length)
    }
    if (entry?.suppress?.length) suppressors.push({ el, kinds: entry.suppress })

    const hit = detectNative(el)
    if (!hit || seen.has(hit.kind)) continue
    // The element is itself a registered target: its items say it better.
    if (entity && (hit.kind === "button" || hit.kind === "link")) continue
    if (hit.kind === "image" && isTiny(el)) continue
    seen.add(hit.kind)
    if (hit.kind === "table") {
      hit.row = target.closest("tr")
      hit.cell = target.closest("td, th")
    }
    push(hit.kind, el, build.native(hit, ctx))
  }

  // A row's covering link is the row's own page: the entity has it.
  const kept = layers.filter(
    (l) =>
      !(
        l.kind === "link" &&
        l.el instanceof HTMLAnchorElement &&
        entityHrefs.has(absoluteUrl(l.el.getAttribute("href") ?? ""))
      ) &&
      // Covered by a target around it (`suppress`).
      !suppressors.some(
        (s) => l.el && s.kinds.includes(l.kind) && s.el.contains(l.el),
      ),
  )

  push("page", null, build.page({ ...base, el: target }, kept.length === 0))
  const page = layers[layers.length - 1]
  if (page?.kind === "page") kept.push(page)
  return { native: false, layers: kept }
}

function normalize(
  out: ReturnType<NonNullable<ReturnType<typeof typeResolver>>>,
): { label?: string; sections: CtxSection[] } | null {
  if (!out) return null
  if (Array.isArray(out)) return { sections: sectionsOf(out) }
  return { label: out.label, sections: sectionsOf(out.items) }
}

import type { AccessLevel } from "@/shared/config/access"
import type { ComponentType } from "react"

/** An icon component (lucide / remix wrappers): gets a className. */
export type CtxIcon = ComponentType<{ className?: string }>

/** Where and on what the menu was opened; handed to item builders. */
export type CtxContext = {
  /** The element the pointer was on (or the focused one, from the keyboard). */
  target: Element
  /** The element this layer belongs to (a ContextTarget / data-ctx element). */
  el: Element
  /** Viewport point the menu opened at. */
  x: number
  y: number
  /** Text selected when the menu opened ("" when none). */
  selectionText: string
  /** The viewer's access level; null on public pages (client report, portal). */
  access: AccessLevel | null
  /** Opened from the keyboard (Shift+F10 / the ContextMenu key). */
  keyboard: boolean
}

/**
 * One row of the menu. Only `id` and `label` are required.
 *
 * - `onSelect` runs after the menu closes (focus is back on the page), so it
 *   can focus fields, open dialogs, navigate. A rejected promise shows a
 *   toast.
 * - `destructive` paints it red; with `confirm`, the first click turns the
 *   row into "Klik lagi buat …" and only the second runs it (a string is the
 *   confirm text). Skip `confirm` when `onSelect` opens its own dialog.
 * - `checked` + `role` makes a checkbox or radio row (its check shown).
 * - `submenu`: items, or a loader called when the submenu first opens
 *   (a spinner shows meanwhile; nothing loads before that).
 * - `access`: only these levels see it (null access = hidden).
 */
export type CtxItem = {
  id: string
  label: string
  icon?: CtxIcon
  /** A shortcut hint, e.g. "Mod+C", "Shift+Enter", "⌘K" ("Mod" = ⌘ / Ctrl). */
  shortcut?: string
  /** Muted text after the label (a URL, a count). */
  hint?: string
  onSelect?: (ctx: CtxContext) => void | Promise<unknown>
  disabled?: boolean
  destructive?: boolean
  confirm?: boolean | string
  checked?: boolean
  role?: "checkbox" | "radio"
  submenu?: CtxItem[] | (() => Promise<CtxItem[]>)
  access?: AccessLevel[]
  hidden?: boolean
  /** Keep the menu open after selecting (toggles). */
  keepOpen?: boolean
  /** Extra words the type-to-filter matches. */
  keywords?: string
}

/** A labelled run of items (a layer may hand back several). */
export type CtxSection = { label?: string; items: CtxItem[] }

/** What a target / type resolver returns: items, or sections of items. */
export type CtxItems = CtxItem[] | CtxSection[]

/** One resolved layer: a group in the menu, most specific first. */
export type CtxLayer = {
  /** Unique within one opening (used as React key). */
  key: string
  /**
   * What it is: "selection", "link", "image", "field", "page", or a
   * registered type ("project", "doc-block", …).
   */
  kind: string
  label?: string
  items: CtxItem[]
  /** The element it came from (null for selection / page). */
  el: Element | null
}

/** Registered under a data-ctx type: turns a marked element into items. */
export type CtxTypeResolver = (
  el: HTMLElement,
  ctx: CtxContext & { id: string | null },
) => { label?: string; items: CtxItems } | CtxItems | null | undefined

/** A React-registered target (ContextTarget / useContextTarget). */
export type CtxTargetEntry = {
  type?: string
  id?: string
  label?: string
  /** The entity's page: adds Buka / Buka di tab baru / Salin link and
   *  hides the generic link layer for the same address. */
  href?: string
  items?: (ctx: CtxContext) => CtxItems | null | undefined
  /**
   * Generic layers of these kinds found inside it are dropped (its own
   * items cover them), e.g. the doc editor's pictures: ["image"].
   */
  suppress?: string[]
}

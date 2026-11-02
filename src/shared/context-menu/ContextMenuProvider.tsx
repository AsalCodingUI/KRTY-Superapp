"use client"

import { Menu } from "@base-ui/react/menu"
import {
  ImageLightbox,
  LIGHTBOX_IMAGES,
  type LightboxImage,
} from "@/components/image-lightbox"
import {
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import type { AccessLevel } from "@/shared/config/access"
import { useLocale, useSetLocale, useT } from "@/shared/i18n/client"
import { Search } from "lucide-react"
import { useThemeTransition } from "@/shared/hooks/useThemeTransition"
import { useRouter } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"
import { formatShortcut, selectionAt, snapshotField } from "./actions"
import { detectTokenAt, textAtPoint } from "./detect"
import { openAppSearch } from "./events"
import { createBuilders, type CtxEnv } from "./generic-items"
import { resolveLayers, visibleItems, type ResolveInput } from "./resolve"
import type { CtxContext, CtxItem, CtxLayer } from "./types"

// ---------------------------------------------------------------------------
// Scope: what the page around the menu offers
// ---------------------------------------------------------------------------

export type ContextMenuScope = {
  /** The viewer's level; null = signed out (client report, portal). */
  access: AccessLevel | null
  /** Inside KRTY for Mac. */
  desktop: boolean
  /** The ⌘K search is mounted. */
  search: boolean
}

const PUBLIC_SCOPE: ContextMenuScope = {
  access: null,
  desktop: false,
  search: false,
}

const ScopeContext = createContext<(scope: ContextMenuScope | null) => void>(
  () => undefined,
)

/** For a layout to say what its pages offer (see ContextMenuAppScope). */
export function useSetContextMenuScope() {
  return useContext(ScopeContext)
}

// ---------------------------------------------------------------------------
// Opening
// ---------------------------------------------------------------------------

type Opened = {
  open: boolean
  x: number
  y: number
  layers: CtxLayer[]
  ctx: CtxContext
  input: ResolveInput
  /** Long enough for type-to-filter. */
  filterable: boolean
  /** Focus before opening (back there on Esc). */
  returnFocus: HTMLElement | null
  touch: boolean
  id: number
}

const LONG_PRESS_MS = 500
const FILTER_MIN_ITEMS = 10

const POPUP =
  "bg-popover text-popover-foreground data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 nest-rounded-2xl nest-p-2 max-h-(--available-height) w-max min-w-52 max-w-[min(22rem,var(--available-width))] origin-(--transform-origin) no-scrollbar overflow-x-hidden overflow-y-auto shadow-(--elev-4) duration-150 ease-out outline-none data-closed:overflow-hidden"

/** The topmost contentEditable host above `el`. */
function editableHost(el: Element) {
  let host = el.closest<HTMLElement>(
    '[contenteditable]:not([contenteditable="false"])',
  )
  while (host) {
    const up = host.parentElement?.closest<HTMLElement>(
      '[contenteditable]:not([contenteditable="false"])',
    )
    if (!up) break
    host = up
  }
  return host
}

/** Where to open for the focused element (keyboard): the caret, else its corner. */
function keyboardPoint(el: Element) {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
    const r = sel.getRangeAt(0).getBoundingClientRect()
    if (r.width || r.height) return { x: r.left, y: r.bottom }
  }
  const r = el.getBoundingClientRect()
  return {
    x: r.left + Math.min(16, r.width / 2),
    y: r.top + Math.min(r.height, 32),
  }
}

const count = (layers: CtxLayer[]) =>
  layers.reduce((n, l) => n + l.items.length, 0)

/** Items flattened for type-to-filter ("Halaman › Muat ulang"). */
function flatten(layers: CtxLayer[]) {
  const out: { item: CtxItem; key: string; text: string }[] = []
  const walk = (items: CtxItem[], prefix: string, key: string) => {
    for (const item of items) {
      const label = prefix ? `${prefix} › ${item.label}` : item.label
      const k = `${key}/${item.id}`
      if (Array.isArray(item.submenu)) walk(item.submenu, label, k)
      else if (!item.submenu)
        out.push({
          item: { ...item, label },
          key: k,
          text: `${label} ${item.keywords ?? ""} ${item.hint ?? ""}`.toLowerCase(),
        })
    }
  }
  for (const layer of layers) walk(layer.items, "", layer.key)
  return out
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * The right-click menu for everything under it. Mount once, high up
 * (the root layout). See ./index.ts for how it decides what to show.
 */
export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const t = useT("ctxmenu")
  const locale = useLocale()
  const setLocale = useSetLocale()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useThemeTransition()
  const [scope, setScope] = useState<ContextMenuScope | null>(null)
  const [opened, setOpened] = useState<Opened | null>(null)
  const [query, setQuery] = useState("")
  const [confirming, setConfirming] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{
    images: LightboxImage[]
    index: number
  } | null>(null)
  const ranAction = useRef(false)
  const pendingFocus = useRef<HTMLElement | null>(null)
  const lastOpen = useRef(0)

  const effective = scope ?? PUBLIC_SCOPE

  /** Everything the generic items need, read fresh at each opening. */
  const envRef = useRef<Omit<CtxEnv, "field">>(null!)
  envRef.current = {
    t,
    desktop: effective.desktop,
    search: effective.search,
    locale: locale === "en" ? "en" : "id",
    dark: resolvedTheme === "dark",
    setDark: (dark) => setTheme(dark ? "dark" : "light"),
    setLocale,
    navigate: (href) => router.push(href),
    openSearch: openAppSearch,
    openLightbox: (img) => {
      const root =
        img.closest(".ProseMirror, [data-lightbox-root], article, main") ??
        document.body
      const els = [...root.querySelectorAll<HTMLImageElement>(LIGHTBOX_IMAGES)]
      const src = (el: HTMLImageElement) =>
        el.getAttribute("data-lightbox-src") || el.currentSrc || el.src
      const index = els.indexOf(img)
      setLightbox(
        index >= 0
          ? { images: els.map((el) => ({ src: src(el), alt: el.alt })), index }
          : { images: [{ src: src(img), alt: img.alt }], index: 0 },
      )
    },
    openExternal: (url) => {
      const tauri = (
        window as unknown as {
          __TAURI__?: {
            core: { invoke: (c: string, a?: object) => Promise<unknown> }
          }
        }
      ).__TAURI__
      if (tauri)
        void tauri.core.invoke("open_external", { url }).catch(() => undefined)
      else window.open(url, "_blank", "noopener")
    },
    toast: { ok: (m) => toast.success(m), err: (m) => toast.error(m) },
  }

  /** Works out the menu for a target; false = leave it to the browser. */
  const openAt = useCallback(
    (
      target: Element,
      x: number,
      y: number,
      keyboard: boolean,
      touch: boolean,
      onlyEntities = false,
    ) => {
      const env = envRef.current
      const sel = selectionAt(x, y, target, keyboard)
      let token = null
      if (!keyboard) {
        const at = textAtPoint(x, y)
        // Only when the text under the pointer is inside the target.
        if (at) token = detectTokenAt(at.text, at.offset)
      }
      const fieldEl =
        target.closest<HTMLElement>("input, textarea") ?? editableHost(target)
      const field = fieldEl ? snapshotField(fieldEl) : null
      const builders = createBuilders({ ...env, field })
      const input: ResolveInput = {
        target,
        x,
        y,
        selectionText: sel.text,
        onSelection: sel.onSelection,
        token,
        access: scopeRef.current?.access ?? null,
        keyboard,
      }
      const resolved = resolveLayers(input, builders)
      if (resolved.native) return false
      if (
        onlyEntities &&
        !resolved.layers.some(
          (l) => l.el && l.kind !== "page" && !NATIVE_KINDS.has(l.kind),
        )
      )
        return false
      const active = document.activeElement
      ranAction.current = false
      lastOpen.current = Date.now()
      setQuery("")
      setConfirming(null)
      setOpened((prev) => ({
        open: true,
        x,
        y,
        layers: resolved.layers,
        ctx: {
          target,
          el: target,
          x,
          y,
          selectionText: sel.text,
          access: input.access,
          keyboard,
        },
        input,
        filterable: count(resolved.layers) >= FILTER_MIN_ITEMS,
        returnFocus:
          active instanceof HTMLElement && active !== document.body
            ? active
            : null,
        touch,
        id: (prev?.id ?? 0) + 1,
      }))
      return true
    },
    [],
  )
  const scopeRef = useRef(scope)
  scopeRef.current = scope

  const close = useCallback(() => {
    setOpened((o) => (o && o.open ? { ...o, open: false } : o))
  }, [])

  // Right-click, the keyboard, a long press.
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      // ⇧ / ⌥ + right-click: the browser's own menu.
      if (e.shiftKey || e.altKey) return
      // Someone nearer handled it (their own menu).
      if (e.defaultPrevented) return
      const node = e.target as Node | null
      const target =
        node instanceof Element ? node : (node?.parentElement ?? null)
      if (!target) return
      if (target.closest("[data-ctxmenu-popup]")) {
        e.preventDefault()
        return
      }
      // The second event of one long press (Android sends both).
      if (Date.now() - lastOpen.current < 400) {
        e.preventDefault()
        return
      }
      const pointerType = (e as PointerEvent).pointerType
      const fromKeyboard =
        e.button !== 2 && !pointerType && e.clientX === 0 && e.clientY === 0
      let x = e.clientX
      let y = e.clientY
      let el = target
      if (fromKeyboard) {
        el = (document.activeElement as Element | null) ?? target
        ;({ x, y } = keyboardPoint(el))
      }
      if (openAt(el, x, y, fromKeyboard, pointerType === "touch"))
        e.preventDefault()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const isMenuKey =
        e.key === "ContextMenu" ||
        (e.key === "F10" && e.shiftKey && !e.metaKey && !e.ctrlKey)
      if (!isMenuKey || e.defaultPrevented) return
      const el = (document.activeElement as Element | null) ?? document.body
      if (el.closest("[data-ctxmenu-popup]")) return
      const { x, y } = keyboardPoint(el)
      if (openAt(el, x, y, true, false)) e.preventDefault()
    }

    // iOS sends no contextmenu on a long press: open for registered
    // things (rows, cards), leaving text and links to the system.
    let timer = 0
    let start: { x: number; y: number; target: Element } | null = null
    const cancel = () => {
      window.clearTimeout(timer)
      start = null
    }
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || !(e.target instanceof Element)) return
      cancel()
      start = { x: e.clientX, y: e.clientY, target: e.target }
      timer = window.setTimeout(() => {
        const s = start
        start = null
        if (!s || Date.now() - lastOpen.current < 600) return
        if (openAt(s.target, s.x, s.y, false, true, true)) {
          // The release mustn't also follow the link under the finger.
          const swallow = (ev: Event) => {
            ev.preventDefault()
            ev.stopPropagation()
          }
          window.addEventListener("click", swallow, {
            capture: true,
            once: true,
          })
          window.setTimeout(
            () => window.removeEventListener("click", swallow, true),
            800,
          )
        }
      }, LONG_PRESS_MS)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8)
        cancel()
    }

    document.addEventListener("contextmenu", onContextMenu)
    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("pointerdown", onPointerDown, { passive: true })
    document.addEventListener("pointermove", onPointerMove, { passive: true })
    document.addEventListener("pointerup", cancel)
    document.addEventListener("pointercancel", cancel)
    return () => {
      cancel()
      document.removeEventListener("contextmenu", onContextMenu)
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("pointermove", onPointerMove)
      document.removeEventListener("pointerup", cancel)
      document.removeEventListener("pointercancel", cancel)
    }
  }, [openAt])

  // Scrolling or resizing the page closes it (not scrolling the menu).
  const isOpen = Boolean(opened?.open)
  useEffect(() => {
    if (!isOpen) return
    const onScroll = (e: Event) => {
      const el = e.target
      if (el instanceof Element && el.closest("[data-ctxmenu-popup]")) return
      close()
    }
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", close)
    window.addEventListener("blur", close)
    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", close)
      window.removeEventListener("blur", close)
    }
  }, [isOpen, close])

  const anchor = useMemo(
    () =>
      opened && {
        getBoundingClientRect: () =>
          DOMRect.fromRect({ x: opened.x, y: opened.y, width: 0, height: 0 }),
      },
    [opened],
  )

  const run = useCallback(
    (item: CtxItem, path: string) => {
      if (item.disabled || !opened) return
      if (item.confirm && confirming !== path) {
        setConfirming(path)
        return
      }
      ranAction.current = true
      if (item.keepOpen) {
        // Rebuilt after the change lands, so checks show the new state.
        window.setTimeout(() => {
          const o = opened
          if (o) openAt(o.input.target, o.x, o.y, o.input.keyboard, o.touch)
        }, 0)
      } else close()
      const fail = () => toast.error(t("actionFailed"))
      try {
        const out = item.onSelect?.(opened.ctx)
        // An action that focused something on the page (a field) keeps it
        // once the menu has gone.
        const now = document.activeElement
        pendingFocus.current =
          now instanceof HTMLElement && !now.closest("[data-ctxmenu-popup]")
            ? now
            : null
        // The menu takes focus back as the click finishes: return it.
        const keep = pendingFocus.current
        if (keep)
          window.setTimeout(() => {
            if (keep.isConnected && document.activeElement !== keep)
              keep.focus({ preventScroll: true })
          }, 0)
        if (out && typeof (out as Promise<unknown>).then === "function")
          (out as Promise<unknown>).catch(fail)
      } catch {
        fail()
      }
    },
    [opened, confirming, close, openAt, t],
  )

  const value = useMemo(() => setScope, [])
  const layers = opened?.layers
  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!q || !layers) return null
    const words = q.split(/\s+/)
    return flatten(layers).filter((f) => words.every((w) => f.text.includes(w)))
  }, [q, layers])

  const onKeyDownCapture = (e: React.KeyboardEvent) => {
    if (!opened?.filterable) return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === "Backspace" && query) {
      e.preventDefault()
      e.stopPropagation()
      setQuery((s) => s.slice(0, -1))
    } else if (e.key === "Escape" && query) {
      e.preventDefault()
      e.stopPropagation()
      setQuery("")
    } else if (e.key.length === 1 && (e.key !== " " || query)) {
      e.preventDefault()
      e.stopPropagation()
      setQuery((s) => s + e.key)
    }
  }

  const coarse =
    typeof window !== "undefined" &&
    window.matchMedia?.("(pointer: coarse)").matches

  return (
    <ScopeContext.Provider value={value}>
      {children}
      {opened && anchor && (
        <Menu.Root
          key={opened.id}
          open={opened.open}
          modal={false}
          onOpenChange={(open) => {
            if (!open) close()
          }}
          onOpenChangeComplete={(open) => {
            if (open) return
            const f = pendingFocus.current
            pendingFocus.current = null
            if (f?.isConnected && document.activeElement !== f)
              f.focus({ preventScroll: true })
            setOpened((o) => (o && !o.open ? null : o))
          }}
        >
          <Menu.Portal>
            <Menu.Positioner
              anchor={anchor}
              side="bottom"
              align="start"
              sideOffset={2}
              collisionPadding={8}
              // Always dark (inverted on a light page), like a system menu.
              className="dark isolate z-[80] [color-scheme:dark] outline-none"
            >
              <Menu.Popup
                data-ctxmenu-popup
                aria-label={t("menuLabel")}
                className={POPUP}
                onKeyDownCapture={onKeyDownCapture}
                finalFocus={(type) =>
                  !ranAction.current &&
                  type === "keyboard" &&
                  opened.returnFocus?.isConnected
                    ? opened.returnFocus
                    : false
                }
              >
                {q && (
                  <div className="text-muted-foreground flex items-center gap-2 px-2 pt-1 pb-1.5 text-xs">
                    <Search className="size-3.5" />
                    <span className="text-foreground truncate font-medium">
                      {query}
                    </span>
                  </div>
                )}
                {filtered ? (
                  filtered.length === 0 ? (
                    <p className="text-muted-foreground px-2 py-1.5 text-sm">
                      {t("filterEmpty")}
                    </p>
                  ) : (
                    filtered.map((f) => (
                      <Row
                        key={f.key}
                        item={f.item}
                        path={f.key}
                        run={run}
                        confirming={confirming}
                        access={opened.ctx.access}
                        icons
                      />
                    ))
                  )
                ) : (
                  (layers ?? []).map((layer, i) => (
                    <LayerGroup
                      key={layer.key}
                      layer={layer}
                      first={i === 0}
                      run={run}
                      confirming={confirming}
                      access={opened.ctx.access}
                    />
                  ))
                )}
                {!opened.touch && !coarse && (
                  <>
                    <DropdownMenuSeparator />
                    <p className="text-muted-foreground/80 flex justify-between gap-3 px-2 pt-0.5 pb-0.5 text-[11px] leading-4 select-none">
                      <span>{t("nativeHint")}</span>
                      {opened.filterable && !q && (
                        <span className="text-muted-foreground/60">
                          {t("filterPlaceholder")}
                        </span>
                      )}
                    </p>
                  </>
                )}
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      )}
      <ImageLightbox
        images={lightbox?.images ?? []}
        index={lightbox?.index ?? null}
        onIndex={(i) =>
          setLightbox((s) => (s && i !== null ? { ...s, index: i } : null))
        }
      />
    </ScopeContext.Provider>
  )
}

const NATIVE_KINDS = new Set([
  "selection",
  "link",
  "image",
  "video",
  "audio",
  "field",
  "code",
  "table",
  "button",
  "email",
  "phone",
  "date",
  "url",
])

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

type RunFn = (item: CtxItem, path: string) => void

function LayerGroup({
  layer,
  first,
  run,
  confirming,
  access,
}: {
  layer: CtxLayer
  first: boolean
  run: RunFn
  confirming: string | null
  access: AccessLevel | null
}) {
  const icons = layer.items.some((i) => i.icon)
  return (
    <>
      {!first && <DropdownMenuSeparator />}
      <DropdownMenuGroup>
        {layer.label && (
          <DropdownMenuLabel className="max-w-full truncate">
            {layer.label}
          </DropdownMenuLabel>
        )}
        {layer.items.map((item) => (
          <Row
            key={item.id}
            item={item}
            path={`${layer.key}/${item.id}`}
            run={run}
            confirming={confirming}
            access={access}
            icons={icons}
          />
        ))}
      </DropdownMenuGroup>
    </>
  )
}

function Row({
  item,
  path,
  run,
  confirming,
  access,
  icons,
}: {
  item: CtxItem
  path: string
  run: RunFn
  confirming: string | null
  access: AccessLevel | null
  icons: boolean
}) {
  const t = useT("ctxmenu")
  const Icon = item.icon
  const pending = item.confirm && confirming === path
  const label = pending
    ? typeof item.confirm === "string"
      ? item.confirm
      : t("confirmAgain", { label: item.label.toLowerCase() })
    : item.label
  const body = (
    <>
      {Icon ? <Icon /> : icons ? <span className="size-4 shrink-0" /> : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {item.hint && !pending && (
        <span className="text-muted-foreground max-w-36 shrink truncate text-xs">
          {item.hint}
        </span>
      )}
    </>
  )

  if (item.submenu) {
    return (
      <Menu.SubmenuRoot>
        <DropdownMenuSubTrigger disabled={item.disabled}>
          {body}
        </DropdownMenuSubTrigger>
        <Menu.Portal>
          <Menu.Positioner
            side="right"
            align="start"
            alignOffset={-6}
            sideOffset={2}
            collisionPadding={8}
            // Always dark (inverted on a light page), like a system menu.
            className="dark isolate z-[80] [color-scheme:dark] outline-none"
          >
            <Menu.Popup data-ctxmenu-popup className={cn(POPUP, "min-w-44")}>
              {Array.isArray(item.submenu) ? (
                <ItemList
                  items={item.submenu}
                  path={path}
                  run={run}
                  confirming={confirming}
                  access={access}
                />
              ) : (
                <AsyncItems
                  load={item.submenu}
                  path={path}
                  run={run}
                  confirming={confirming}
                  access={access}
                />
              )}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.SubmenuRoot>
    )
  }

  const shortcut = item.shortcut && !pending && (
    <DropdownMenuShortcut className="pl-3">
      {formatShortcut(item.shortcut)}
    </DropdownMenuShortcut>
  )

  if (item.role) {
    return (
      <DropdownMenuCheckboxItem
        checked={Boolean(item.checked)}
        role={item.role === "radio" ? "menuitemradio" : "menuitemcheckbox"}
        disabled={item.disabled}
        closeOnClick={!item.keepOpen}
        onCheckedChange={() => run(item, path)}
      >
        {body}
      </DropdownMenuCheckboxItem>
    )
  }

  return (
    <DropdownMenuItem
      variant={item.destructive ? "destructive" : "default"}
      disabled={item.disabled}
      closeOnClick={!(item.keepOpen || (item.confirm && !pending))}
      onClick={() => run(item, path)}
      className={cn(pending && "font-medium")}
    >
      {body}
      {shortcut}
    </DropdownMenuItem>
  )
}

function ItemList({
  items,
  path,
  run,
  confirming,
  access,
}: {
  items: CtxItem[]
  path: string
  run: RunFn
  confirming: string | null
  access: AccessLevel | null
}) {
  const icons = items.some((i) => i.icon)
  return items.map((item) => (
    <Row
      key={item.id}
      item={item}
      path={`${path}/${item.id}`}
      run={run}
      confirming={confirming}
      access={access}
      icons={icons}
    />
  ))
}

/** Loaded when the submenu opens; a spinner meanwhile. Kept per opening. */
const asyncCache = new WeakMap<() => Promise<CtxItem[]>, CtxItem[]>()

function AsyncItems({
  load,
  ...rest
}: {
  load: () => Promise<CtxItem[]>
  path: string
  run: RunFn
  confirming: string | null
  access: AccessLevel | null
}) {
  const t = useT("ctxmenu")
  const [state, setState] = useState<CtxItem[] | "loading" | "error">(
    () => asyncCache.get(load) ?? "loading",
  )
  useEffect(() => {
    if (asyncCache.has(load)) return
    let live = true
    load().then(
      (items) => {
        const visible = visibleItems(items, rest.access)
        asyncCache.set(load, visible)
        if (live) setState(visible)
      },
      () => live && setState("error"),
    )
    return () => {
      live = false
    }
  }, [load, rest.access])
  if (state === "loading")
    return (
      <div className="text-muted-foreground flex min-h-8 items-center gap-2 px-2 text-sm">
        <Spinner className="size-4" />
        {t("loading")}
      </div>
    )
  if (state === "error" || state.length === 0)
    return (
      <p className="text-muted-foreground px-2 py-1.5 text-sm">
        {state === "error" ? t("loadFailed") : t("filterEmpty")}
      </p>
    )
  return <ItemList items={state} {...rest} />
}

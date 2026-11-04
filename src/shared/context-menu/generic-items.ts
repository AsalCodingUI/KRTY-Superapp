import type { Vars } from "@/shared/i18n/config"
import type { MessageKey } from "@/shared/i18n/messages"
import {
  ArrowLeft,
  ArrowRight,
  AppWindow,
  ClipboardPaste,
  Code,
  Copy,
  Download,
  Eraser,
  ExternalLink,
  FileText,
  Globe,
  Image as ImageIcon,
  Languages,
  Link as LinkIcon,
  Mail,
  Maximize,
  Maximize2,
  MessageCircle,
  Moon,
  MousePointerClick,
  Pause,
  Phone,
  Play,
  Redo2,
  RotateCw,
  Scissors,
  Search,
  Table,
  TextCursorInput,
  Undo2,
  VolumeX,
} from "@/components/icons"
import { runUndo, undoManager } from "@/shared/undo/store"
import {
  clearField,
  copyImage,
  copyText,
  download,
  formatShortcut,
  insertText,
  selectAll,
  selectedTextOf,
  type FieldSnapshot,
  restoreField,
} from "./actions"
import { rowToTsv, tableToTsv, waNumber, type NativeHit } from "./detect"
import type { LayerBuilders } from "./resolve"
import type { CtxItem } from "./types"

export type CtxT = (key: MessageKey<"ctxmenu">, vars?: Vars) => string

/** What the generic items can do; the provider fills it in. */
export type CtxEnv = {
  t: CtxT
  /** Inside KRTY for Mac (no tabs; "Buka di browser" instead). */
  desktop: boolean
  /** The ⌘K search is on this page. */
  search: boolean
  locale: "id" | "en"
  dark: boolean
  setDark: (dark: boolean) => void
  setLocale: (locale: "id" | "en") => void
  navigate: (href: string) => void
  openSearch: (query: string) => void
  openLightbox: (img: HTMLImageElement) => void
  /** Opens outside the app: the browser in the shell, a new tab on the web. */
  openExternal: (url: string) => void
  toast: { ok: (msg: string) => void; err: (msg: string) => void }
  /** The field's selection at the moment the menu opened. */
  field: FieldSnapshot | null
}

const short = (s: string, n = 28) =>
  s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s

/** Copy, with a toast either way. */
async function copyWith(env: CtxEnv, text: string, ok = env.t("copied")) {
  if (await copyText(text)) env.toast.ok(ok)
  else env.toast.err(env.t("copyFailed"))
}

/** "Buka", "Buka di tab baru" (or "Buka di browser"), "Salin link". */
export function linkItems(
  env: CtxEnv,
  href: string,
  internal: boolean,
): CtxItem[] {
  const { t } = env
  const abs = new URL(href, window.location.origin)
  const items: CtxItem[] = [
    {
      id: "open",
      label: t("open"),
      icon: internal ? FileText : ExternalLink,
      onSelect: () => {
        if (internal) env.navigate(abs.pathname + abs.search + abs.hash)
        else window.open(abs.href, "_blank", "noopener")
      },
    },
  ]
  // An in-app tab (widgets/app-tabs listens), on the web and in the app.
  if (internal)
    items.push({
      id: "open-tab",
      label: t("openNewTab"),
      icon: AppWindow,
      shortcut: "Mod+Click",
      onSelect: () =>
        void window.dispatchEvent(
          new CustomEvent("krty:open-tab", {
            detail: { url: abs.pathname + abs.search },
          }),
        ),
    })
  if (env.desktop)
    items.push({
      id: "open-browser",
      label: t("openInBrowser"),
      icon: Globe,
      onSelect: () => env.openExternal(abs.href),
    })
  items.push({
    id: "copy-link",
    label: t("copyLink"),
    icon: LinkIcon,
    onSelect: () => copyWith(env, abs.href, t("linkCopied")),
  })
  return items
}

function searchItem(env: CtxEnv, text: string): CtxItem {
  return {
    id: "search",
    label: env.t("searchApp", { text: short(text.replace(/\s+/g, " "), 24) }),
    icon: Search,
    shortcut: "Mod+K",
    hidden: !env.search,
    onSelect: () => env.openSearch(text.replace(/\s+/g, " ").slice(0, 120)),
  }
}

function fieldItems(
  env: CtxEnv,
  hit: Extract<NativeHit, { kind: "field" }>,
): CtxItem[] {
  const { t } = env
  const snap = env.field?.el === hit.el ? env.field : null
  if (!snap) return []
  const selected = selectedTextOf(snap)
  const hasSel = selected.length > 0
  const writable = !hit.readOnly
  const items: CtxItem[] = [
    {
      id: "cut",
      label: t("cut"),
      icon: Scissors,
      shortcut: "Mod+X",
      disabled: !hasSel || !writable || hit.password,
      onSelect: async () => {
        restoreField(snap)
        if (snap.kind === "rich" && document.execCommand("cut")) return
        if (await copyText(selected)) insertText(snap, "")
      },
    },
    {
      id: "copy",
      label: t("copy"),
      icon: Copy,
      shortcut: "Mod+C",
      disabled: !hasSel || hit.password,
      onSelect: async () => {
        restoreField(snap)
        // Rich text keeps its formatting through the browser's own copy.
        if (snap.kind === "rich" && document.execCommand("copy")) return
        await copyWith(env, selected)
      },
    },
    {
      id: "paste",
      label: t("paste"),
      icon: ClipboardPaste,
      shortcut: "Mod+V",
      disabled: !writable,
      onSelect: async () => {
        if (snap.kind === "rich") {
          // The editor's own paste handling (formatting, links, mentions).
          try {
            const items = await navigator.clipboard.read()
            const data = new DataTransfer()
            for (const item of items)
              for (const type of item.types)
                if (type === "text/html" || type === "text/plain")
                  data.setData(type, await (await item.getType(type)).text())
            restoreField(snap)
            const event = new ClipboardEvent("paste", {
              clipboardData: data,
              bubbles: true,
              cancelable: true,
            })
            const handled = !snap.el.dispatchEvent(event)
            if (handled) return
            insertText(snap, data.getData("text/plain"))
            return
          } catch {
            // Fall through to plain text.
          }
        }
        try {
          const text = await navigator.clipboard.readText()
          insertText(snap, text)
        } catch {
          env.toast.err(t("pasteFailed"))
        }
      },
    },
    {
      id: "select-all",
      label: t("selectAll"),
      icon: TextCursorInput,
      shortcut: "Mod+A",
      onSelect: () => selectAll(snap),
    },
  ]
  if (snap.kind === "input")
    items.push({
      id: "clear",
      label: t("clearField"),
      icon: Eraser,
      disabled: !writable || !snap.el.value,
      onSelect: () => clearField(snap),
    })
  return items
}

/** Builders for the generic layers, in this app's words. */
export function createBuilders(env: CtxEnv): LayerBuilders {
  const { t } = env
  return {
    selection: (text, ctx) => {
      const inField = Boolean(
        ctx.target.closest(
          "input, textarea, [contenteditable]:not([contenteditable=false])",
        ),
      )
      return {
        label: t("groupSelection"),
        items: [
          {
            id: "copy-selection",
            label: t("copy"),
            icon: Copy,
            shortcut: "Mod+C",
            // Fields have their own Salin (with formatting).
            hidden: inField,
            onSelect: () => copyWith(env, text),
          },
          searchItem(env, text),
        ],
      }
    },

    token: (token) => {
      const v = token.value
      switch (token.kind) {
        case "email":
          return {
            label: `${t("groupEmail")} · ${short(v, 32)}`,
            items: [
              {
                id: "mailto",
                label: t("sendEmail"),
                icon: Mail,
                onSelect: () => void (window.location.href = `mailto:${v}`),
              },
              {
                id: "copy-email",
                label: t("copyEmail"),
                icon: Copy,
                onSelect: () => copyWith(env, v),
              },
            ],
          }
        case "phone":
          return {
            label: `${t("groupPhone")} · ${v}`,
            items: [
              {
                id: "wa",
                label: t("whatsapp"),
                icon: MessageCircle,
                onSelect: () =>
                  env.openExternal(`https://wa.me/${waNumber(v)}`),
              },
              {
                id: "tel",
                label: t("call"),
                icon: Phone,
                onSelect: () =>
                  void (window.location.href = `tel:${v.replace(/[^\d+]/g, "")}`),
              },
              {
                id: "copy-number",
                label: t("copyNumber"),
                icon: Copy,
                onSelect: () => copyWith(env, v),
              },
            ],
          }
        case "date":
          return {
            label: `${t("groupDate")} · ${v}`,
            items: [
              {
                id: "copy-date",
                label: t("copyDate"),
                icon: Copy,
                onSelect: () => copyWith(env, v),
              },
              searchItem(env, v),
            ],
          }
        case "url": {
          const href = /^https?:/i.test(v) ? v : `https://${v}`
          return {
            label: `${t("groupUrl")} · ${short(v, 32)}`,
            items: linkItems(env, href, false),
          }
        }
      }
    },

    native: (hit) => {
      switch (hit.kind) {
        case "link": {
          if (hit.scheme === "mailto") {
            const email = decodeURIComponent(hit.href.slice(7).split("?")[0])
            return {
              label: `${t("groupEmail")} · ${short(email, 32)}`,
              items: [
                {
                  id: "mailto",
                  label: t("sendEmail"),
                  icon: Mail,
                  onSelect: () => void (window.location.href = hit.href),
                },
                {
                  id: "copy-email",
                  label: t("copyEmail"),
                  icon: Copy,
                  onSelect: () => copyWith(env, email),
                },
              ],
            }
          }
          if (hit.scheme === "tel") {
            const number = decodeURIComponent(hit.href.slice(4))
            return {
              label: `${t("groupPhone")} · ${number}`,
              items: [
                {
                  id: "tel",
                  label: t("call"),
                  icon: Phone,
                  onSelect: () => void (window.location.href = hit.href),
                },
                {
                  id: "copy-number",
                  label: t("copyNumber"),
                  icon: Copy,
                  onSelect: () => copyWith(env, number),
                },
              ],
            }
          }
          if (hit.scheme !== "web") return null
          const items = linkItems(env, hit.href, hit.internal)
          if (hit.text && hit.text !== hit.href)
            items.push({
              id: "copy-link-text",
              label: t("copyLinkText"),
              icon: Copy,
              onSelect: () => copyWith(env, hit.text),
            })
          let host = ""
          try {
            const u = new URL(hit.href)
            host = hit.internal ? u.pathname : u.host
          } catch {
            host = hit.href
          }
          return { label: `${t("groupLink")} · ${short(host, 36)}`, items }
        }

        case "image":
          return {
            label: hit.alt
              ? `${t("groupImage")} · ${short(hit.alt, 30)}`
              : t("groupImage"),
            items: [
              {
                id: "view-large",
                label: t("viewLarge"),
                icon: Maximize2,
                onSelect: () => env.openLightbox(hit.el),
              },
              {
                id: "copy-image",
                label: t("copyImage"),
                icon: ImageIcon,
                onSelect: async () => {
                  if (await copyImage(hit.src)) env.toast.ok(t("imageCopied"))
                  else if (await copyText(hit.src))
                    env.toast.ok(t("imageCopyFallback"))
                  else env.toast.err(t("copyFailed"))
                },
              },
              {
                id: "copy-image-link",
                label: t("copyImageLink"),
                icon: LinkIcon,
                onSelect: () => copyWith(env, hit.src, t("linkCopied")),
              },
              {
                id: "download",
                label: t("download"),
                icon: Download,
                onSelect: () => {
                  env.toast.ok(t("downloadStarted"))
                  return download(hit.src, hit.alt || "image")
                },
              },
            ],
          }

        case "video":
        case "audio": {
          const media = hit.el
          const items: CtxItem[] = [
            {
              id: "play",
              label: media.paused ? t("play") : t("pause"),
              icon: media.paused ? Play : Pause,
              shortcut: "Space",
              onSelect: () =>
                media.paused
                  ? void media.play().catch(() => undefined)
                  : media.pause(),
            },
            {
              id: "mute",
              label: t("mute"),
              icon: VolumeX,
              role: "checkbox",
              checked: media.muted,
              onSelect: () => {
                media.muted = !media.muted
              },
            },
          ]
          if (hit.kind === "video")
            items.push({
              id: "fullscreen",
              label: t("fullscreen"),
              icon: Maximize,
              onSelect: () =>
                void media.requestFullscreen?.().catch(() => undefined),
            })
          if (hit.src && !hit.src.startsWith("blob:"))
            items.push(
              {
                id: "download",
                label: t("download"),
                icon: Download,
                onSelect: () => download(hit.src, hit.kind),
              },
              {
                id: "copy-link",
                label: t("copyLink"),
                icon: LinkIcon,
                onSelect: () => copyWith(env, hit.src, t("linkCopied")),
              },
            )
          return {
            label: hit.kind === "video" ? t("groupVideo") : t("groupAudio"),
            items,
          }
        }

        case "field":
          return {
            label: hit.mode === "rich" ? t("groupEdit") : t("groupField"),
            items: fieldItems(env, hit),
          }

        case "code":
          return {
            label: t("groupCode"),
            items: [
              {
                id: "copy-code",
                label: t("copyCode"),
                icon: Code,
                onSelect: () => copyWith(env, hit.text),
              },
            ],
          }

        case "table": {
          const items: CtxItem[] = []
          const cell = hit.cell
          if (cell?.textContent?.trim())
            items.push({
              id: "copy-cell",
              label: t("copyCell"),
              icon: Copy,
              onSelect: () =>
                copyWith(
                  env,
                  (cell.textContent ?? "").replace(/\s+/g, " ").trim(),
                ),
            })
          const row = hit.row
          if (row)
            items.push({
              id: "copy-row",
              label: t("copyRow"),
              icon: Copy,
              onSelect: () => copyWith(env, rowToTsv(row)),
            })
          items.push({
            id: "copy-table",
            label: t("copyTable"),
            icon: Table,
            onSelect: () => copyWith(env, tableToTsv(hit.el)),
          })
          return { label: t("groupTable"), items }
        }

        case "button":
          return {
            label: t("groupButton"),
            items: [
              {
                id: "click",
                label: t("runButton", { label: short(hit.label, 32) }),
                icon: MousePointerClick,
                shortcut: hit.shortcut
                  ? formatShortcut(hit.shortcut.split(" ")[0])
                  : undefined,
                disabled: hit.disabled,
                hint: hit.disabled ? t("buttonDisabled") : undefined,
                onSelect: () => hit.el.click(),
              },
            ],
          }
      }
    },

    entityLinks: (href) => {
      const abs = new URL(href, window.location.origin)
      return linkItems(env, abs.href, abs.origin === window.location.origin)
    },

    page: (_ctx, alone) => {
      // The app's undo / redo (shared/undo), when there's something to take back.
      const { undo, redo } = undoManager.getSnapshot()
      const items: CtxItem[] = [
        {
          id: "undo",
          label: t("undo"),
          icon: Undo2,
          shortcut: "Mod+Z",
          hint: undo ? short(undo.label) : undefined,
          hidden: !undo,
          keywords: "undo urungkan batal",
          onSelect: () => runUndo("undo"),
        },
        {
          id: "redo",
          label: t("redo"),
          icon: Redo2,
          shortcut: "Mod+Shift+Z",
          hint: redo ? short(redo.label) : undefined,
          hidden: !redo,
          keywords: "redo ulangi",
          onSelect: () => runUndo("redo"),
        },
        {
          id: "back",
          label: t("back"),
          icon: ArrowLeft,
          shortcut: env.desktop ? "Mod+[" : undefined,
          onSelect: () => window.history.back(),
        },
        {
          id: "forward",
          label: t("forward"),
          icon: ArrowRight,
          shortcut: env.desktop ? "Mod+]" : undefined,
          onSelect: () => window.history.forward(),
        },
        {
          id: "reload",
          label: t("reload"),
          icon: RotateCw,
          shortcut: "Mod+R",
          onSelect: () => window.location.reload(),
        },
        {
          id: "copy-page-link",
          label: t("copyPageLink"),
          icon: LinkIcon,
          onSelect: () => copyWith(env, window.location.href, t("linkCopied")),
        },
        {
          id: "open-browser",
          label: t("openInBrowser"),
          icon: Globe,
          hidden: !env.desktop,
          onSelect: () => env.openExternal(window.location.href),
        },
        {
          id: "dark",
          label: t("darkMode"),
          icon: Moon,
          role: "checkbox",
          checked: env.dark,
          onSelect: () => env.setDark(!env.dark),
        },
        {
          id: "language",
          label: t("language"),
          icon: Languages,
          hint: env.locale === "en" ? "English" : "Indonesia",
          submenu: [
            {
              id: "lang-id",
              label: "Indonesia",
              role: "radio",
              checked: env.locale === "id",
              onSelect: () => env.setLocale("id"),
            },
            {
              id: "lang-en",
              label: "English",
              role: "radio",
              checked: env.locale === "en",
              onSelect: () => env.setLocale("en"),
            },
          ],
        },
      ]
      if (alone) return { label: t("groupPage"), items }
      // Under everything else: one row that opens the page's items.
      return {
        items: [
          {
            id: "page",
            label: t("groupPage"),
            icon: FileText,
            keywords:
              "kembali back reload muat ulang tema dark bahasa language",
            submenu: items,
          },
        ],
      }
    },
  }
}

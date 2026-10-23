"use client"

import { cn } from "@/lib/utils"
import { Extension, type Editor, type Range } from "@tiptap/react"
import Suggestion, { type SuggestionProps } from "@tiptap/suggestion"
import {
  Code2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Table,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

export type BlockItem = {
  id: string
  title: string
  hint: string
  keywords: string
  icon: LucideIcon
  run: (editor: Editor, range?: Range) => void
}

/** Clears the "/query" text (when typed) before inserting the block. */
const at = (editor: Editor, range?: Range) =>
  range ? editor.chain().focus().deleteRange(range) : editor.chain().focus()

export const BLOCK_ITEMS: BlockItem[] = [
  {
    id: "text",
    title: "Teks",
    hint: "Paragraf biasa",
    keywords: "text paragraf p",
    icon: Pilcrow,
    run: (e, r) => at(e, r).setParagraph().run(),
  },
  {
    id: "h1",
    title: "Judul 1",
    hint: "Judul bagian besar",
    keywords: "heading h1 judul",
    icon: Heading1,
    run: (e, r) => at(e, r).setHeading({ level: 1 }).run(),
  },
  {
    id: "h2",
    title: "Judul 2",
    hint: "Judul bagian",
    keywords: "heading h2 subjudul",
    icon: Heading2,
    run: (e, r) => at(e, r).setHeading({ level: 2 }).run(),
  },
  {
    id: "h3",
    title: "Judul 3",
    hint: "Judul kecil",
    keywords: "heading h3",
    icon: Heading3,
    run: (e, r) => at(e, r).setHeading({ level: 3 }).run(),
  },
  {
    id: "bullet",
    title: "Daftar",
    hint: "Daftar berpoin",
    keywords: "list bullet poin ul",
    icon: List,
    run: (e, r) => at(e, r).toggleBulletList().run(),
  },
  {
    id: "ordered",
    title: "Daftar bernomor",
    hint: "Daftar 1, 2, 3",
    keywords: "list numbered nomor ol",
    icon: ListOrdered,
    run: (e, r) => at(e, r).toggleOrderedList().run(),
  },
  {
    id: "quote",
    title: "Kutipan",
    hint: "Catatan atau contoh kasus",
    keywords: "quote kutipan catatan callout",
    icon: Quote,
    run: (e, r) => at(e, r).toggleBlockquote().run(),
  },
  {
    id: "table",
    title: "Tabel",
    hint: "Tabel 3 × 3",
    keywords: "table tabel",
    icon: Table,
    run: (e, r) =>
      at(e, r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    id: "divider",
    title: "Garis pemisah",
    hint: "Pisahkan bagian",
    keywords: "divider hr garis pemisah",
    icon: Minus,
    run: (e, r) => at(e, r).setHorizontalRule().run(),
  },
  {
    id: "code",
    title: "Blok kode",
    hint: "Teks apa adanya",
    keywords: "code kode",
    icon: Code2,
    run: (e, r) => at(e, r).toggleCodeBlock().run(),
  },
]

function filterItems(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return BLOCK_ITEMS
  return BLOCK_ITEMS.filter((i) =>
    `${i.title} ${i.keywords}`.toLowerCase().includes(q),
  )
}

type MenuState = SuggestionProps<BlockItem, BlockItem> | null

/**
 * Bridges the suggestion plugin (outside React) to <SlashMenu>: the plugin
 * pushes its state in, the menu hands keyboard handling back.
 */
export function createSlashBridge() {
  let listener: ((s: MenuState) => void) | null = null
  let keyHandler: ((e: KeyboardEvent) => boolean) | null = null
  return {
    subscribe(fn: (s: MenuState) => void) {
      listener = fn
      return () => {
        listener = null
      }
    },
    setKeyHandler(fn: ((e: KeyboardEvent) => boolean) | null) {
      keyHandler = fn
    },
    emit(s: MenuState) {
      listener?.(s)
    },
    key(e: KeyboardEvent) {
      return keyHandler?.(e) ?? false
    },
  }
}

export type SlashBridge = ReturnType<typeof createSlashBridge>

export function SlashCommand(bridge: SlashBridge) {
  return Extension.create({
    name: "slashCommand",
    addProseMirrorPlugins() {
      return [
        Suggestion<BlockItem, BlockItem>({
          editor: this.editor,
          char: "/",
          // Not inside code, where "/" is just a character.
          allow: ({ state, range }) =>
            !state.doc.resolve(range.from).parent.type.spec.code,
          items: ({ query }) => filterItems(query),
          command: ({ editor, range, props }) => props.run(editor, range),
          render: () => ({
            onStart: (props) => bridge.emit(props),
            onUpdate: (props) => bridge.emit(props),
            onKeyDown: ({ event }) => {
              if (event.key === "Escape") {
                bridge.emit(null)
                return true
              }
              return bridge.key(event)
            },
            onExit: () => bridge.emit(null),
          }),
        }),
      ]
    },
  })
}

/** The "/" menu: block types, filtered as you type, arrows + Enter to pick. */
export function SlashMenu({ bridge }: { bridge: SlashBridge }) {
  const [state, setState] = useState<MenuState>(null)
  const [index, setIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(
    () =>
      bridge.subscribe((s) => {
        setState(s)
        setIndex(0)
      }),
    [bridge],
  )

  const items = useMemo(() => state?.items ?? [], [state])

  useEffect(() => {
    bridge.setKeyHandler((e) => {
      if (!state || items.length === 0) return false
      if (e.key === "ArrowDown") {
        setIndex((i) => (i + 1) % items.length)
        return true
      }
      if (e.key === "ArrowUp") {
        setIndex((i) => (i - 1 + items.length) % items.length)
        return true
      }
      if (e.key === "Enter" || e.key === "Tab") {
        state.command(items[index])
        return true
      }
      return false
    })
    return () => bridge.setKeyHandler(null)
  }, [bridge, state, items, index])

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${index}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [index])

  const rect = state?.clientRect?.()
  if (!state || !rect) return null

  // Open below the caret, or above when there is no room.
  const below = window.innerHeight - rect.bottom > 320
  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(rect.left, window.innerWidth - 288),
    ...(below
      ? { top: rect.bottom + 6 }
      : { bottom: window.innerHeight - rect.top + 6 }),
  }

  return createPortal(
    <div
      ref={listRef}
      role="listbox"
      aria-label="Sisipkan blok"
      style={style}
      className="bg-popover text-popover-foreground smooth-shadow-ring-sm animate-in fade-in-0 zoom-in-95 z-50 max-h-80 w-72 overflow-y-auto rounded-xl p-1 text-sm"
    >
      {items.length === 0 ? (
        <p className="text-muted-foreground px-2 py-3 text-center">
          Tidak ada blok “{state.query}”
        </p>
      ) : (
        <>
          <p className="text-muted-foreground px-2 pt-1.5 pb-1 text-xs">
            Sisipkan blok
          </p>
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={i === index}
              data-index={i}
              onMouseEnter={() => setIndex(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => state.command(item)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left",
                i === index && "bg-muted",
              )}
            >
              <span className="border-border bg-background flex size-8 shrink-0 items-center justify-center rounded-md border">
                <item.icon className="text-muted-foreground size-4" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-foreground">{item.title}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {item.hint}
                </span>
              </span>
            </button>
          ))}
        </>
      )}
    </div>,
    document.body,
  )
}

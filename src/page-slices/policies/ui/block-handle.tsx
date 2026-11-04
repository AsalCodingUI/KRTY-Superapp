"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { Fragment, Slice } from "@tiptap/pm/model"
import { NodeSelection } from "@tiptap/pm/state"
import { dropPoint } from "@tiptap/pm/transform"
import type { Editor } from "@tiptap/react"
import { GripVertical, Plus } from "@/components/icons"
import { useEffect, useRef, useState } from "react"

type Block = { pos: number; top: number; left: number; height: number }

/** A move this far (px) turns a press on the grip into a drag. */
const DRAG_THRESHOLD = 4
/** The handle's height (size-6). */
const HANDLE = 24

/**
 * Where the handle goes: level with the middle of the block's first line,
 * so a heading, a callout or a one-line paragraph lines up with it. A
 * block shorter than a line (a divider) gets it on its middle; a tall one
 * (an image, a long list) keeps it by the first line, at the top.
 */
function handleTop(node: HTMLElement, r: DOMRect) {
  const css = getComputedStyle(node)
  const size = parseFloat(css.fontSize) || 16
  const line = parseFloat(css.lineHeight) || size * 1.2
  const pad =
    (parseFloat(css.paddingTop) || 0) + (parseFloat(css.borderTopWidth) || 0)
  const middle =
    r.height < pad + line ? r.top + r.height / 2 : r.top + pad + line / 2
  return middle - HANDLE / 2
}

/** Near a scroller's top or bottom edge (px), dragging scrolls it. */
const SCROLL_EDGE = 56

/**
 * What follows the pointer while dragging: the block as a small card (its
 * first lines, on the popover surface with a shadow).
 */
function dragPreview(node: HTMLElement) {
  const card = document.createElement("div")
  card.className = "doc-drag-preview"
  card.style.width = `${Math.min(node.getBoundingClientRect().width, 420)}px`
  card.append(node.cloneNode(true))
  document.body.append(card)
  return card
}

/** The nearest ancestor that scrolls vertically (the dialog's body). */
function scrollParent(el: HTMLElement | null) {
  for (let n = el; n; n = n.parentElement) {
    const { overflowY } = getComputedStyle(n)
    if (/(auto|scroll)/.test(overflowY) && n.scrollHeight > n.clientHeight)
      return n
  }
  return null
}

/**
 * The block under the pointer: a list item when inside a list (they move
 * one by one), else the top-level block. Null outside the document.
 */
export function blockAt(editor: Editor, x: number, y: number): number | null {
  const { view } = editor
  const hit = view.posAtCoords({ left: x, top: y })
  if (!hit) return null
  const $pos = view.state.doc.resolve(hit.inside >= 0 ? hit.inside : hit.pos)
  for (let d = $pos.depth; d > 0; d--) {
    const name = $pos.node(d).type.name
    if (name === "listItem" || name === "taskItem") return $pos.before(d)
  }
  return $pos.depth >= 1 ? $pos.before(1) : hit.inside >= 0 ? hit.inside : null
}

/**
 * Notion-style handles left of the block under the pointer: "+" adds a
 * block below and opens the "/" menu; the grip drags the block up or down
 * and a click selects it. Mount inside a
 * `relative` box around the editor content.
 */
export function BlockHandle({
  editor,
  compact = false,
}: {
  editor: Editor
  /** Only the grip, for editors with little room on the left (forms). */
  compact?: boolean
}) {
  const t = useT("policies")
  const box = useRef<HTMLDivElement>(null)
  const [block, setBlock] = useState<Block | null>(null)
  const dragging = useRef(false)
  // Leaving hides the handle after a beat, so a slanted move toward it
  // (across a few pixels outside) doesn't make it vanish first.
  const hideTimer = useRef<number | null>(null)

  useEffect(() => {
    const dom = editor.view.dom
    const host = box.current?.parentElement
    if (!host) return

    const onMove = (e: MouseEvent) => {
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current)
        hideTimer.current = null
      }
      if (dragging.current || !editor.isEditable) return
      // On the handle itself: keep it where it is.
      if ((e.target as Element | null)?.closest?.("[data-block-handle]")) return
      // Probe a bit right of the text's left edge so the gutter still finds
      // the line the pointer is level with.
      const left = dom.getBoundingClientRect().left + 24
      const pos = blockAt(editor, Math.max(e.clientX, left), e.clientY)
      if (pos === null) return
      const node = editor.view.nodeDOM(pos)
      if (!(node instanceof HTMLElement)) return
      const r = node.getBoundingClientRect()
      const h = host.getBoundingClientRect()
      const top = handleTop(node, r) - h.top
      setBlock((prev) =>
        prev?.pos === pos && prev.top === top
          ? prev
          : {
              pos,
              top,
              // One column at the document's left edge for every block, so
              // a list item's handle sits left of its bullet / number.
              left: dom.getBoundingClientRect().left - h.left,
              height: r.height,
            },
      )
    }
    const onLeave = (e: MouseEvent) => {
      if (dragging.current) return
      const to = e.relatedTarget as Node | null
      if (to && host.contains(to)) return
      hideTimer.current = window.setTimeout(() => setBlock(null), 250)
    }
    host.addEventListener("mousemove", onMove)
    host.addEventListener("mouseleave", onLeave)
    // Typing moves the text under a still pointer: hide until it moves.
    const hide = () => !dragging.current && setBlock(null)
    editor.on("update", hide)
    return () => {
      host.removeEventListener("mousemove", onMove)
      host.removeEventListener("mouseleave", onLeave)
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
      editor.off("update", hide)
    }
  }, [editor])

  const selectBlock = (pos: number) => {
    const { state, view } = editor
    view.dispatch(state.tr.setSelection(NodeSelection.create(state.doc, pos)))
    view.focus()
  }

  /** A paragraph right after the block, with "/" typed to open the menu. */
  const addBelow = () => {
    if (!block) return
    const node = editor.state.doc.nodeAt(block.pos)
    if (!node) return
    const inList =
      node.type.name === "listItem" || node.type.name === "taskItem"
    const after = block.pos + node.nodeSize
    const chain = editor.chain().focus()
    if (inList) {
      // Another item of the same kind (a checklist item stays unticked).
      chain
        .insertContentAt(after, {
          type: node.type.name,
          ...(node.type.name === "taskItem" && { attrs: { checked: false } }),
          content: [{ type: "paragraph" }],
        })
        .setTextSelection(after + 2)
        .run()
    } else {
      chain
        .insertContentAt(after, { type: "paragraph" })
        .setTextSelection(after + 1)
        .insertContent("/")
        .run()
    }
    setBlock(null)
  }

  /**
   * Drag by pointer, not the browser's drag and drop: WebKit (Safari, the
   * Mac app) won't start a native drag from the grip, and this works the
   * same with a mouse, a trackpad or a finger. A blue bar shows where the
   * block will land; letting go moves it there (one undo step).
   */
  const onGripDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || !block) return
    e.preventDefault()
    e.stopPropagation()
    const host = box.current?.parentElement
    if (!host) return
    const { view } = editor
    const from = block.pos
    const startX = e.clientX
    const startY = e.clientY
    let started = false
    let preview: HTMLElement | null = null
    let bar: HTMLElement | null = null
    let target: number | null = null
    let pointer = { x: startX, y: startY }
    let frame = 0
    const scroller = scrollParent(host)

    /** Where the block would go for the pointer at (x, y), and the bar. */
    const aim = (x: number, y: number) => {
      const dom = view.dom.getBoundingClientRect()
      const probeY = Math.min(Math.max(y, dom.top + 2), dom.bottom - 2)
      const pos = blockAt(editor, Math.max(x, dom.left + 24), probeY)
      const dragged = editor.state.doc.nodeAt(from)
      const over = pos === null ? null : editor.state.doc.nodeAt(pos)
      const el = pos === null ? null : view.nodeDOM(pos)
      target = null
      if (!dragged || !over || !(el instanceof HTMLElement) || !bar) return
      const r = el.getBoundingClientRect()
      const before = probeY < r.top + r.height / 2
      const at = before ? pos! : pos! + over.nodeSize
      const point = dropPoint(
        editor.state.doc,
        at,
        new Slice(Fragment.from(dragged), 0, 0),
      )
      // Onto itself or nowhere it can go: no bar.
      if (
        point === null ||
        (point >= from && point <= from + dragged.nodeSize)
      ) {
        bar.style.opacity = "0"
        return
      }
      target = point
      const h = host.getBoundingClientRect()
      bar.style.opacity = "1"
      // In the middle of the gap between the blocks, not on the text.
      const style = getComputedStyle(el)
      const gap =
        parseFloat(before ? style.marginTop : style.marginBottom) / 2 || 0
      const edge = before ? r.top - gap : r.bottom + gap
      bar.style.top = `${edge - h.top - 1.5}px`
      bar.style.left = `${r.left - h.left}px`
      bar.style.width = `${dom.right - r.left}px`
    }

    // Held near the top or bottom edge, the scroller keeps scrolling.
    const tick = () => {
      if (scroller) {
        const s = scroller.getBoundingClientRect()
        const speed =
          pointer.y < s.top + SCROLL_EDGE
            ? -Math.ceil((s.top + SCROLL_EDGE - pointer.y) / 4)
            : pointer.y > s.bottom - SCROLL_EDGE
              ? Math.ceil((pointer.y - (s.bottom - SCROLL_EDGE)) / 4)
              : 0
        if (speed) {
          scroller.scrollTop += speed
          aim(pointer.x, pointer.y)
        }
      }
      frame = requestAnimationFrame(tick)
    }

    const start = () => {
      started = true
      dragging.current = true
      selectBlock(from)
      const node = view.nodeDOM(from)
      if (node instanceof HTMLElement) preview = dragPreview(node)
      bar = document.createElement("div")
      bar.className = "doc-drop-bar"
      host.append(bar)
      document.body.style.cursor = "grabbing"
      frame = requestAnimationFrame(tick)
    }

    const move = (ev: PointerEvent) => {
      pointer = { x: ev.clientX, y: ev.clientY }
      if (!started) {
        if (
          Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD
        )
          return
        start()
      }
      ev.preventDefault()
      if (preview) {
        preview.style.left = `${ev.clientX + 12}px`
        preview.style.top = `${ev.clientY + 12}px`
      }
      aim(ev.clientX, ev.clientY)
    }

    const finish = (drop: boolean) => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", cancel)
      window.removeEventListener("keydown", key, true)
      cancelAnimationFrame(frame)
      preview?.remove()
      bar?.remove()
      document.body.style.cursor = ""
      dragging.current = false
      if (!started) {
        // A press without a drag: pick the block.
        if (drop) selectBlock(from)
        return
      }
      setBlock(null)
      if (!drop || target === null) return
      const { state } = editor
      const node = state.doc.nodeAt(from)
      if (!node) return
      const tr = state.tr.deleteRange(from, from + node.nodeSize)
      const at = tr.mapping.map(target)
      tr.insert(at, node)
      if (NodeSelection.isSelectable(node))
        tr.setSelection(NodeSelection.create(tr.doc, at))
      view.dispatch(tr.scrollIntoView())
      view.focus()
    }
    const up = () => finish(true)
    const cancel = () => finish(false)
    const key = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return
      ev.preventDefault()
      ev.stopPropagation()
      finish(false)
    }

    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", cancel)
    window.addEventListener("keydown", key, true)
  }

  return (
    <div ref={box} aria-hidden={!block} className="contents">
      {block && editor.isEditable && (
        <div
          data-block-handle
          className={cn(
            "absolute z-10 flex -translate-x-full items-start gap-1",
            compact ? "pr-2 max-md:hidden" : "pr-3",
          )}
          style={{ top: block.top, left: block.left }}
        >
          {!compact && (
            <button
              type="button"
              aria-label={t("blockAddBelow")}
              onMouseDown={(e) => e.preventDefault()}
              onClick={addBelow}
              className="text-muted-foreground/70 hover:text-foreground hover:bg-muted flex size-6 items-center justify-center rounded-md transition-colors"
            >
              <Plus className="size-4" />
            </button>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label={t("blockDrag")}
                  onPointerDown={onGripDown}
                  // Keyboard: Enter / Space picks the block.
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && block) {
                      e.preventDefault()
                      selectBlock(block.pos)
                    }
                  }}
                  className="text-muted-foreground/70 hover:text-foreground hover:bg-muted flex h-6 w-5 cursor-grab touch-none items-center justify-center rounded-md transition-colors active:cursor-grabbing"
                />
              }
            >
              <GripVertical className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <span className="font-medium">{t("blockDragHint")}</span>{" "}
              <span className="opacity-70">{t("blockClickHint")}</span>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  )
}

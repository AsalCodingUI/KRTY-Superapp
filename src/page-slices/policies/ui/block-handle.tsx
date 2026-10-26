"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { NodeSelection } from "@tiptap/pm/state"
import type { Editor } from "@tiptap/react"
import { GripVertical, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Block = { pos: number; top: number; left: number; height: number }

/**
 * What follows the pointer while dragging: the block as a small card (its
 * first lines, on the popover surface with a shadow), not the browser's
 * see-through copy. Removed right after the browser snapshots it.
 */
function dragPreview(node: HTMLElement) {
  const card = document.createElement("div")
  card.className = "doc-drag-preview"
  card.style.width = `${Math.min(node.getBoundingClientRect().width, 420)}px`
  card.append(node.cloneNode(true))
  document.body.append(card)
  requestAnimationFrame(() => card.remove())
  return card
}

/**
 * The block under the pointer: a list item when inside a list (they move
 * one by one), else the top-level block. Null outside the document.
 */
function blockAt(editor: Editor, x: number, y: number): number | null {
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
 * (ProseMirror moves it on drop) and a click selects it. Mount inside a
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
      setBlock((prev) =>
        prev?.pos === pos && prev.top === r.top - h.top
          ? prev
          : {
              pos,
              top: r.top - h.top,
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

  const onDragStart = (e: React.DragEvent) => {
    if (!block) return
    const { view } = editor
    const node = view.nodeDOM(block.pos)
    selectBlock(block.pos)
    // Hand ProseMirror the block as the dragged content: it moves it to
    // wherever it's dropped.
    const slice = view.state.selection.content()
    view.dragging = { slice, move: true }
    dragging.current = true
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", node?.textContent ?? "")
    // The block stays selected (tinted) where it is until it's dropped.
    if (node instanceof HTMLElement)
      e.dataTransfer.setDragImage(dragPreview(node), 14, 14)
  }

  const onDragEnd = () => {
    dragging.current = false
    setBlock(null)
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
                  draggable
                  aria-label={t("blockDrag")}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => block && selectBlock(block.pos)}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  className={cn(
                    "text-muted-foreground/70 hover:text-foreground hover:bg-muted flex h-6 w-5 cursor-grab items-center justify-center rounded-md transition-colors active:cursor-grabbing",
                  )}
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

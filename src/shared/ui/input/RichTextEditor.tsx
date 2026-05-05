"use client"

import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useEffect, useRef, useState } from "react"
import { cx } from "@/shared/lib/utils"
import {
  RiBold,
  RiItalic,
  RiUnderline,
  RiLinkLine,
  RiListUnordered,
  RiListOrdered,
  RiArrowDownSLine,
} from "@/shared/ui/lucide-icons"

type BlockType = "paragraph" | "heading1" | "heading2" | "heading3"

const BLOCK_TYPES: { value: BlockType; label: string }[] = [
  { value: "paragraph", label: "Paragraph" },
  { value: "heading1", label: "Heading 1" },
  { value: "heading2", label: "Heading 2" },
  { value: "heading3", label: "Heading 3" },
]

function getActiveBlockType(editor: ReturnType<typeof useEditor> | null): BlockType {
  if (!editor) return "paragraph"
  if (editor.isActive("heading", { level: 1 })) return "heading1"
  if (editor.isActive("heading", { level: 2 })) return "heading2"
  if (editor.isActive("heading", { level: 3 })) return "heading3"
  return "paragraph"
}

function applyBlockType(editor: ReturnType<typeof useEditor> | null, type: BlockType) {
  if (!editor) return
  switch (type) {
    case "heading1": editor.chain().focus().toggleHeading({ level: 1 }).run(); break
    case "heading2": editor.chain().focus().toggleHeading({ level: 2 }).run(); break
    case "heading3": editor.chain().focus().toggleHeading({ level: 3 }).run(); break
    default: editor.chain().focus().setParagraph().run()
  }
}

interface ToolbarButtonProps {
  active?: boolean
  onAction: () => void
  children: React.ReactNode
  title?: string
  className?: string
}

function ToolbarButton({ active, onAction, children, title, className }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onAction() }}
      className={cx(
        "flex items-center justify-center rounded transition-colors",
        active
          ? "bg-white/20 text-white"
          : "text-neutral-300 hover:bg-white/10 hover:text-white",
        className ?? "size-7",
      )}
    >
      {children}
    </button>
  )
}

function BlockTypeDropdown({
  editor,
  activeBlockType,
}: {
  editor: ReturnType<typeof useEditor> | null
  activeBlockType: BlockType
}) {
  const [open, setOpen] = useState(false)
  const activeLabel = BLOCK_TYPES.find((t) => t.value === activeBlockType)?.label ?? "Paragraph"

  return (
    <div className="relative">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          setOpen((v) => !v)
        }}
        className="flex items-center gap-1 rounded bg-neutral-800 py-1 pl-2 pr-1.5 text-xs font-medium text-white hover:bg-neutral-700"
      >
        {activeLabel}
        <RiArrowDownSLine className="size-3 text-neutral-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 min-w-[120px] rounded-lg bg-neutral-900 py-1 shadow-xl">
          {BLOCK_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                applyBlockType(editor, t.value)
                setOpen(false)
              }}
              className={cx(
                "w-full px-3 py-1.5 text-left text-xs hover:bg-white/10",
                activeBlockType === t.value ? "text-white font-medium" : "text-neutral-300",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface RichTextEditorProps {
  value?: object | null
  onChange?: (json: object) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  className,
}: RichTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null)
  const [activeBlockType, setActiveBlockType] = useState<BlockType>("paragraph")

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    immediatelyRender: false,
    content: value ?? undefined,
    editorProps: {
      attributes: { class: "tiptap outline-none min-h-[200px]" },
    },
    onUpdate({ editor }) {
      onChange?.(editor.getJSON())
    },
  })

  useEffect(() => {
    if (!editor) return

    function updatePosition() {
      if (!editor || !containerRef.current) return
      const { selection } = editor.state

      if (selection.empty) { setToolbarPos(null); return }

      const domSel = window.getSelection()
      if (!domSel || domSel.rangeCount === 0) { setToolbarPos(null); return }

      const selRect = domSel.getRangeAt(0).getBoundingClientRect()
      const containerRect = containerRef.current!.getBoundingClientRect()
      if (!selRect.width) { setToolbarPos(null); return }

      setToolbarPos({
        top: selRect.top - containerRect.top - 48,
        left: selRect.left - containerRect.left + selRect.width / 2,
      })
    }

    function updateActiveStates() {
      if (!editor) return
      setActiveBlockType(getActiveBlockType(editor))
      // hide if selection was cleared by a command
      if (editor.state.selection.empty) setToolbarPos(null)
    }

    function onSelection() { updateActiveStates(); updatePosition() }

    editor.on("selectionUpdate", onSelection)
    editor.on("transaction", updateActiveStates)
    return () => {
      editor.off("selectionUpdate", onSelection)
      editor.off("transaction", updateActiveStates)
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    const current = JSON.stringify(editor.getJSON())
    const incoming = JSON.stringify(value ?? null)
    if (current !== incoming && value) {
      editor.commands.setContent(value as object)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div
      ref={containerRef}
      className={cx(
        "border-neutral-primary relative rounded-lg border bg-surface-neutral-primary px-4 py-3 cursor-text",
        className,
      )}
      onClick={() => editor?.commands.focus()}
    >
      {toolbarPos && editor && (
        <div
          style={{
            position: "absolute",
            top: toolbarPos.top,
            left: toolbarPos.left,
            transform: "translateX(-50%)",
            zIndex: 50,
          }}
          onMouseDown={(e) => e.preventDefault()}
          className="flex items-center gap-0.5 rounded-lg bg-neutral-900 px-2 py-1.5 shadow-xl"
        >
          <BlockTypeDropdown editor={editor} activeBlockType={activeBlockType} />

          <div className="mx-1 h-4 w-px bg-white/20" />

          <ToolbarButton active={editor.isActive("bold")} onAction={() => editor.chain().focus().toggleBold().run()} title="Bold">
            <RiBold className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("italic")} onAction={() => editor.chain().focus().toggleItalic().run()} title="Italic">
            <RiItalic className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("underline")} onAction={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
            <RiUnderline className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("link")}
            onAction={() => {
              if (editor.isActive("link")) { editor.chain().focus().unsetLink().run(); return }
              const url = window.prompt("URL")
              if (url) editor.chain().focus().setLink({ href: url }).run()
            }}
            title="Link"
          >
            <RiLinkLine className="size-3.5" />
          </ToolbarButton>

          <div className="mx-1 h-4 w-px bg-white/20" />

          <ToolbarButton active={editor.isActive("bulletList")} onAction={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
            <RiListUnordered className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("orderedList")} onAction={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered list">
            <RiListOrdered className="size-3.5" />
          </ToolbarButton>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  )
}

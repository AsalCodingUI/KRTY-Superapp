"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useEditorState, type Editor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import {
  Bold,
  Check,
  Code,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  X,
} from "lucide-react"
import { useState } from "react"

function Tool({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "text-muted-foreground hover:text-foreground",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </Button>
  )
}

function Divider() {
  return (
    <Separator
      orientation="vertical"
      className="mx-0.5 data-vertical:h-4 data-vertical:self-auto"
    />
  )
}

/**
 * Formatting that appears over selected text (Notion style): marks, link,
 * headings and lists. Tables and empty selections don't show it.
 */
export function SelectionMenu({ editor }: { editor: Editor }) {
  const [linking, setLinking] = useState(false)
  const [url, setUrl] = useState("")

  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      link: e.isActive("link"),
      h1: e.isActive("heading", { level: 1 }),
      h2: e.isActive("heading", { level: 2 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
    }),
  })
  const chain = () => editor.chain().focus()

  const applyLink = (e: React.FormEvent) => {
    e.preventDefault()
    const href = url.trim()
    const c = chain().extendMarkRange("link")
    if (!href) c.unsetLink().run()
    else
      c.setLink({
        href: /^(https?:|mailto:)/i.test(href) ? href : `https://${href}`,
      }).run()
    setLinking(false)
  }

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 8 }}
      shouldShow={({ editor: e, from, to }) =>
        from !== to && e.isEditable && !e.isActive("codeBlock")
      }
      className="bg-popover text-popover-foreground smooth-shadow-ring-sm z-40 flex items-center gap-0.5 rounded-xl p-1"
    >
      {linking ? (
        <form onSubmit={applyLink} className="flex items-center gap-1">
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setLinking(false)}
            placeholder="Tempel tautan…"
            aria-label="Alamat tautan"
            className="h-7 w-64 border-0 bg-transparent px-2 text-sm shadow-none outline-none focus:ring-0"
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon-sm"
            aria-label="Simpan tautan"
          >
            <Check />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Batal"
            onClick={() => setLinking(false)}
          >
            <X />
          </Button>
        </form>
      ) : (
        <>
          <Tool
            label="Judul 1"
            active={s.h1}
            onClick={() => chain().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 />
          </Tool>
          <Tool
            label="Judul 2"
            active={s.h2}
            onClick={() => chain().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 />
          </Tool>
          <Divider />
          <Tool
            label="Tebal (⌘B)"
            active={s.bold}
            onClick={() => chain().toggleBold().run()}
          >
            <Bold />
          </Tool>
          <Tool
            label="Miring (⌘I)"
            active={s.italic}
            onClick={() => chain().toggleItalic().run()}
          >
            <Italic />
          </Tool>
          <Tool
            label="Coret"
            active={s.strike}
            onClick={() => chain().toggleStrike().run()}
          >
            <Strikethrough />
          </Tool>
          <Tool
            label="Kode"
            active={s.code}
            onClick={() => chain().toggleCode().run()}
          >
            <Code />
          </Tool>
          <Tool
            label={s.link ? "Ubah tautan" : "Tautan"}
            active={s.link}
            onClick={() => {
              setUrl(editor.getAttributes("link").href ?? "")
              setLinking(true)
            }}
          >
            <Link2 />
          </Tool>
          <Divider />
          <Tool
            label="Daftar"
            active={s.bullet}
            onClick={() => chain().toggleBulletList().run()}
          >
            <List />
          </Tool>
          <Tool
            label="Daftar bernomor"
            active={s.ordered}
            onClick={() => chain().toggleOrderedList().run()}
          >
            <ListOrdered />
          </Tool>
          <Tool
            label="Kutipan"
            active={s.quote}
            onClick={() => chain().toggleBlockquote().run()}
          >
            <Quote />
          </Tool>
        </>
      )}
    </BubbleMenu>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { NodeSelection } from "@tiptap/pm/state"
import { useEditorState, type Editor } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import { Bold, Check, Italic, X } from "@/components/icons"
import {
  Code,
  Heading1,
  Heading2,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
} from "lucide-react"
import { useState } from "react"
import { useT } from "@/shared/i18n/client"

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
  const t = useT("policies")
  const tc = useT("common")
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
        from !== to &&
        e.isEditable &&
        !e.isActive("codeBlock") &&
        !e.isActive("image") &&
        // A whole block picked with its handle isn't a text selection.
        !(e.state.selection instanceof NodeSelection)
      }
      className="bg-popover text-popover-foreground z-40 flex items-center gap-0.5 rounded-full p-1 shadow-(--elev-4)"
    >
      {linking ? (
        <form onSubmit={applyLink} className="flex items-center gap-1">
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Escape") return
              // Only the link field closes, not the dialog around it.
              e.stopPropagation()
              setLinking(false)
            }}
            placeholder={t("pasteLink")}
            aria-label={t("linkAddress")}
            className="h-7 w-64 border-0 bg-transparent px-2 text-sm shadow-none outline-none focus:ring-0"
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon-sm"
            aria-label={t("saveLink")}
          >
            <Check />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={tc("cancel")}
            onClick={() => setLinking(false)}
          >
            <X />
          </Button>
        </form>
      ) : (
        <>
          <Tool
            label={t("blockH1")}
            active={s.h1}
            onClick={() => chain().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 />
          </Tool>
          <Tool
            label={t("blockH2")}
            active={s.h2}
            onClick={() => chain().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 />
          </Tool>
          <Divider />
          <Tool
            label={t("bold")}
            active={s.bold}
            onClick={() => chain().toggleBold().run()}
          >
            <Bold />
          </Tool>
          <Tool
            label={t("italic")}
            active={s.italic}
            onClick={() => chain().toggleItalic().run()}
          >
            <Italic />
          </Tool>
          <Tool
            label={t("strike")}
            active={s.strike}
            onClick={() => chain().toggleStrike().run()}
          >
            <Strikethrough />
          </Tool>
          <Tool
            label={t("code")}
            active={s.code}
            onClick={() => chain().toggleCode().run()}
          >
            <Code />
          </Tool>
          <Tool
            label={s.link ? t("editLink") : t("link")}
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
            label={t("blockBullet")}
            active={s.bullet}
            onClick={() => chain().toggleBulletList().run()}
          >
            <List />
          </Tool>
          <Tool
            label={t("blockOrdered")}
            active={s.ordered}
            onClick={() => chain().toggleOrderedList().run()}
          >
            <ListOrdered />
          </Tool>
          <Tool
            label={t("blockQuote")}
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

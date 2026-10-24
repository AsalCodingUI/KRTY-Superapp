"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useEditorState, type Editor } from "@tiptap/react"
import {
  Bold,
  ChevronDown,
  Italic,
  MoreHorizontal,
  Plus,
} from "@/components/icons"
import {
  Code,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react"
import { useState } from "react"
import { useT } from "@/shared/i18n/client"
import { BLOCK_ITEMS } from "./slash-command"

const BLOCKS = [
  { label: "paragraph", level: 0 },
  { label: "blockH1", level: 1 },
  { label: "blockH2", level: 2 },
  { label: "blockH3", level: 3 },
] as const

const keepFocus = (e: React.MouseEvent) => e.preventDefault()

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={keepFocus}
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
      className="mx-1.5 data-vertical:h-5 data-vertical:self-auto"
    />
  )
}

/** Dovetail-style bar: block type, the common marks, "more" and insert (+). */
export function DocToolbar({ editor }: { editor: Editor }) {
  const t = useT("policies")
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      level:
        ([1, 2, 3] as const).find((l) => e.isActive("heading", { level: l })) ??
        0,
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      link: e.isActive("link"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })
  const chain = () => editor.chain().focus()
  const block = BLOCKS.find((b) => b.level === s.level) ?? BLOCKS[0]

  return (
    <div className="flex items-center gap-0.5">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-32 justify-between font-normal"
            />
          }
        >
          {t(block.label)}
          <ChevronDown className="text-muted-foreground size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-40">
          {BLOCKS.map((b) => (
            <DropdownMenuItem
              key={b.level}
              onClick={() =>
                b.level === 0
                  ? chain().setParagraph().run()
                  : chain().setHeading({ level: b.level }).run()
              }
              className={cn(
                b.level === 1 && "text-base font-semibold",
                b.level === 2 && "font-semibold",
                b.level === 3 && "text-[13px] font-semibold",
              )}
            >
              {t(b.label)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
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
      <LinkTool editor={editor} active={s.link} />
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
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("moreFormats")}
              title={t("moreFormats")}
              className="text-muted-foreground hover:text-foreground"
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-44">
          <DropdownMenuItem onClick={() => chain().toggleStrike().run()}>
            <Strikethrough />
            {t("strike")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => chain().toggleCode().run()}>
            <Code />
            {t("code")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => chain().toggleBlockquote().run()}>
            <Quote />
            {t("blockQuote")}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!s.canUndo}
            onClick={() => chain().undo().run()}
          >
            <Undo2 />
            {t("undo")}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!s.canRedo}
            onClick={() => chain().redo().run()}
          >
            <Redo2 />
            {t("redo")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Divider />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("insertBlock")}
              title={t("insertBlockHint")}
              className="text-muted-foreground hover:text-foreground"
            />
          }
        >
          <Plus />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("insertBlock")}</DropdownMenuLabel>
            {BLOCK_ITEMS.map((b) => (
              <DropdownMenuItem key={b.id} onClick={() => b.run(editor)}>
                <b.icon />
                {t(b.title)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function LinkTool({ editor, active }: { editor: Editor; active: boolean }) {
  const t = useT("policies")
  const tc = useT("common")
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")

  const apply = (e: React.FormEvent) => {
    e.preventDefault()
    const href = url.trim()
    const c = editor.chain().focus().extendMarkRange("link")
    if (!href) c.unsetLink().run()
    else
      c.setLink({
        href: /^(https?:|mailto:)/i.test(href) ? href : `https://${href}`,
      }).run()
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setUrl(editor.getAttributes("link").href ?? "")
        setOpen(next)
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("link")}
            title={t("link")}
            aria-pressed={active}
            className={cn(
              "text-muted-foreground hover:text-foreground",
              active && "bg-muted text-foreground",
            )}
          />
        }
      >
        <Link2 />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-3 p-3">
        <form onSubmit={apply} className="flex flex-col gap-3">
          <Input
            autoFocus
            placeholder="https://"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            {active && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .extendMarkRange("link")
                    .unsetLink()
                    .run()
                  setOpen(false)
                }}
              >
                {t("removeLink")}
              </Button>
            )}
            <Button type="submit" size="sm">
              {tc("save")}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

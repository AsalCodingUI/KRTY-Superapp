"use client"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import {
  RiFileCopyLine,
  RiListOrdered,
  RiListUnordered,
} from "@/shared/ui/lucide-icons"
import * as React from "react"
import { toast } from "sonner"

/**
 * Plain text with a little structure, for task descriptions and notes:
 * "- " lines become bullets, "1. " lines a numbered list, and links show
 * as blue tags you can open or copy. No headings or sizes. It's stored as
 * the text itself; reading shows it formatted, a click edits the text.
 * Typing "/" at the start of a line offers bullets / numbers.
 */

const URL_RE = /(https?:\/\/[^\s]+)/g
const BULLET_RE = /^(\s*)[-*•]\s+/
const NUMBER_RE = /^(\s*)(\d+)[.)]\s+/

type Command = "bullet" | "numbered"

/** "id.pinterest.com/pin/6034…" from a full URL. */
function shortUrl(url: string) {
  try {
    const u = new URL(url)
    const rest = `${u.pathname}${u.search}`.replace(/\/$/, "")
    const label = `${u.host.replace(/^www\./, "")}${rest}`
    return label.length > 42 ? `${label.slice(0, 40)}…` : label
  } catch {
    return url
  }
}

/** A link as a blue tag: click opens it in a new tab, the icon copies it. */
function LinkTag({ url }: { url: string }) {
  const tc = useT("common")
  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(url)
    toast.success(tc("linkCopied"))
  }
  return (
    <span className="bg-info-subtle text-info dark:text-blue-11 group/link mx-0.5 inline-flex max-w-full items-center gap-0.5 rounded-md py-px pr-0.5 pl-1.5 align-baseline">
      <Tooltip>
        <TooltipTrigger
          render={
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="truncate underline-offset-2 outline-none hover:underline focus-visible:underline"
            />
          }
        >
          {shortUrl(url)}
        </TooltipTrigger>
        <TooltipContent className="max-w-80 break-all">{url}</TooltipContent>
      </Tooltip>
      <button
        type="button"
        onClick={copy}
        aria-label={tc("linkCopy")}
        title={tc("linkCopy")}
        className="hover:bg-info/15 flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm opacity-60 transition-opacity outline-none group-hover/link:opacity-100 focus-visible:opacity-100"
      >
        <RiFileCopyLine className="size-3" />
      </button>
    </span>
  )
}

/** One line's text with its links as tags. */
function Inline({ text }: { text: string }) {
  const parts = text.split(URL_RE)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <LinkTag key={i} url={part} /> : part,
      )}
    </>
  )
}

type Block =
  | { kind: "text"; lines: string[] }
  | { kind: "bullets"; items: string[] }
  | { kind: "numbered"; items: string[]; start: number }

/** Consecutive bullet / numbered lines grouped into lists. */
function toBlocks(value: string): Block[] {
  const blocks: Block[] = []
  for (const line of value.split("\n")) {
    const bullet = line.match(BULLET_RE)
    const number = line.match(NUMBER_RE)
    const last = blocks[blocks.length - 1]
    if (bullet) {
      const item = line.slice(bullet[0].length)
      if (last?.kind === "bullets") last.items.push(item)
      else blocks.push({ kind: "bullets", items: [item] })
    } else if (number) {
      const item = line.slice(number[0].length)
      if (last?.kind === "numbered") last.items.push(item)
      else blocks.push({ kind: "numbered", items: [item], start: +number[2] })
    } else if (last?.kind === "text") last.lines.push(line)
    else blocks.push({ kind: "text", lines: [line] })
  }
  return blocks
}

function Formatted({ value }: { value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {toBlocks(value).map((block, i) =>
        block.kind === "bullets" ? (
          <ul key={i} className="flex flex-col gap-0.5 pl-1">
            {block.items.map((item, j) => (
              <li key={j} className="flex gap-2">
                <span
                  aria-hidden
                  className="bg-foreground/40 mt-[0.6em] size-1 shrink-0 rounded-full"
                />
                <span className="min-w-0 break-words">
                  <Inline text={item} />
                </span>
              </li>
            ))}
          </ul>
        ) : block.kind === "numbered" ? (
          <ol key={i} className="flex flex-col gap-0.5 pl-1">
            {block.items.map((item, j) => (
              <li key={j} className="flex gap-1.5">
                <span className="text-muted-foreground shrink-0 tabular-nums">
                  {block.start + j}.
                </span>
                <span className="min-w-0 break-words">
                  <Inline text={item} />
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p key={i} className="break-words whitespace-pre-wrap">
            {block.lines.map((line, j) => (
              <React.Fragment key={j}>
                {j > 0 && "\n"}
                <Inline text={line} />
              </React.Fragment>
            ))}
          </p>
        ),
      )}
    </div>
  )
}

export function RichTextField({
  value,
  onChange,
  onBlur,
  placeholder,
  readOnly = false,
  className,
  "aria-label": ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  readOnly?: boolean
  /** Text styles (size, colour, leading) for both reading and editing. */
  className?: string
  "aria-label"?: string
}) {
  const tc = useT("common")
  const [editing, setEditing] = React.useState(false)
  const [menu, setMenu] = React.useState<{
    line: number
    index: number
  } | null>(null)
  const ref = React.useRef<HTMLTextAreaElement>(null)
  const commands: { id: Command; label: string; icon: React.ElementType }[] = [
    { id: "bullet", label: tc("richBullet"), icon: RiListUnordered },
    { id: "numbered", label: tc("richNumbered"), icon: RiListOrdered },
  ]

  React.useEffect(() => {
    if (!editing) return
    const el = ref.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [editing])

  // The caret after a programmatic edit, applied once the new text is in
  // (before the next keystroke), or typing lands in the wrong place.
  const pendingCaret = React.useRef<number | null>(null)
  React.useLayoutEffect(() => {
    if (pendingCaret.current === null) return
    ref.current?.setSelectionRange(pendingCaret.current, pendingCaret.current)
    pendingCaret.current = null
  }, [value])

  /** Replace the text and put the caret at `caret`. */
  const replace = (next: string, caret: number) => {
    pendingCaret.current = caret
    onChange(next)
  }

  const lineAt = (text: string, caret: number) => {
    const start = text.lastIndexOf("\n", caret - 1) + 1
    const endIdx = text.indexOf("\n", caret)
    const end = endIdx === -1 ? text.length : endIdx
    return { start, end, line: text.slice(start, end) }
  }

  const runCommand = (command: Command) => {
    const el = ref.current
    if (!el) return
    const caret = el.selectionStart
    const { start } = lineAt(value, caret)
    // Drop the "/" that opened the menu, then prefix the line.
    const slash = value.lastIndexOf("/", caret - 1)
    const without =
      slash >= start ? value.slice(0, slash) + value.slice(slash + 1) : value
    const prefix = command === "bullet" ? "- " : "1. "
    const next = without.slice(0, start) + prefix + without.slice(start)
    setMenu(null)
    replace(next, caret - (slash >= start ? 1 : 0) + prefix.length)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    if (menu) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        const step = e.key === "ArrowDown" ? 1 : -1
        setMenu({
          ...menu,
          index: (menu.index + step + commands.length) % commands.length,
        })
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        runCommand(commands[menu.index].id)
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        setMenu(null)
        return
      }
    }
    if (e.key === "Escape") {
      e.stopPropagation()
      el.blur()
      return
    }
    // Enter in a list continues it; Enter on an empty item ends it.
    if (e.key === "Enter" && !e.shiftKey) {
      const caret = el.selectionStart
      const { start, end, line } = lineAt(value, caret)
      const bullet = line.match(BULLET_RE)
      const number = line.match(NUMBER_RE)
      const marker = bullet?.[0] ?? number?.[0]
      if (!marker) return
      e.preventDefault()
      if (line.trim() === marker.trim()) {
        replace(value.slice(0, start) + value.slice(end), start)
        return
      }
      const nextMarker = number
        ? `${number[1]}${+number[2] + 1}. `
        : (bullet?.[0] ?? "- ")
      const insert = `\n${nextMarker}`
      replace(
        value.slice(0, caret) + insert + value.slice(caret),
        caret + insert.length,
      )
    }
  }

  const onInput = (next: string, caret: number) => {
    onChange(next)
    const { line, start } = lineAt(next, caret)
    // "/" typed at the start of a line (or after a space) opens the menu.
    const before = line.slice(0, caret - start)
    if (/(^|\s)\/$/.test(before))
      setMenu({ line: next.slice(0, caret).split("\n").length - 1, index: 0 })
    else if (menu) setMenu(null)
  }

  if (readOnly || !editing) {
    const empty = !value.trim()
    return (
      <div
        role={readOnly ? undefined : "textbox"}
        tabIndex={readOnly ? undefined : 0}
        aria-label={ariaLabel}
        onClick={() => !readOnly && setEditing(true)}
        onKeyDown={(e) => {
          if (!readOnly && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            setEditing(true)
          }
        }}
        className={cn(
          "w-full rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)",
          !readOnly && "cursor-text",
          className,
        )}
      >
        {empty ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          <Formatted value={value} />
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        rows={2}
        placeholder={placeholder ?? tc("richHint")}
        aria-label={ariaLabel}
        onChange={(e) => onInput(e.target.value, e.target.selectionStart)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          setMenu(null)
          setEditing(false)
          onBlur?.()
        }}
        className={cn(
          "placeholder:text-muted-foreground field-sizing-content w-full resize-none border-0 bg-transparent p-0 outline-none focus:ring-0! focus:ring-offset-0!",
          className,
        )}
      />
      {menu && (
        <div
          role="listbox"
          className="bg-popover text-popover-foreground nest-rounded-2xl nest-p-1.5 absolute left-0 z-20 flex w-52 flex-col text-sm shadow-(--elev-4)"
          // Under the line the "/" is on (lines are ~1.6em tall).
          style={{ top: `calc(${menu.line + 1} * 1.65em + 4px)` }}
        >
          {commands.map((command, i) => (
            <Button
              key={command.id}
              role="option"
              aria-selected={i === menu.index}
              variant="ghost"
              size="sm"
              // Keep focus in the textarea so the caret stays put.
              onMouseDown={(e) => {
                e.preventDefault()
                runCommand(command.id)
              }}
              className={cn(
                "rounded-nested justify-start font-normal",
                i === menu.index && "bg-accent text-foreground",
              )}
            >
              <command.icon data-icon="inline-start" />
              {command.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

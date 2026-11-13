"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { useEffect, useMemo, useState, type ReactElement } from "react"

/**
 * Emoji, as Notion picks a page's icon: a search, the groups, a grid; plus
 * Acak (random) and Hapus. The list (public/emoji/en.json, from
 * emojibase-data: [emoji, words, group]) loads on first open.
 */

type Data = { groups: string[]; emojis: [string, string, number][] }

let cache: Promise<Data> | null = null
const loadEmoji = () =>
  (cache ??= fetch("/emoji/en.json")
    .then((r) => r.json() as Promise<Data>)
    .catch((error) => {
      cache = null
      throw error
    }))

/** Group keys (emojibase) → a sample shown on its tab. */
const GROUP_ICON: Record<string, string> = {
  "smileys-emotion": "😀",
  "people-body": "👋",
  "animals-nature": "🐻",
  "food-drink": "🍔",
  "travel-places": "✈️",
  activities: "⚽",
  objects: "💡",
  symbols: "❤️",
  flags: "🏳️",
}

export function EmojiPicker({
  trigger,
  onPick,
  onRemove,
  align = "start",
}: {
  /** The button that opens it (rendered as the popover's trigger). */
  trigger: ReactElement
  onPick: (emoji: string) => void
  /** Shows "Hapus" when there's one to remove. */
  onRemove?: () => void
  align?: "start" | "center" | "end"
}) {
  const t = useT("common")
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<Data | null>(null)
  const [query, setQuery] = useState("")
  const [group, setGroup] = useState(0)

  useEffect(() => {
    if (!open || data) return
    let alive = true
    void loadEmoji().then((d) => alive && setData(d))
    return () => {
      alive = false
    }
  }, [open, data])

  const shown = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    if (q) return data.emojis.filter(([, words]) => words.includes(q))
    return data.emojis.filter(([, , g]) => g === group)
  }, [data, query, group])

  const pick = (emoji: string) => {
    onPick(emoji)
    setOpen(false)
    setQuery("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align={align} className="w-[22rem] gap-2 p-2">
        <div className="flex items-center gap-1.5">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("emojiSearch")}
            aria-label={t("emojiSearch")}
            className="h-8 flex-1"
          />
          <Button
            variant="ghost"
            size="sm"
            disabled={!data}
            onClick={() => {
              if (!data) return
              const all = data.emojis
              pick(all[Math.floor(Math.random() * all.length)][0])
            }}
          >
            {t("emojiRandom")}
          </Button>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                onRemove()
                setOpen(false)
              }}
            >
              {t("remove")}
            </Button>
          )}
        </div>
        {!query && data && (
          <div className="flex justify-between">
            {data.groups.map((key, i) =>
              GROUP_ICON[key] ? (
                <button
                  key={key}
                  type="button"
                  aria-label={key}
                  aria-pressed={group === i}
                  onClick={() => setGroup(i)}
                  className={cn(
                    "rounded-nested grid size-8 place-items-center text-base opacity-60 transition-opacity hover:opacity-100",
                    group === i && "bg-muted opacity-100",
                  )}
                >
                  {GROUP_ICON[key]}
                </button>
              ) : null,
            )}
          </div>
        )}
        <div className="no-scrollbar h-64 overflow-y-auto">
          {!data ? (
            <div className="flex h-full items-center justify-center">
              <Spinner className="size-5" />
            </div>
          ) : shown.length === 0 ? (
            <p className="text-muted-foreground text-meta py-8 text-center">
              {t("noResults")}
            </p>
          ) : (
            <div className="grid grid-cols-9">
              {shown.map(([emoji, words]) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={words.split(" ").slice(0, 3).join(" ")}
                  onClick={() => pick(emoji)}
                  className="rounded-nested hover:bg-muted grid size-9 place-items-center text-xl"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

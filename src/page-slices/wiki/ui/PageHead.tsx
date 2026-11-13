"use client"

import { EmojiPicker } from "@/components/emoji-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { uploadReportImage } from "@/page-slices/projects/ui/workspace/reports-data"
import { useT } from "@/shared/i18n/client"
import { ImageUp, Smile } from "@/components/icons"
import { useRef, useState, type ReactElement } from "react"
import { toast } from "sonner"
import { WIKI_FILES_FOLDER, type WikiPatch } from "../model/data"
import { WikiIcon } from "./wiki-icon"

/** Upload a picture or paste its link: the cover's source. */
function CoverPicker({
  trigger,
  onPick,
  onRemove,
}: {
  trigger: ReactElement
  onPick: (url: string) => void
  onRemove?: () => void
}) {
  const t = useT("wiki")
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [link, setLink] = useState("")
  const input = useRef<HTMLInputElement>(null)
  const done = (url: string) => {
    onPick(url)
    setOpen(false)
    setLink("")
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="end" className="w-80 gap-2 p-2">
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ""
            if (!file) return
            setBusy(true)
            try {
              done(await uploadReportImage(WIKI_FILES_FOLDER, file))
            } catch {
              toast.error(t("coverFailed"))
            } finally {
              setBusy(false)
            }
          }}
        />
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {busy ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <ImageUp data-icon="inline-start" />
          )}
          {busy ? t("coverUploading") : t("coverUpload")}
        </Button>
        <Input
          value={link}
          inputMode="url"
          placeholder={t("coverLink")}
          aria-label={t("coverLink")}
          onChange={(e) => setLink(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && /^https:\/\//.test(link.trim()))
              done(link.trim())
          }}
        />
        {onRemove && (
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => {
              onRemove()
              setOpen(false)
            }}
          >
            {t("removeCover")}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

/**
 * The top of a wiki page, as Notion's: the cover across the page, the icon
 * over its edge, then the title. "Tambah ikon" / "Tambah cover" show when
 * the pointer is over the title area.
 */
export function PageHead({
  icon,
  cover,
  kind,
  onChange,
  children,
}: {
  icon: string | null
  cover: string | null
  kind: "page" | "database"
  onChange: (patch: WikiPatch) => void
  /** The title and what follows it. */
  children: React.ReactNode
}) {
  const t = useT("wiki")
  return (
    <div className="group/head flex flex-col">
      {cover && (
        <div className="group/cover relative mt-2 h-48 overflow-hidden rounded-lg sm:h-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" className="size-full object-cover" />
          <div className="absolute right-3 bottom-3 opacity-0 transition-opacity group-hover/cover:opacity-100 focus-within:opacity-100">
            <CoverPicker
              trigger={
                <Button size="sm" variant="outline" className="bg-background">
                  {t("changeCover")}
                </Button>
              }
              onPick={(url) => onChange({ cover: url })}
              onRemove={() => onChange({ cover: null })}
            />
          </div>
        </div>
      )}
      <div className="mx-auto w-full max-w-3xl px-6 sm:px-16">
        {icon && (
          <EmojiPicker
            trigger={
              <button
                type="button"
                aria-label={t("changeIcon")}
                className={
                  cover
                    ? "rounded-card hover:bg-muted relative isolate z-10 -mt-10 -ml-2 grid size-20 place-items-center"
                    : "rounded-card hover:bg-muted mt-6 -ml-2 grid size-20 place-items-center"
                }
              >
                <WikiIcon
                  icon={icon}
                  kind={kind}
                  className="size-16 text-6xl"
                />
              </button>
            }
            onPick={(emoji) => onChange({ icon: emoji })}
            onRemove={() => onChange({ icon: null })}
          />
        )}
        <div
          className={
            icon
              ? "flex h-9 items-center gap-1 opacity-0 transition-opacity group-hover/head:opacity-100 focus-within:opacity-100"
              : "mt-6 flex h-9 items-center gap-1 opacity-0 transition-opacity group-hover/head:opacity-100 focus-within:opacity-100"
          }
        >
          {!icon && (
            <EmojiPicker
              trigger={
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                >
                  <Smile data-icon="inline-start" />
                  {t("addIcon")}
                </Button>
              }
              onPick={(emoji) => onChange({ icon: emoji })}
            />
          )}
          {!cover && (
            <CoverPicker
              trigger={
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                >
                  <ImageUp data-icon="inline-start" />
                  {t("addCover")}
                </Button>
              }
              onPick={(url) => onChange({ cover: url })}
            />
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

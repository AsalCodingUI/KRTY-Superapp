"use client"

import { EmptyState } from "@/components/empty-state"
import { ZoomableImage } from "@/components/image-lightbox"
import { Markdown } from "@/components/markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { RiCloseLine, RiMoreFill, RiPencilLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Sparkles } from "@/components/icons"
import { useEffect, useMemo } from "react"
import { guideFor } from "../model/sections"
import { isGuide, type WhatsNewEntry } from "../model/types"
import { useWhatsNew } from "../model/use-whats-new"
import { useWhatsNewAdmin } from "./WhatsNewEditor"
import { AREA_LABEL, dayOf, EntryBadges } from "./shared"

/**
 * One entry and its guide, in the same window as a rule in Aturan & Update
 * (PolicyDialog): a thin header with where it lives and the actions, then
 * the document centred below. Neighbours of the same kind page inside it.
 */
export function WhatsNewDialog({
  id,
  onOpen,
  onClose,
}: {
  id: string
  /** Another entry (previous / next). */
  onOpen: (id: string) => void
  onClose: () => void
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        bare
        showCloseButton={false}
        className="flex h-[min(56rem,92svh)] w-full flex-col overflow-hidden p-0 sm:max-w-5xl"
      >
        <EntryView id={id} onOpen={onOpen} onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}

function EntryView({
  id,
  onOpen,
  onClose,
}: {
  id: string
  onOpen: (id: string) => void
  onClose: () => void
}) {
  const t = useT("whatsNew")
  const dateLocale = useDateLocale()
  const { ready, level, canEdit, entries, setRead } = useWhatsNew()
  const admin = useWhatsNewAdmin()
  const entry = entries.find((e) => e.id === id) ?? null
  const guide = useMemo(
    () => (entry ? guideFor(entry, level) : null),
    [entry, level],
  )
  // Guides page through guides, updates through updates.
  const siblings = entry
    ? entries.filter((e) => isGuide(e) === isGuide(entry))
    : []
  const index = siblings.findIndex((e) => e.id === id)
  const newer = siblings[index - 1]
  const older = siblings[index + 1]

  // Opening it counts as reading it (only on open, so "unread" sticks).
  useEffect(() => {
    if (ready && entry) setRead([entry.id], true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, entry?.id])

  return (
    <>
      <header className="border-border flex h-14 shrink-0 items-center gap-2 border-b pr-3 pl-5">
        <Sparkles className="text-muted-foreground size-4 shrink-0" />
        <DialogTitle className="text-muted-foreground min-w-0 truncate text-sm font-normal">
          {entry ? `${t(AREA_LABEL[entry.area])} / ${entry.title}` : t("title")}
        </DialogTitle>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {entry && canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => admin.edit(entry)}
            >
              <RiPencilLine data-icon="inline-start" />
              {t("edit")}
            </Button>
          )}
          {entry && canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("title")}
                    className="text-muted-foreground"
                  />
                }
              >
                <RiMoreFill />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => admin.remove(entry)}
                >
                  {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("close")}
            className="text-muted-foreground"
            onClick={onClose}
          >
            <RiCloseLine />
          </Button>
        </div>
      </header>

      {/* Re-keyed per entry, so paging starts at the top. */}
      <div key={id} className="scroll-pane min-h-0 flex-1">
        {!ready ? (
          <div className="flex justify-center py-24">
            <Spinner className="size-6" />
          </div>
        ) : !entry ? (
          <EmptyState
            placement="inner"
            className="py-24"
            title={t("notFoundTitle")}
            description={t("notFoundDescription")}
            icon={<Sparkles />}
          />
        ) : (
          <article className="mx-auto w-full max-w-3xl px-8 pt-12 pb-16 sm:px-16">
            <EntryBadges entry={entry} />
            <h1 className="text-heading mt-4 text-4xl leading-tight font-medium tracking-tight">
              {entry.title}
            </h1>
            <time
              dateTime={entry.date}
              className="text-muted-foreground mt-4 block text-sm capitalize"
            >
              {format(dayOf(entry.date), "EEEE, d MMMM yyyy", {
                locale: dateLocale,
              })}
            </time>
            {entry.summary && (
              <p className="text-muted-foreground mt-3 text-[15px]">
                {entry.summary}
              </p>
            )}
            {entry.thumbnailUrl && (
              <ZoomableImage
                src={entry.thumbnailUrl}
                alt=""
                className="border-border mt-8 block aspect-[2/1] w-full rounded-lg border object-cover"
              />
            )}

            <Separator className="my-8" />

            {guide?.intro && (
              <Markdown images className="mb-9">
                {guide.intro}
              </Markdown>
            )}
            <div className="flex flex-col gap-9">
              {(guide?.sections ?? []).map((section) => (
                <section key={section.id} id={section.id}>
                  <h2 className="text-heading mb-3 text-lg font-medium tracking-tight">
                    {section.title}
                    {section.audience && section.audience !== "everyone" && (
                      <Badge variant="warning" className="ml-2 align-middle">
                        {t(
                          section.audience === "pm"
                            ? "audiencePm"
                            : "audienceStakeholder",
                        )}
                      </Badge>
                    )}
                  </h2>
                  <Markdown images>{section.body}</Markdown>
                </section>
              ))}
            </div>

            {(newer || older) && (
              <>
                <Separator className="mt-12 mb-8" />
                <nav className="grid gap-3 sm:grid-cols-2">
                  {newer ? (
                    <Neighbour
                      entry={newer}
                      label={t("previous")}
                      side="prev"
                      onOpen={onOpen}
                    />
                  ) : (
                    <span className="max-sm:hidden" />
                  )}
                  {older && (
                    <Neighbour
                      entry={older}
                      label={t("next")}
                      side="next"
                      onOpen={onOpen}
                    />
                  )}
                </nav>
              </>
            )}
          </article>
        )}
      </div>
      {admin.elements}
    </>
  )
}

function Neighbour({
  entry,
  label,
  side,
  onOpen,
}: {
  entry: WhatsNewEntry
  label: string
  side: "prev" | "next"
  onOpen: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(entry.id)}
      className={cn(
        "border-foreground/10 hover:border-foreground/20 flex flex-col gap-0.5 rounded-xl border px-4 py-3 text-left transition-colors",
        side === "next" && "sm:items-end sm:text-right",
      )}
    >
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
        {side === "prev" && <ChevronLeft className="size-3.5" />}
        {label}
        {side === "next" && <ChevronRight className="size-3.5" />}
      </span>
      <span className="text-foreground line-clamp-2 text-sm font-medium">
        {entry.title}
      </span>
    </button>
  )
}

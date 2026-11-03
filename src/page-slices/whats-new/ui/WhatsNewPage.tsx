"use client"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useViewMode, ViewToggle } from "@/components/view-toggle"
import { cn } from "@/lib/utils"
import { ContextTarget, copyText, type CtxItem } from "@/shared/context-menu"
import { searchText } from "../model/sections"
import {
  isGuide,
  WHATS_NEW_AREAS,
  WHATS_NEW_KINDS,
  type WhatsNewArea,
  type WhatsNewEntry,
  type WhatsNewKind,
} from "../model/types"
import { WhatsNewDialog } from "./WhatsNewDialog"
import { useWhatsNewAdmin } from "./WhatsNewEditor"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { RiSearchLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { Copy, ListFilter, Pencil, Plus, Sparkles, Trash2 } from "lucide-react"
import { ParamLink } from "@/components/param-link"
import { replaceUrl } from "@/shared/lib/url-params"
import { usePathname, useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { useWhatsNew } from "../model/use-whats-new"
import { AREA_LABEL, dayOf, EntryBadges } from "./shared"

/**
 * Yang baru: release notes grouped by day (newest first), then the
 * standing guides ("Panduan dasar"), filtered by kind (?kind=), area
 * (?area=) and search, each opening its guide (/whats-new/<id>).
 */
export function WhatsNewPage() {
  const t = useT("whatsNew")
  const dateLocale = useDateLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { ready, error, level, canEdit, entries } = useWhatsNew()
  const admin = useWhatsNewAdmin()

  const areaParam = searchParams.get("area")
  const area = (WHATS_NEW_AREAS as readonly string[]).includes(areaParam ?? "")
    ? (areaParam as WhatsNewArea)
    : null
  const kindParam = searchParams.get("kind")
  const kind = (WHATS_NEW_KINDS as readonly string[]).includes(kindParam ?? "")
    ? (kindParam as WhatsNewKind)
    : null
  const setParam = (key: "area" | "kind" | "entry", next: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next) params.set(key, next)
    else params.delete(key)
    replaceUrl(params.size ? `${pathname}?${params}` : pathname)
  }
  const setArea = (next: WhatsNewArea | null) => setParam("area", next)
  const setKind = (next: WhatsNewKind | null) => setParam("kind", next)
  // An entry opens in a window over the list (like a rule in Aturan &
  // Update): ?entry=<id> keeps it linkable, the filters stay as they are.
  const openId = searchParams.get("entry")
  const entryHref = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("entry", id)
    return `${pathname}?${params}`
  }

  const [view, setView] = useViewMode("whats-new", "grid")
  const [query, setQuery] = useState("")
  const needle = query.trim().toLowerCase()
  const haystack = useMemo(
    () => new Map(entries.map((e) => [e.id, searchText(e, level)])),
    [entries, level],
  )
  const kindOf = (e: WhatsNewEntry): WhatsNewKind =>
    isGuide(e) ? "guides" : "updates"
  const searched = entries.filter(
    (e) =>
      !needle ||
      needle
        .split(/\s+/)
        .every((word) => haystack.get(e.id)?.includes(word) ?? false),
  )
  const matching = searched.filter((e) => !kind || kindOf(e) === kind)
  const shown = matching.filter((e) => !area || e.area === area)
  // Chips for the areas that have entries of this kind (counts follow the
  // search).
  const areas = WHATS_NEW_AREAS.filter((a) =>
    entries.some((e) => e.area === a && (!kind || kindOf(e) === kind)),
  )
  // Updates by day (newest first), then the guides as one group.
  const updates = shown.filter((e) => !isGuide(e))
  const guides = shown.filter(isGuide)
  const groups = [
    ...[...new Set(updates.map((e) => e.date))].map((day) => ({
      key: day,
      isDay: true,
      title: format(dayOf(day), "EEEE, d MMMM yyyy", { locale: dateLocale }),
      count: t("updates", {
        n: updates.filter((e) => e.date === day).length,
      }),
      items: updates.filter((e) => e.date === day),
    })),
    ...(guides.length
      ? [
          {
            key: "guides",
            isDay: false,
            title: t("guidesHeading"),
            count: t("guidesCount", { n: guides.length }),
            items: guides,
          },
        ]
      : []),
  ]
  const hasGuides = entries.some(isGuide)

  const tm = useT("ctxmenu")
  const itemsFor = (entry: WhatsNewEntry): CtxItem[] => [
    {
      id: "copy-title",
      label: t("copyTitle"),
      icon: Copy,
      onSelect: async () => {
        if (await copyText(entry.title)) toast.success(tm("copied"))
        else toast.error(tm("copyFailed"))
      },
    },
    ...(canEdit
      ? ([
          {
            id: "edit",
            label: t("edit"),
            icon: Pencil,
            onSelect: () => admin.edit(entry),
          },
          {
            id: "delete",
            label: t("delete"),
            icon: Trash2,
            destructive: true,
            // The dialog asks first.
            onSelect: () => admin.remove(entry),
          },
        ] satisfies CtxItem[])
      : []),
  ]

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        title={t("title")}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative w-32 min-w-0 sm:w-64">
              <RiSearchLine className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                type="search"
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchLabel")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    aria-label={t("filterLabel")}
                    className="max-sm:w-8 max-sm:px-0"
                  />
                }
              >
                <ListFilter data-icon="inline-start" />
                <span className="hidden sm:inline">
                  {area ? t(AREA_LABEL[area]) : t("areaButton")}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuRadioGroup
                  value={area ?? ""}
                  onValueChange={(value) =>
                    setArea((value as WhatsNewArea) || null)
                  }
                >
                  <DropdownMenuRadioItem value="">
                    {t("allAreas")}
                  </DropdownMenuRadioItem>
                  {areas.map((a) => (
                    <DropdownMenuRadioItem key={a} value={a}>
                      {t(AREA_LABEL[a])}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <ViewToggle
              value={view}
              onValueChange={setView}
              modes={["grid", "list"]}
            />
            {canEdit && (
              <Button aria-label={t("write")} onClick={admin.create}>
                <Plus data-icon="inline-start" />
                <span className="max-sm:hidden">{t("write")}</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Updates or the standing guides: one quiet row. */}
      {ready && hasGuides && (
        <div
          role="group"
          aria-label={t("kindLabel")}
          className="mb-6 flex gap-1.5"
        >
          <KindChip active={!kind} onClick={() => setKind(null)}>
            {t("all")}
          </KindChip>
          {WHATS_NEW_KINDS.map((k) => (
            <KindChip
              key={k}
              active={kind === k}
              onClick={() => {
                // An area may not exist in the other kind.
                const params = new URLSearchParams(searchParams.toString())
                if (kind === k) params.delete("kind")
                else params.set("kind", k)
                params.delete("area")
                replaceUrl(params.size ? `${pathname}?${params}` : pathname)
              }}
            >
              {t(k === "guides" ? "kindGuides" : "kindUpdates")}
            </KindChip>
          ))}
        </div>
      )}

      <div className="pb-10">
        {!ready ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-6" />
          </div>
        ) : error ? (
          <EmptyState title={t("loadFailed")} icon={<Sparkles />} />
        ) : shown.length === 0 ? (
          <EmptyState
            title={
              needle ? t("noMatch", { query: query.trim() }) : t("emptyTitle")
            }
            description={
              needle || area || kind ? t("noMatchHint") : t("emptyDescription")
            }
            icon={<Sparkles />}
            action={
              needle || area || kind
                ? {
                    label: t("clearFilters"),
                    onClick: () => {
                      setQuery("")
                      replaceUrl(pathname)
                    },
                  }
                : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-10">
            {groups.map(({ key, isDay, title, count, items }) => {
              return (
                <section key={key} className="flex flex-col gap-3">
                  <h2 className="text-muted-foreground flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        "text-foreground font-medium",
                        isDay && "capitalize",
                      )}
                    >
                      {title}
                    </span>
                    <span className="tabular-nums">{count}</span>
                  </h2>
                  <div
                    className={
                      view === "grid"
                        ? "grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3"
                        : "flex flex-col gap-1"
                    }
                  >
                    {items.map((entry) => (
                      <ContextTarget
                        key={entry.id}
                        type="whats-new"
                        id={entry.id}
                        label={entry.title}
                        href={entryHref(entry.id)}
                        items={() => itemsFor(entry)}
                      >
                        {view === "grid" ? (
                          <EntryTile entry={entry} href={entryHref(entry.id)} />
                        ) : (
                          <EntryRow entry={entry} href={entryHref(entry.id)} />
                        )}
                      </ContextTarget>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
      {admin.elements}
      {openId && (
        <WhatsNewDialog
          id={openId}
          onOpen={(id) => setParam("entry", id)}
          onClose={() => setParam("entry", null)}
        />
      )}
    </div>
  )
}

function KindChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center rounded-full px-3 text-[13px] whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        active
          ? "bg-foreground/[0.08] text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

type EntryLinkProps = {
  entry: WhatsNewEntry
  href: string
  /** data-* from the right-click target. */
  [data: `data-${string}`]: string | undefined
}

/** Grid: the 4:3 picture with its badges on it, then title and summary. */
function EntryTile({ entry, href, ...rest }: EntryLinkProps) {
  return (
    <ParamLink
      {...rest}
      href={href}
      className="group/entry focus-visible:ring-primary/30 flex flex-col gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--background)]"
    >
      <div className="border-foreground/10 relative overflow-hidden rounded-xl border">
        <EntryPicture
          entry={entry}
          className="aspect-video w-full transition-transform duration-300 group-hover/entry:scale-[1.02]"
        />
        <EntryBadges
          entry={entry}
          onPicture
          className="absolute top-3 right-3 left-3"
        />
      </div>
      <div className="flex flex-col gap-1 px-0.5">
        <span className="text-foreground text-[15px] leading-6 font-medium">
          {entry.title}
        </span>
        <p className="text-muted-foreground line-clamp-1 text-sm leading-5">
          {entry.summary}
        </p>
      </div>
    </ParamLink>
  )
}

/** List: a small 4:3 picture beside the title and summary. */
function EntryRow({ entry, href, ...rest }: EntryLinkProps) {
  return (
    <ParamLink
      {...rest}
      href={href}
      className="group/entry hover:bg-foreground/[0.03] focus-visible:ring-primary/30 -mx-3 flex items-center gap-4 rounded-xl p-3 transition-colors outline-none focus-visible:ring-2"
    >
      <div className="border-foreground/10 relative w-28 shrink-0 overflow-hidden rounded-lg border sm:w-36">
        <EntryPicture entry={entry} className="aspect-video w-full" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <EntryBadges entry={entry} />
        <span className="text-foreground text-[15px] leading-6 font-medium">
          {entry.title}
        </span>
        <p className="text-muted-foreground line-clamp-1 max-w-3xl text-sm leading-5">
          {entry.summary}
        </p>
      </div>
    </ParamLink>
  )
}

/** The entry's cover, or a calm placeholder with its area's mark. */
function EntryPicture({
  entry,
  className,
}: {
  entry: WhatsNewEntry
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  if (!entry.thumbnailUrl || failed)
    return (
      <div
        aria-hidden
        className={cn(
          "bg-muted/50 text-muted-foreground/50 flex items-center justify-center",
          className,
        )}
      >
        <Sparkles className="size-6" />
      </div>
    )
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={entry.thumbnailUrl}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("bg-muted/50 object-cover object-center", className)}
    />
  )
}

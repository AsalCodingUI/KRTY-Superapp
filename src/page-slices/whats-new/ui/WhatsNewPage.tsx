"use client"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
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
import {
  Check,
  CheckCheck,
  ChevronRight,
  Copy,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { ready, error, level, canEdit, entries, read, setRead } = useWhatsNew()
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
    router.replace(params.size ? `${pathname}?${params}` : pathname, {
      scroll: false,
    })
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
  const unread = entries.filter((e) => e.published && !read.has(e.id))

  const tm = useT("ctxmenu")
  const itemsFor = (entry: WhatsNewEntry): CtxItem[] => [
    {
      id: "toggle-read",
      label: read.has(entry.id) ? t("markUnread") : t("markRead"),
      icon: read.has(entry.id) ? Sparkles : Check,
      onSelect: () => setRead([entry.id], !read.has(entry.id)),
    },
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
          <>
            <ViewToggle
              value={view}
              onValueChange={setView}
              modes={["grid", "list"]}
            />
            {canEdit && (
              <Button onClick={admin.create}>
                <Plus data-icon="inline-start" />
                <span className="max-sm:hidden">{t("write")}</span>
              </Button>
            )}
            {ready && entries.length > 0 ? (
              unread.length > 0 ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    setRead(
                      unread.map((e) => e.id),
                      true,
                    )
                  }
                >
                  <CheckCheck data-icon="inline-start" />
                  <span className="max-sm:hidden">{t("markAllRead")}</span>
                  <span className="sm:hidden">{t("markAllReadShort")}</span>
                </Button>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <CheckCheck className="size-4" />
                  {t("allRead")}
                </span>
              )
            ) : null}
          </>
        }
      />

      <div className="relative mb-3 w-full sm:max-w-sm">
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

      {/* Kind chips (when there are guides), then area chips: rows that
          scroll sideways on phones. */}
      {ready && hasGuides && (
        <div
          role="group"
          aria-label={t("kindLabel")}
          className="bleed gutter-x mb-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden"
        >
          <AreaChip active={!kind} onClick={() => setKind(null)}>
            {t("all")}
            <span className="tabular-nums opacity-60">{searched.length}</span>
          </AreaChip>
          {WHATS_NEW_KINDS.map((k) => (
            <AreaChip
              key={k}
              active={kind === k}
              onClick={() => {
                // An area chip may not exist in the other kind.
                const params = new URLSearchParams(searchParams.toString())
                if (kind === k) params.delete("kind")
                else params.set("kind", k)
                params.delete("area")
                router.replace(
                  params.size ? `${pathname}?${params}` : pathname,
                  { scroll: false },
                )
              }}
            >
              {t(k === "guides" ? "kindGuides" : "kindUpdates")}
              <span className="tabular-nums opacity-60">
                {searched.filter((e) => kindOf(e) === k).length}
              </span>
            </AreaChip>
          ))}
        </div>
      )}
      {ready && (
        <div
          role="group"
          aria-label={t("filterLabel")}
          className="bleed gutter-x mb-6 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap [&::-webkit-scrollbar]:hidden"
        >
          <AreaChip active={!area} onClick={() => setArea(null)}>
            {t("all")}
            <span className="tabular-nums opacity-60">{matching.length}</span>
          </AreaChip>
          {areas.map((a) => {
            const count = matching.filter((e) => e.area === a).length
            return (
              <AreaChip
                key={a}
                active={area === a}
                onClick={() => setArea(area === a ? null : a)}
              >
                {t(AREA_LABEL[a])}
                <span className="tabular-nums opacity-60">{count}</span>
              </AreaChip>
            )
          })}
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
                      router.replace(pathname, { scroll: false })
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
                        ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                        : "flex flex-col gap-3"
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
                          <EntryTile
                            entry={entry}
                            href={entryHref(entry.id)}
                            isRead={read.has(entry.id)}
                          />
                        ) : (
                          <EntryCard
                            entry={entry}
                            href={entryHref(entry.id)}
                            isRead={read.has(entry.id)}
                          />
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

function AreaChip({
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
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        active
          ? "bg-foreground text-background border-transparent"
          : "border-border text-foreground/80 hover:bg-foreground/[0.05]",
      )}
    >
      {children}
    </button>
  )
}

function EntryCard({
  entry,
  href,
  isRead,
  ...rest
}: {
  entry: WhatsNewEntry
  href: string
  isRead: boolean
  /** data-* from the right-click target. */
  [data: `data-${string}`]: string | undefined
}) {
  const t = useT("whatsNew")
  return (
    <Link
      {...rest}
      href={href}
      scroll={false}
      prefetch={false}
      className="group/entry bg-card border-foreground/10 hover:border-foreground/20 focus-visible:border-primary/50 focus-visible:ring-primary/20 relative flex gap-5 overflow-hidden rounded-xl border p-4 transition-[border-color] duration-200 outline-none focus-visible:ring-2 sm:p-5"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <EntryBadges entry={entry} />
        <EntryTitle title={entry.title} isRead={isRead} />
        <p className="text-muted-foreground line-clamp-2 max-w-4xl text-sm leading-5">
          {entry.summary}
        </p>
        <EntryFoot
          isRead={isRead}
          label={t("readGuide")}
          readLabel={t("read")}
        />
      </div>
      {entry.thumbnailUrl && (
        <EntryPicture
          entry={entry}
          className="border-border hidden aspect-[2/1] w-40 shrink-0 self-center rounded-lg border sm:block md:w-56"
        />
      )}
    </Link>
  )
}

/** Grid layout: picture on top, then tags, title, summary. */
function EntryTile({
  entry,
  href,
  isRead,
  ...rest
}: {
  entry: WhatsNewEntry
  href: string
  isRead: boolean
  /** data-* from the right-click target. */
  [data: `data-${string}`]: string | undefined
}) {
  const t = useT("whatsNew")
  return (
    <Link
      {...rest}
      href={href}
      scroll={false}
      prefetch={false}
      className="group/entry bg-card border-foreground/10 hover:border-foreground/20 focus-visible:border-primary/50 focus-visible:ring-primary/20 flex flex-col overflow-hidden rounded-xl border transition-[border-color] duration-200 outline-none focus-visible:ring-2"
    >
      <EntryPicture
        entry={entry}
        className="border-border aspect-[2/1] w-full border-b"
      />
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <EntryBadges entry={entry} />
        <EntryTitle title={entry.title} isRead={isRead} />
        <p className="text-muted-foreground line-clamp-2 text-sm leading-5">
          {entry.summary}
        </p>
        <EntryFoot
          isRead={isRead}
          label={t("readGuide")}
          readLabel={t("read")}
        />
      </div>
    </Link>
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

function EntryTitle({ title, isRead }: { title: string; isRead: boolean }) {
  const t = useT("whatsNew")
  return (
    <span className="text-foreground flex items-start gap-2 text-[15px] leading-6 font-medium">
      {!isRead && (
        <span
          className="bg-primary mt-2 size-2 shrink-0 rounded-full"
          role="img"
          aria-label={t("unread")}
        />
      )}
      <span className="min-w-0">{title}</span>
    </span>
  )
}

function EntryFoot({
  isRead,
  label,
  readLabel,
}: {
  isRead: boolean
  label: string
  readLabel: string
}) {
  return (
    <span className="text-muted-foreground mt-auto flex items-center gap-3 pt-1 text-[13px]">
      <span className="text-foreground/80 group-hover/entry:text-foreground inline-flex items-center gap-0.5 font-medium">
        {label}
        <ChevronRight className="size-3.5 transition-transform group-hover/entry:translate-x-0.5" />
      </span>
      {isRead && (
        <span className="inline-flex items-center gap-1">
          <Check className="size-3.5" />
          {readLabel}
        </span>
      )}
    </span>
  )
}

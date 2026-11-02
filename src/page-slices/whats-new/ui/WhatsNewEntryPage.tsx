"use client"

import { EmptyState } from "@/components/empty-state"
import { ZoomableImage } from "@/components/image-lightbox"
import { Markdown } from "@/components/markdown"
import { PageHeader } from "@/components/page-header"
import { useBreadcrumbs } from "@/components/page-breadcrumbs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { siteConfig } from "@/app/siteConfig"
import { cn } from "@/lib/utils"
import { guideFor, type GuideSection } from "../model/sections"
import { isGuide, type WhatsNewEntry } from "../model/types"
import { useWhatsNewAdmin } from "./WhatsNewEditor"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { format } from "date-fns"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ListTree,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useWhatsNew } from "../model/use-whats-new"
import { dayOf, EntryBadges } from "./shared"

const HREF = siteConfig.baseLinks.whatsNew

/** One entry's guide: sections with a table of contents, read state, and
 *  the neighbouring entries. */
export function WhatsNewEntryPage({ id }: { id: string }) {
  const t = useT("whatsNew")
  const { ready, level, canEdit, entries, read, setRead } = useWhatsNew()
  const admin = useWhatsNewAdmin()
  const found = entries.find((e) => e.id === id) ?? null
  // Neighbours of the same kind: guides page through guides, updates
  // through updates.
  const siblings = found
    ? entries.filter((e) => isGuide(e) === isGuide(found))
    : []
  const index = siblings.findIndex((e) => e.id === id)
  const entry = found
  const guide = useMemo(
    () => (entry ? guideFor(entry, level) : null),
    [entry, level],
  )

  // Opening the guide counts as reading it.
  useEffect(() => {
    if (ready && entry) setRead([entry.id], true)
    // Only on open, so "Tandai belum dibaca" sticks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, entry?.id])

  useBreadcrumbs(entry ? [{ label: entry.title }] : null)

  if (!ready)
    return (
      <div className="flex justify-center py-24">
        <Spinner className="size-6" />
      </div>
    )
  if (!entry)
    return (
      <div className="flex flex-col">
        <PageHeader
          className="pt-6 pb-4"
          title={t("title")}
          back={{ href: HREF, label: t("backToList") }}
        />
        <EmptyState
          title={t("notFoundTitle")}
          description={t("notFoundDescription")}
          icon={<Sparkles />}
        />
      </div>
    )

  const newer = siblings[index - 1]
  const older = siblings[index + 1]
  const isRead = read.has(entry.id)
  const sections = guide?.sections ?? []

  return (
    <div className="flex flex-col pb-12">
      <PageHeader
        className="pt-6 pb-2"
        title={t("title")}
        back={{ href: HREF, label: t("backToList") }}
        actions={
          canEdit ? (
            <>
              <Button variant="outline" onClick={() => admin.edit(entry)}>
                <Pencil data-icon="inline-start" />
                {t("edit")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("delete")}
                onClick={() => admin.remove(entry)}
              >
                <Trash2 />
              </Button>
            </>
          ) : null
        }
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_13rem] xl:gap-12">
        <article className="max-w-3xl min-w-0">
          <EntryHead entry={entry} />
          {sections.length > 2 && (
            <MobileToc sections={sections} className="mb-6 lg:hidden" />
          )}
          {entry.thumbnailUrl && (
            // The thumbnail, at its own 2:1 (pictures in the guide stay 4:3); opens large on a click.
            <ZoomableImage
              src={entry.thumbnailUrl}
              alt=""
              className="border-border mb-8 block aspect-[2/1] w-full rounded-lg border object-cover"
            />
          )}
          {guide?.intro && (
            <Markdown images className="mb-9">
              {guide.intro}
            </Markdown>
          )}
          <div className="flex flex-col gap-9">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-6">
                <h2 className="text-heading mb-3 text-lg font-semibold tracking-tight">
                  <a
                    href={`#${section.id}`}
                    className="outline-none hover:underline focus-visible:underline"
                  >
                    {section.title}
                  </a>
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

          <div className="border-border mt-10 flex flex-wrap items-center gap-3 border-t pt-5">
            <Button
              variant="outline"
              onClick={() => setRead([entry.id], !isRead)}
            >
              {isRead ? (
                <Sparkles data-icon="inline-start" />
              ) : (
                <Check data-icon="inline-start" />
              )}
              {isRead ? t("markUnread") : t("markRead")}
            </Button>
            {isRead && (
              <span className="text-muted-foreground inline-flex items-center gap-1 text-sm">
                <Check className="size-4" />
                {t("read")}
              </span>
            )}
          </div>

          <nav className="mt-6 grid gap-3 sm:grid-cols-2">
            {newer ? (
              <Neighbour entry={newer} label={t("previous")} side="prev" />
            ) : (
              <span className="max-sm:hidden" />
            )}
            {older && <Neighbour entry={older} label={t("next")} side="next" />}
          </nav>
        </article>

        {sections.length > 1 && (
          <aside className="hidden lg:block">
            <DesktopToc sections={sections} />
          </aside>
        )}
      </div>
      {admin.elements}
    </div>
  )
}

function EntryHead({ entry }: { entry: WhatsNewEntry }) {
  const dateLocale = useDateLocale()
  return (
    <header className="mt-4 mb-6 flex flex-col gap-3">
      <EntryBadges entry={entry} />
      <h1 className="text-heading text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-[28px]">
        {entry.title}
      </h1>
      <p className="text-muted-foreground text-[15px] leading-6">
        {entry.summary}
      </p>
      <time
        dateTime={entry.date}
        className="text-tertiary-foreground text-[13px] capitalize"
      >
        {format(dayOf(entry.date), "EEEE, d MMMM yyyy", { locale: dateLocale })}
      </time>
    </header>
  )
}

/** The section in view, for the table of contents. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  const key = ids.join(",")
  useEffect(() => {
    const els = key
      .split(",")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el))
    if (!els.length) return
    const observer = new IntersectionObserver(
      (records) => {
        const visible = records
          .filter((r) => r.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      // A band near the top of the screen decides which one is "current".
      { rootMargin: "0px 0px -70% 0px" },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [key])
  return active
}

function DesktopToc({ sections }: { sections: GuideSection[] }) {
  const t = useT("whatsNew")
  const seen = useActiveSection(sections.map((s) => s.id))
  // A click moves the marker at once and holds it there while the page
  // scrolls past the sections in between; then the scroll position leads.
  const [picked, setPicked] = useState<string | null>(null)
  const release = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(release.current), [])
  const active = picked ?? seen
  const list = useRef<HTMLDivElement>(null)
  const [bar, setBar] = useState<{ y: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const el = list.current?.querySelector<HTMLElement>(
      `[data-toc="${CSS.escape(active ?? "")}"]`,
    )
    if (el) setBar({ y: el.offsetTop, h: el.offsetHeight })
  }, [active, sections])

  return (
    <nav aria-label={t("toc")} className="sticky top-6 flex flex-col gap-2">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
        <ListTree className="size-3.5" />
        {t("toc")}
      </p>
      {/* One marker that glides along a faint track to the current section
          (transform + height, strong ease-out), not a border per item. */}
      <div ref={list} className="relative flex flex-col">
        <span
          aria-hidden
          className="bg-border absolute top-0 bottom-0 left-0 w-px"
        />
        {bar && (
          <span
            aria-hidden
            className="bg-foreground absolute top-0 left-0 w-0.5 -translate-x-[0.5px] rounded-full transition-[transform,height] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
            style={{
              transform: `translateY(${bar.y}px)`,
              height: bar.h,
            }}
          />
        )}
        {sections.map((s) => (
          <a
            key={s.id}
            data-toc={s.id}
            href={`#${s.id}`}
            aria-current={active === s.id ? "location" : undefined}
            onClick={(e) => {
              const target = document.getElementById(s.id)
              if (!target) return
              e.preventDefault()
              setPicked(s.id)
              window.clearTimeout(release.current)
              release.current = window.setTimeout(() => setPicked(null), 900)
              target.scrollIntoView({ behavior: "smooth", block: "start" })
              history.replaceState(null, "", `#${s.id}`)
            }}
            className={cn(
              "py-1.5 pl-3.5 text-[13px] leading-5 transition-colors duration-200",
              active === s.id
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.title}
          </a>
        ))}
      </div>
    </nav>
  )
}

function MobileToc({
  sections,
  className,
}: {
  sections: GuideSection[]
  className?: string
}) {
  const t = useT("whatsNew")
  return (
    <details
      className={cn(
        "border-border bg-muted/30 group/toc rounded-xl border",
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium select-none [&::-webkit-details-marker]:hidden">
        <ListTree className="text-muted-foreground size-4" />
        {t("toc")}
        <span className="text-muted-foreground tabular-nums">
          {sections.length}
        </span>
        <ChevronRight className="text-muted-foreground ml-auto size-4 transition-transform group-open/toc:rotate-90" />
      </summary>
      <ol className="flex flex-col px-4 pb-3">
        {sections.map((s, i) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="text-foreground/80 hover:text-foreground flex gap-2 py-1.5 text-sm"
            >
              <span className="text-muted-foreground w-4 tabular-nums">
                {i + 1}
              </span>
              {s.title}
            </a>
          </li>
        ))}
      </ol>
    </details>
  )
}

function Neighbour({
  entry,
  label,
  side,
}: {
  entry: WhatsNewEntry
  label: string
  side: "prev" | "next"
}) {
  return (
    <Link
      href={`${HREF}/${entry.id}`}
      prefetch={false}
      className={cn(
        "border-foreground/10 hover:border-foreground/20 flex flex-col gap-0.5 rounded-xl border px-4 py-3 transition-colors",
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
    </Link>
  )
}

"use client"

import { useRealtimeRefresh } from "@/shared/hooks/useRealtimeRefresh"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListGroup, ListRow } from "@/components/grouped-list"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { briefProgress } from "@/shared/lib/briefs/brief"
import type { BriefStatus } from "@/shared/lib/briefs/types"
import { replaceUrl } from "@/shared/lib/url-params"
import { RiSearchLine } from "@/shared/ui/lucide-icons"
import { format, parseISO } from "date-fns"
import { FileText } from "@/components/icons"
import dynamic from "next/dynamic"
import { usePathname, useSearchParams } from "next/navigation"
import { useState } from "react"
import { BRIEFS_KEY, useBriefs, type BriefListRow } from "../model/data"
import { BriefStatusDot, SetChips, STATUS_LABEL_KEYS } from "./shared"

const BriefDialog = dynamic(
  () => import("./BriefDialog").then((m) => m.BriefDialog),
  {
    ssr: false,
  },
)
const BriefCreateDialog = dynamic(
  () => import("./BriefCreateDialog").then((m) => m.BriefCreateDialog),
  { ssr: false },
)

/** Newest work first: what came in, what's being filled, sent, drafts. */
const GROUPS: BriefStatus[] = ["submitted", "in_progress", "sent", "draft"]

/**
 * The briefs (Dokumen): all of them, or one project's. A row opens the
 * brief as a dialog (?brief=<id>, so a notification can link to it).
 */
export function BriefsView({
  projectId,
  canManage,
  createOpen,
  onCreateOpenChange,
  search = true,
  query: outerQuery,
}: {
  projectId?: string
  canManage: boolean
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
  search?: boolean
  /** Search text from a toolbar outside (hides the built-in field). */
  query?: string
}) {
  const t = useT("briefs")
  const pathname = usePathname()
  const params = useSearchParams()
  const { data: briefs = [], isPending } = useBriefs(projectId)
  // Live: a client's answers and status land as they fill it in.
  useRealtimeRefresh(`briefs:${projectId ?? "all"}`, [
    {
      table: "briefs",
      ...(projectId ? { filter: `project_id=eq.${projectId}` } : {}),
      keys: () => [BRIEFS_KEY],
    },
  ])
  const [ownQuery, setQuery] = useState("")
  const query = outerQuery ?? ownQuery
  const openId = params.get("brief")

  const hrefWith = (id: string | null) => {
    const next = new URLSearchParams(params.toString())
    if (id) next.set("brief", id)
    else next.delete("brief")
    return next.size ? `${pathname}?${next}` : pathname
  }
  const open = (id: string | null) => replaceUrl(hrefWith(id), Boolean(id))

  const needle = query.trim().toLowerCase()
  const shown = needle
    ? briefs.filter((b) =>
        `${b.title} ${b.client?.name ?? ""} ${b.project?.name ?? ""}`
          .toLowerCase()
          .includes(needle),
      )
    : briefs

  return (
    <div className="flex flex-col gap-3">
      {search && outerQuery === undefined && briefs.length > 0 && (
        <div className="relative w-full max-w-xs">
          <RiSearchLine className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            type="search"
            value={query}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}
      {isPending ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-6" />
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          title={projectId ? t("projectEmpty") : t("emptyTitle")}
          description={projectId ? undefined : t("emptyDescription")}
          icon={<FileText />}
          placement={projectId ? "inner" : undefined}
          action={
            canManage
              ? {
                  label: t("newBrief"),
                  onClick: () => onCreateOpenChange(true),
                }
              : undefined
          }
        />
      ) : (
        <GroupedList>
          {GROUPS.map((status) => {
            const items = shown.filter((b) => b.status === status)
            if (!items.length) return null
            return (
              <ListGroup
                key={status}
                icon={<BriefStatusDot status={status} />}
                label={t(STATUS_LABEL_KEYS[status])}
                count={items.length}
                storageKey={`briefs:list-group:${status}`}
              >
                {items.map((brief) => (
                  <BriefRow
                    key={brief.id}
                    brief={brief}
                    showProject={!projectId}
                    onOpen={() => open(brief.id)}
                  />
                ))}
              </ListGroup>
            )
          })}
        </GroupedList>
      )}

      {openId && (
        <BriefDialog
          briefId={openId}
          canManage={canManage}
          onClose={() => open(null)}
        />
      )}
      {canManage && createOpen && (
        <BriefCreateDialog
          open={createOpen}
          onOpenChange={onCreateOpenChange}
          defaultProjectId={projectId}
          onCreated={(id) => open(id)}
        />
      )}
    </div>
  )
}

function BriefRow({
  brief,
  showProject,
  onOpen,
}: {
  brief: BriefListRow
  showProject: boolean
  onOpen: () => void
}) {
  const t = useT("briefs")
  const dateLocale = useDateLocale()
  const progress = briefProgress(
    brief.sections,
    brief.sets,
    brief.answers,
    brief.files,
  )
  const meta = [
    brief.client?.name,
    showProject ? (brief.project?.name ?? t("noProject")) : null,
  ].filter(Boolean)
  return (
    <ListRow desc>
      <FileText className="text-muted-foreground size-4 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col">
        <button
          type="button"
          onClick={onOpen}
          className="text-foreground truncate text-left outline-none after:absolute after:inset-0 focus-visible:underline"
        >
          {brief.title}
        </button>
        <span className="text-tertiary-foreground text-meta truncate">
          {meta.join(" · ")}
        </span>
      </div>
      <SetChips sets={brief.sets} className="hidden md:flex" />
      <span className="text-muted-foreground text-meta hidden w-24 shrink-0 text-right tabular-nums sm:block">
        {t("progress", { answered: progress.answered, total: progress.total })}
      </span>
      <span className="text-muted-foreground text-meta w-20 shrink-0 text-right tabular-nums">
        {format(parseISO(brief.updated_at), "d MMM", { locale: dateLocale })}
      </span>
    </ListRow>
  )
}

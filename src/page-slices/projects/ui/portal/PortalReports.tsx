"use client"

import { useCanonicalParam } from "@/shared/hooks/useCanonicalParam"
import { findByLinkKey, linkKey } from "@/shared/lib/url-params"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { PageHeader } from "@/components/page-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { RiFilePaperLine } from "@/shared/ui/lucide-icons"
import { format, parseISO } from "date-fns"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { PortalReportDialog } from "./PortalReportDialog"

export type PortalReport = {
  id: string
  title: string
  body: string
  report_date: string
  author: { full_name: string | null; avatar_url: string | null } | null
}

const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_12rem_7rem]"

/** The reports shared with the client, as on the team's Report page. */
export function PortalReports({ reports }: { reports: PortalReport[] }) {
  const t = useT("projects")
  const dateLocale = useDateLocale()
  const router = useRouter()
  const pathname = usePathname()
  // The open report lives in the URL (?report=…), so a link can open it.
  const openId = useSearchParams().get("report")
  const openReport = findByLinkKey(reports, openId) ?? null
  useCanonicalParam(
    "report",
    openId,
    openReport && linkKey(openReport.title, openReport.id),
  )
  // Opening adds a history entry, so Back closes the report first.
  const setOpen = (report: PortalReport | null) =>
    report
      ? router.push(`${pathname}?report=${linkKey(report.title, report.id)}`, {
          scroll: false,
        })
      : router.replace(pathname, { scroll: false })
  // A link to a report that's gone or no longer shared: drop the id.
  useEffect(() => {
    if (openId && !openReport) router.replace(pathname, { scroll: false })
  }, [openId, openReport, pathname, router])

  return (
    <div className="flex flex-col">
      <PageHeader className="pt-6 pb-4" title={t("sectionReports")} />
      {reports.length === 0 ? (
        <EmptyState
          title={t("reportsEmpty")}
          icon={<RiFilePaperLine className="size-5" />}
          placement="inner"
        />
      ) : (
        <GroupedList>
          {reports.map((r) => {
            const name = r.author?.full_name || t("unknownMember")
            return (
              <ListRow
                key={r.id}
                role="link"
                tabIndex={0}
                className={cn(ROW_GRID, "min-h-14 cursor-pointer")}
                onClick={() => setOpen(r)}
                onKeyDown={(e) => e.key === "Enter" && setOpen(r)}
              >
                <span className="text-foreground truncate">{r.title}</span>
                <div className="hidden min-w-0 items-center gap-2 md:flex">
                  <Avatar className="size-6">
                    <AvatarImage src={r.author?.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground truncate text-[13px]">
                    {name}
                  </span>
                </div>
                <span className="text-tertiary-foreground text-right text-[13px] tabular-nums">
                  {format(parseISO(r.report_date), "d MMM yyyy", {
                    locale: dateLocale,
                  })}
                </span>
              </ListRow>
            )
          })}
        </GroupedList>
      )}
      <PortalReportDialog report={openReport} onClose={() => setOpen(null)} />
    </div>
  )
}

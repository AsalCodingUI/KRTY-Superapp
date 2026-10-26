"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { PageHeader } from "@/components/page-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { RiAddLine, RiFilePaperLine } from "@/shared/ui/lucide-icons"
import { format, parseISO } from "date-fns"
import { Link2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useViewer } from "./data"
import { RowMenu } from "./ProjectLibrary"
import { ReportDialog, reportShareUrl } from "./ReportDialog"
import {
  deleteReport,
  useInvalidateReports,
  useReports,
  type Report,
} from "./reports-data"

const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_2rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_12rem_7rem_2rem]"

/**
 * Daily reports of the project: one Markdown note per report (images,
 * links, lists), newest first. "Report hari ini" starts one titled
 * "Report - @26 Oktober 2026"; each can be shared alone with the client.
 */
export function ProjectReports({ projectId }: { projectId: string }) {
  const t = useT("projects")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const viewer = useViewer()
  const { data: reports = [], isLoading } = useReports(projectId)
  const invalidate = useInvalidateReports(projectId)
  const [open, setOpen] = useState<{ report: Report | null } | null>(null)
  const [removing, setRemoving] = useState<Report | null>(null)

  // "Report - @26 Oktober 2026" (English: "@October 26, 2026").
  const today = new Date()
  const defaultTitle = t("reportDefaultTitle", {
    date: format(
      today,
      dateLocale.code?.startsWith("en") ? "MMMM d, yyyy" : "d MMMM yyyy",
      { locale: dateLocale },
    ),
  })

  const canEdit = (r: Report | null) =>
    !r || viewer.isAdmin || r.author_id === viewer.id

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        title={t("sectionReports")}
        actions={
          <Button onClick={() => setOpen({ report: null })}>
            <RiAddLine data-icon="inline-start" />
            {t("reportNew")}
          </Button>
        }
      />
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-6" />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          title={t("reportsEmpty")}
          description={t("reportsEmptyHint")}
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
                className={cn(ROW_GRID, "min-h-14 cursor-pointer")}
                onClick={() => setOpen({ report: r })}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-foreground truncate">{r.title}</span>
                  {r.share_token && (
                    <Badge variant="info" className="shrink-0">
                      <Link2 data-icon="inline-start" />
                      {t("reportShared")}
                    </Badge>
                  )}
                </div>
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
                <span className="text-tertiary-foreground hidden text-right text-[13px] tabular-nums md:block">
                  {format(parseISO(r.report_date), "d MMM yyyy", {
                    locale: dateLocale,
                  })}
                </span>
                <RowMenu
                  label={r.title}
                  items={[
                    {
                      label: t("libOpen"),
                      onSelect: () => setOpen({ report: r }),
                    },
                    ...(r.share_token
                      ? [
                          {
                            label: t("reportCopyLink"),
                            onSelect: () =>
                              void navigator.clipboard
                                .writeText(reportShareUrl(r.share_token!))
                                .then(() =>
                                  toast.success(t("reportLinkCopied")),
                                ),
                          },
                        ]
                      : []),
                    ...(canEdit(r)
                      ? [
                          {
                            label: tc("delete"),
                            destructive: true,
                            separatorBefore: true,
                            onSelect: () => setRemoving(r),
                          },
                        ]
                      : []),
                  ]}
                />
              </ListRow>
            )
          })}
        </GroupedList>
      )}

      <ReportDialog
        open={Boolean(open)}
        onOpenChange={(o) => !o && setOpen(null)}
        report={open?.report ?? null}
        defaultTitle={defaultTitle}
        projectId={projectId}
        viewerId={viewer.id}
        canEdit={canEdit(open?.report ?? null)}
        onSaved={invalidate}
      />

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={t("deleteNamedTitle", { name: removing?.title ?? "" })}
        description={
          removing?.share_token ? t("reportDeleteShared") : undefined
        }
        confirmText={tc("delete")}
        cancelText={tc("cancel")}
        variant="destructive"
        onConfirm={async () => {
          if (!removing) return
          try {
            await deleteReport(removing)
            toast.success(t("reportDeleted"))
          } catch {
            toast.error(t("errDelete"))
          }
          setRemoving(null)
          invalidate()
        }}
      />
    </div>
  )
}

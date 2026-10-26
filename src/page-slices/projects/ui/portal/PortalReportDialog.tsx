"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { MarkdownDocEditor } from "@/page-slices/policies/ui/doc-editor"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { RiCloseLine } from "@/shared/ui/lucide-icons"
import { format, parseISO } from "date-fns"
import { useRef } from "react"

export type PortalReportDetail = {
  id: string
  title: string
  body: string
  report_date: string
  author: { full_name: string | null } | null
}

/**
 * A shared report opened from the portal: the team's report window (the
 * same size, the same typeset document) with nothing to edit.
 */
export function PortalReportDialog({
  report,
  onClose,
}: {
  report: PortalReportDetail | null
  onClose: () => void
}) {
  const t = useT("projects")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  // The last report stays on screen while the window animates closed.
  const last = useRef<PortalReportDetail | null>(null)
  if (report) last.current = report
  const open = Boolean(report)
  report = report ?? last.current

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        bare
        showCloseButton={false}
        className="flex h-[min(56rem,92svh)] w-full flex-col overflow-hidden p-0 sm:max-w-5xl"
      >
        {report && (
          <>
            <header className="border-border flex shrink-0 items-center gap-3 border-b px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <DialogTitle className="text-heading truncate text-lg font-medium">
                  {report.title}
                </DialogTitle>
                <p className="text-muted-foreground truncate text-[13px]">
                  {[
                    format(parseISO(report.report_date), "d MMMM yyyy", {
                      locale: dateLocale,
                    }),
                    report.author?.full_name,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={tc("close")}
                onClick={onClose}
              >
                <RiCloseLine />
              </Button>
            </header>
            {report.body.trim() ? (
              <MarkdownDocEditor
                key={report.id}
                readOnly
                value={report.body}
                ariaLabel={t("reportBody")}
                className="flex-1"
                onChange={() => {}}
              />
            ) : (
              <p className="text-muted-foreground flex-1 py-16 text-center text-sm">
                {t("reportsEmpty")}
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

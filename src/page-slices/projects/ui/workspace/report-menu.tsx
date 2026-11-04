"use client"

import { copyText, type CtxItem } from "@/shared/context-menu"
import { useProjectHref } from "@/shared/hooks/useProjectHref"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { linkKey } from "@/shared/lib/url-params"
import { formatDistanceToNow } from "date-fns"
import {
  AppWindow,
  CopyPlus,
  Eye,
  FileText,
  Link as LinkIcon,
  Link2,
  Link2Off,
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
} from "@/components/icons"
import { toast } from "sonner"
import { useViewer, useWorkspace } from "./data"
import { useReportViews } from "./report-views-data"
import {
  createReport,
  deleteReport,
  newShareToken,
  registerShareUndo,
  reportShareUrl,
  updateReport,
  useInvalidateReports,
  withReportBody,
  type ReportSummary,
} from "./reports-data"

const DEVICE_ICONS = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
} as const

/** The newest reads listed in the menu; the report window has them all. */
const MAX_READS = 10

/**
 * The right-click menu of a report (Report page rows, the dashboard's
 * latest reports): open, share / copy the client link / stop sharing, who
 * read it, duplicate as a new report, delete. Sharing and deleting are the
 * author's or an admin's, as in the report window; anyone may duplicate
 * (anyone can write a report).
 */
export function useReportMenu(projectId: string) {
  const t = useT("projects")
  const tu = useT("undo")
  const tc = useT("common")
  const tm = useT("ctxmenu")
  const dateLocale = useDateLocale()
  const viewer = useViewer()
  const projectName = useWorkspace(projectId).data?.project?.name
  const reportsHref = useProjectHref(projectId, "reports")
  const { data: views } = useReportViews(projectId)
  const invalidate = useInvalidateReports(projectId)

  const canEdit = (r: ReportSummary) =>
    viewer.isAdmin || r.author_id === viewer.id
  const teamLink = (r: ReportSummary) =>
    new URL(
      `${reportsHref}?report=${linkKey(r.title, r.id)}`,
      window.location.origin,
    ).href

  const setShared = async (r: ReportSummary, on: boolean) => {
    try {
      const next = await updateReport(
        r.id,
        on
          ? {
              share_token: newShareToken(),
              shared_at: new Date().toISOString(),
            }
          : { share_token: null, shared_at: null },
      )
      invalidate()
      registerShareUndo({
        before: r,
        after: next,
        label: tu(on ? "reportShare" : "reportUnshare", { title: r.title }),
        done: () => invalidate(),
      })
      if (on && next.share_token) {
        await copyText(reportShareUrl(next.share_token, projectName))
        toast.success(t("reportLinkCreated"))
      } else toast.success(t("reportLinkOff"))
    } catch {
      toast.error(t("errShareReport"))
    }
  }

  /** The client's reads of a report, newest first (device · link / portal). */
  const readItems = (reportId: string, onOpen?: () => void): CtxItem[] => {
    const list = views?.get(reportId) ?? []
    if (!list.length)
      return [{ id: "none", label: t("reportViewsEmpty"), disabled: true }]
    const items: CtxItem[] = list.slice(0, MAX_READS).map((v) => ({
      id: v.id,
      label: formatDistanceToNow(new Date(v.viewed_at), {
        addSuffix: true,
        locale: dateLocale,
      }),
      icon: DEVICE_ICONS[v.device ?? "desktop"],
      hint: [
        t(v.source === "portal" ? "reportViewPortal" : "reportViewLink"),
        v.country,
      ]
        .filter(Boolean)
        .join(" · "),
      onSelect: onOpen,
    }))
    if (list.length > MAX_READS)
      items.push({
        id: "more",
        label: t("reportViews", { count: String(list.length) }),
        icon: Eye,
        onSelect: onOpen,
      })
    return items
  }

  const items = (
    r: ReportSummary,
    {
      onOpen,
      onDelete,
    }: {
      /** Opens a report in place (this one, or the new copy). */
      onOpen: (report: ReportSummary) => void
      /** Asks before deleting; without it the menu's own confirm does. */
      onDelete?: () => void
    },
  ): CtxItem[] => {
    const editable = canEdit(r)
    const reads = views?.get(r.id)?.length ?? 0
    return [
      {
        id: "open",
        label: t("libOpen"),
        icon: FileText,
        shortcut: "Enter",
        onSelect: () => onOpen(r),
      },
      {
        id: "open-tab",
        label: tm("openNewTab"),
        icon: AppWindow,
        onSelect: () => void window.open(teamLink(r), "_blank", "noopener"),
      },
      {
        id: "copy-team-link",
        label: t("ctxCopyInternalLink"),
        icon: LinkIcon,
        onSelect: async () => {
          if (await copyText(teamLink(r))) toast.success(tm("linkCopied"))
        },
      },
      {
        id: "share",
        label: t("reportShare"),
        icon: Link2,
        hidden: Boolean(r.share_token) || !editable,
        onSelect: () => setShared(r, true),
      },
      {
        id: "copy-client-link",
        label: t("ctxCopyClientLink"),
        icon: Link2,
        hidden: !r.share_token,
        onSelect: async () => {
          if (await copyText(reportShareUrl(r.share_token!, projectName)))
            toast.success(t("reportLinkCopied"))
        },
      },
      {
        id: "stop-sharing",
        label: t("reportStopSharing"),
        icon: Link2Off,
        hidden: !r.share_token || !editable,
        destructive: true,
        confirm: true,
        onSelect: () => setShared(r, false),
      },
      {
        id: "reads",
        label: t("ctxReportReads"),
        icon: Eye,
        hint: reads ? String(reads) : undefined,
        // Only shared reports (or once-shared ones) get read.
        hidden: !r.share_token && !reads,
        submenu: readItems(r.id, () => onOpen(r)),
      },
      {
        id: "duplicate",
        label: t("ctxReportDuplicate"),
        icon: CopyPlus,
        hidden: !viewer.id,
        onSelect: async () => {
          try {
            const copy = await createReport({
              projectId,
              authorId: viewer.id!,
              title: t("ctxCopyOf", { name: r.title }).slice(0, 160),
              body: (await withReportBody(r)).body,
            })
            invalidate()
            toast.success(t("ctxReportDuplicated"))
            onOpen(copy)
          } catch {
            toast.error(t("errSaveReport"))
          }
        },
      },
      {
        id: "delete",
        label: tc("delete"),
        icon: Trash2,
        destructive: true,
        hidden: !editable,
        confirm: !onDelete,
        onSelect: async () => {
          if (onDelete) return onDelete()
          try {
            await deleteReport(r)
            toast.success(t("reportDeleted"))
          } catch {
            toast.error(t("errDelete"))
          }
          invalidate()
        },
      },
    ]
  }

  return { items, readItems }
}

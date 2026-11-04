"use client"

import { surfaceClassName } from "@/components/panel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { differenceInCalendarDays, format, parseISO } from "date-fns"
import {
  AppWindow,
  CircleDashed,
  Copy,
  FileText,
  Link as LinkIcon,
  Link2,
  Newspaper,
} from "lucide-react"
import { ContextTarget, copyText } from "@/shared/context-menu"
import { linkKey } from "@/shared/lib/url-params"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRef, useState } from "react"
import type { TaskRow, TeamMember } from "./data"
import {
  useInvalidateReports,
  useLatestReports,
  type ReportSummary,
} from "./reports-data"
import { useReportMenu } from "./report-menu"
import { dueLabel, initials } from "./task-utils"

// The task and report windows (editor, Markdown) load on first open, not
// with the dashboard.
const ProjectTaskDialog = dynamic(
  () => import("./ProjectTaskDialog").then((m) => m.ProjectTaskDialog),
  { loading: () => null },
)
const ReportDialog = dynamic(
  () => import("./ReportDialog").then((m) => m.ReportDialog),
  { loading: () => null },
)

/** A dashboard panel (the Proses one's look): a thin header with a "see
 *  all" link, then rows. */
function Panel({
  title,
  href,
  children,
}: {
  title: string
  href: string
  children: React.ReactNode
}) {
  const t = useT("projects")
  return (
    <section className={cn(surfaceClassName, "flex min-w-0 flex-col")}>
      <header className="flex h-11 items-center justify-between gap-3 border-b px-4">
        <h2 className="truncate text-sm font-medium">{title}</h2>
        <Link
          href={href}
          prefetch={false}
          className="text-muted-foreground hover:text-foreground text-[13px] transition-colors"
        >
          {t("portalSeeAll")}
        </Link>
      </header>
      {children}
    </section>
  )
}

const ROW =
  "border-border/50 hover:bg-muted/40 flex h-11 w-full items-center gap-3 border-b px-4 text-left text-sm transition-colors last:border-b-0"

/** Open tasks by due date (overdue first, undated last), opened in place. */
export function UpcomingTasks({
  projectId,
  base,
  tasks,
  team,
}: {
  projectId: string
  base: string
  tasks: TaskRow[]
  team: TeamMember[]
}) {
  const t = useT("projects")
  const tc = useT("common")
  const tm = useT("ctxmenu")
  const dateLocale = useDateLocale()
  // The last opened task stays set while the dialog animates closed.
  const [openId, setOpenId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const upcoming = tasks
    .filter((task) => !task.done && !task.parent_id)
    .sort(
      (a, b) =>
        (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") ||
        a.created_at.localeCompare(b.created_at),
    )
    .slice(0, 5)

  return (
    <Panel title={t("homeUpcomingTasks")} href={`${base}/tasks`}>
      {upcoming.length === 0 ? (
        <p className="text-muted-foreground px-4 py-8 text-center text-sm">
          {t("homeNoOpenTasks")}
        </p>
      ) : (
        <ul className="flex flex-col">
          {upcoming.map((task) => {
            const who = team.find((m) => m.id === task.assignee_id)
            const overdue =
              task.due_date &&
              differenceInCalendarDays(parseISO(task.due_date), new Date()) < 0
            const openHere = () => {
              setOpenId(task.id)
              setOpen(true)
            }
            const link = () =>
              new URL(
                `${base}/tasks?task=${linkKey(task.title, task.id)}`,
                window.location.origin,
              ).href
            return (
              <ContextTarget
                key={task.id}
                type="dashboard-task"
                id={task.id}
                label={task.title}
                suppress={["button"]}
                items={() => [
                  {
                    id: "open",
                    label: t("libOpen"),
                    icon: FileText,
                    shortcut: "Enter",
                    onSelect: openHere,
                  },
                  {
                    id: "open-tab",
                    label: tm("openNewTab"),
                    icon: AppWindow,
                    onSelect: () =>
                      void window.open(link(), "_blank", "noopener"),
                  },
                  {
                    id: "copy-link",
                    label: tm("copyLink"),
                    icon: LinkIcon,
                    onSelect: async () => {
                      if (await copyText(link()))
                        toast.success(tm("linkCopied"))
                    },
                  },
                  {
                    id: "copy-title",
                    label: t("ctxCopyTitle"),
                    icon: Copy,
                    onSelect: async () => {
                      if (await copyText(task.title))
                        toast.success(tm("copied"))
                    },
                  },
                ]}
              >
                <li>
                  <button type="button" onClick={openHere} className={ROW}>
                    <CircleDashed className="text-muted-foreground size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">
                      {task.title}
                    </span>
                    {task.due_date && (
                      <span
                        className={cn(
                          "shrink-0 text-[13px] tabular-nums",
                          overdue
                            ? "text-destructive font-medium"
                            : "text-tertiary-foreground",
                        )}
                      >
                        {dueLabel(task.due_date, dateLocale, {
                          today: tc("today"),
                          tomorrow: t("tomorrow"),
                        })}
                      </span>
                    )}
                    {who && (
                      <Avatar className="size-5" title={who.full_name ?? ""}>
                        <AvatarImage src={who.avatar_url || undefined} alt="" />
                        <AvatarFallback className="text-[9px]">
                          {initials(who.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </button>
                </li>
              </ContextTarget>
            )
          })}
        </ul>
      )}
      {/* Mounted from the first open on (openId stays set after). */}
      {openId && (
        <ProjectTaskDialog
          projectId={projectId}
          taskId={openId}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </Panel>
  )
}

/** The latest reports (shared ones marked), opened in place. */
export function LatestReports({
  projectId,
  base,
  onOpen,
}: {
  projectId: string
  base: string
  onOpen: (report: ReportSummary) => void
}) {
  const t = useT("projects")
  const dateLocale = useDateLocale()
  const { data: latest = [] } = useLatestReports(projectId, 4)
  const menu = useReportMenu(projectId)

  return (
    <Panel title={t("portalLatestReports")} href={`${base}/reports`}>
      {latest.length === 0 ? (
        <p className="text-muted-foreground px-4 py-8 text-center text-sm">
          {t("reportsEmpty")}
        </p>
      ) : (
        <ul className="flex flex-col">
          {latest.map((r) => (
            <ContextTarget
              key={r.id}
              type="project-report"
              id={r.id}
              label={r.title}
              suppress={["button"]}
              items={() => menu.items(r, { onOpen })}
            >
              <li>
                <button type="button" onClick={() => onOpen(r)} className={ROW}>
                  <Newspaper className="text-muted-foreground size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{r.title}</span>
                  {r.share_token && (
                    <Link2
                      aria-label={t("reportShared")}
                      className="text-muted-foreground size-3.5 shrink-0"
                    >
                      <title>{t("reportShared")}</title>
                    </Link2>
                  )}
                  <span className="text-tertiary-foreground shrink-0 text-[13px] tabular-nums">
                    {format(parseISO(r.report_date), "d MMM", {
                      locale: dateLocale,
                    })}
                  </span>
                </button>
              </li>
            </ContextTarget>
          ))}
        </ul>
      )}
    </Panel>
  )
}

/** The report window for the dashboard (new or opened from the list). */
export function DashboardReportDialog({
  projectId,
  viewer,
  open,
  onClose,
}: {
  projectId: string
  viewer: { id: string | null; isAdmin: boolean }
  /** `null` report = a new one. */
  open: { report: ReportSummary | null } | null
  onClose: () => void
}) {
  const t = useT("projects")
  const dateLocale = useDateLocale()
  const invalidate = useInvalidateReports(projectId)
  // Keep showing the last report while the window animates closed.
  const last = useRef<ReportSummary | null>(null)
  // The window (and its editor) loads on the first open.
  const opened = useRef(false)
  if (open) {
    last.current = open.report
    opened.current = true
  }
  const report = open ? open.report : last.current
  if (!opened.current) return null
  const defaultTitle = t("reportDefaultTitle", {
    date: format(
      new Date(),
      dateLocale.code?.startsWith("en") ? "MMMM d, yyyy" : "d MMMM yyyy",
      { locale: dateLocale },
    ),
  })
  return (
    <ReportDialog
      open={Boolean(open)}
      onOpenChange={(o) => !o && onClose()}
      report={report}
      defaultTitle={defaultTitle}
      projectId={projectId}
      viewerId={viewer.id}
      canEdit={!report || viewer.isAdmin || report.author_id === viewer.id}
      onSaved={invalidate}
    />
  )
}

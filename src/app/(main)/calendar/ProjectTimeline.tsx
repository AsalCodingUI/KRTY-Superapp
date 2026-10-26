"use client"

import { ProjectAvatar, projectColorVar } from "@/components/project-avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { STATUS_LABEL_KEYS } from "@/page-slices/projects/lib/status"
import { ProjectStatusIcon } from "@/page-slices/projects/ui/ProjectStatusIcon"
import { StatusDot } from "@/page-slices/projects/ui/workspace/TaskBoard"
import {
  STATUS_LABEL,
  statusOf,
} from "@/page-slices/projects/ui/workspace/task-data"
import type { TaskRow } from "@/page-slices/projects/ui/workspace/data"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { cx } from "@/shared/lib/utils"
import {
  RiAddLine,
  RiArrowRightSLine,
  RiSubtractFill,
} from "@/shared/ui/lucide-icons"
import { useCalendarContext } from "@/widgets/event-calendar/ui/calendar-context"
import { getTimelineRange } from "@/widgets/event-calendar/ui/utils"
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  max as maxDate,
  min as minDate,
  parseISO,
} from "date-fns"
import { useEffect, useMemo, useRef, useState } from "react"
import type { CalendarProject, CalendarTask } from "./project-calendar-data"

const DAY_WIDTHS = [14, 20, 28, 40]
const DEFAULT_WIDTH = 2
const LABEL_WIDTH = 260
const HEADER = "h-[61px]"
const ROW = "h-9"

/** Undated tasks last, then by due date, then by board position. */
function byDue(a: CalendarTask, b: CalendarTask) {
  if (a.done !== b.done) return Number(a.done) - Number(b.done)
  if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
  if (a.due_date) return -1
  if (b.due_date) return 1
  return (a.position ?? 0) - (b.position ?? 0)
}

type Row =
  | { kind: "project"; project: CalendarProject; taskCount: number }
  | { kind: "task"; project: CalendarProject; task: CalendarTask }

/**
 * Project timeline: every running project as a bar (start → end), and its
 * tasks as due-date cards under it (open by default). One scroll area for both axes;
 * the label column and the date header stay pinned.
 */
export function ProjectTimeline({
  projects,
  tasks,
  loading,
  onOpenTask,
}: {
  projects: CalendarProject[]
  tasks: CalendarTask[]
  loading: boolean
  onOpenTask: (task: CalendarTask) => void
}) {
  const { currentDate } = useCalendarContext()
  const t = useT("calendar")
  const tp = useT("projects")
  const dateLocale = useDateLocale()
  const daysLabel = (count: number) =>
    t(count === 1 ? "durationDaysOne" : "durationDaysOther", { count })
  const range = useMemo(() => getTimelineRange(currentDate), [currentDate])
  const days = useMemo(
    () => eachDayOfInterval({ start: range.start, end: range.end }),
    [range],
  )
  const [widthStep, setWidthStep] = useState(DEFAULT_WIDTH)
  const dayWidth = DAY_WIDTHS[widthStep]
  // Projects start open; this holds the ones the user folded.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  const todayIndex = differenceInCalendarDays(today, range.start)
  const showToday = todayIndex >= 0 && todayIndex < days.length

  const tasksOf = useMemo(() => {
    const map = new Map<string, CalendarTask[]>()
    for (const task of [...tasks].sort(byDue)) {
      map.set(task.project_id, [...(map.get(task.project_id) ?? []), task])
    }
    return map
  }, [tasks])

  const months = useMemo(() => {
    const out: { label: string; span: number }[] = []
    days.forEach((day, i) => {
      const last = out[out.length - 1]
      if (last && i > 0 && isSameMonth(day, days[i - 1])) last.span += 1
      else
        out.push({
          label: format(day, "MMMM yyyy", { locale: dateLocale }),
          span: 1,
        })
    })
    return out
  }, [days, dateLocale])

  // Land on today (or the start) when the range or zoom changes.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const target = showToday
      ? todayIndex * dayWidth - (el.clientWidth - LABEL_WIDTH) / 3
      : 0
    el.scrollTo({ left: Math.max(0, target) })
  }, [dayWidth, showToday, todayIndex])

  const toggle = (projectId: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) next.delete(projectId)
      else next.add(projectId)
      return next
    })

  /** Bar position inside the range, or null when it's entirely outside. */
  const barGeometry = (start: Date, end: Date) => {
    if (end < range.start || start > range.end) return null
    const from = maxDate([start, range.start])
    const to = minDate([end, range.end])
    const offset = differenceInCalendarDays(from, range.start)
    const span = differenceInCalendarDays(to, from) + 1
    return { left: offset * dayWidth, width: Math.max(span * dayWidth - 2, 6) }
  }

  const gridWidth = days.length * dayWidth
  const rows: Row[] = []
  for (const project of projects) {
    const projectTasks = tasksOf.get(project.id) ?? []
    rows.push({ kind: "project", project, taskCount: projectTasks.length })
    if (!collapsed.has(project.id)) {
      for (const task of projectTasks)
        rows.push({ kind: "task", project, task })
    }
  }

  const labelCell =
    "bg-background dark:bg-surface sticky left-0 z-10 flex shrink-0 items-center border-r border-b"

  return (
    <div ref={scrollRef} className="h-full overflow-auto text-sm">
      <div className="relative" style={{ width: LABEL_WIDTH + gridWidth }}>
        {/* Header: zoom + count | months + days */}
        <div className="sticky top-0 z-20 flex">
          <div
            className={cx(
              labelCell,
              HEADER,
              "z-30 items-end gap-0.5 px-2 pb-2",
            )}
            style={{ width: LABEL_WIDTH }}
          >
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground"
              aria-label={t("weekZoomOut")}
              disabled={widthStep === 0}
              onClick={() => setWidthStep((s) => Math.max(0, s - 1))}
            >
              <RiSubtractFill />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground"
              aria-label={t("weekZoomIn")}
              disabled={widthStep === DAY_WIDTHS.length - 1}
              onClick={() =>
                setWidthStep((s) => Math.min(DAY_WIDTHS.length - 1, s + 1))
              }
            >
              <RiAddLine />
            </Button>
            <span className="text-muted-foreground ml-auto text-xs">
              {t(
                projects.length === 1
                  ? "timelineProjectsOne"
                  : "timelineProjectsOther",
                { count: projects.length },
              )}
            </span>
          </div>
          <div
            className={cx(HEADER, "bg-background dark:bg-surface border-b")}
            style={{ width: gridWidth }}
          >
            <div className="flex h-7 items-end">
              {months.map((m) => (
                <div
                  key={m.label}
                  className="text-muted-foreground truncate border-l px-2 text-xs first:border-l-0"
                  style={{ width: m.span * dayWidth }}
                >
                  {m.label}
                </div>
              ))}
            </div>
            <div className="flex h-8 items-center">
              {days.map((day) => {
                const isToday = isSameDay(day, today)
                return (
                  <div
                    key={day.toISOString()}
                    className="flex shrink-0 items-center justify-center"
                    style={{ width: dayWidth }}
                  >
                    {(dayWidth >= 20 || isToday || day.getDate() % 2 === 1) && (
                      <span
                        className={cx(
                          "text-[11px] tabular-nums",
                          isToday
                            ? "bg-foreground text-background flex size-5 items-center justify-center rounded-[5px] font-medium"
                            : "text-muted-foreground",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Weekend shading + today line, behind the rows */}
        <div
          className="pointer-events-none absolute top-[61px] bottom-0 flex"
          style={{ left: LABEL_WIDTH }}
        >
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={cx(
                "shrink-0",
                (day.getDay() === 0 || day.getDay() === 6) &&
                  "bg-foreground/[0.025]",
              )}
              style={{ width: dayWidth }}
            />
          ))}
        </div>
        {showToday && (
          // Same "now" marker as the week view: red line, dot on top.
          <div
            className="pointer-events-none absolute top-[61px] bottom-0 z-[5] flex w-0 flex-col items-center"
            style={{ left: LABEL_WIDTH + todayIndex * dayWidth + dayWidth / 2 }}
          >
            <div className="bg-destructive size-2 shrink-0 rounded-full" />
            <div className="bg-destructive w-px flex-1" />
          </div>
        )}

        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex">
              <div
                className={cx(labelCell, ROW, "px-3")}
                style={{ width: LABEL_WIDTH }}
              >
                <Skeleton className="h-3 w-32" />
              </div>
              <div className={cx(ROW, "flex-1 border-b")} />
            </div>
          ))}

        {!loading && projects.length === 0 && (
          <p
            className="text-muted-foreground sticky left-0 px-3 py-6 text-sm"
            style={{ width: LABEL_WIDTH }}
          >
            {t("timelineEmpty")}
          </p>
        )}

        {!loading &&
          rows.map((row) => {
            if (row.kind === "project") {
              const { project } = row
              // The bar takes the project's avatar colour, lightly.
              const color = projectColorVar(project.id)
              const open = !collapsed.has(project.id) && row.taskCount > 0
              const bar =
                project.start && project.end
                  ? barGeometry(project.start, project.end)
                  : null
              const duration =
                project.start && project.end
                  ? differenceInCalendarDays(project.end, project.start) + 1
                  : 0
              return (
                <div key={project.id} className="group flex">
                  <div
                    className={cx(
                      labelCell,
                      ROW,
                      "gap-1.5 pr-2 pl-1.5 group-hover:bg-(--row-hover)",
                    )}
                    style={{ width: LABEL_WIDTH }}
                  >
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground"
                      aria-label={
                        open ? t("timelineHideTasks") : t("timelineShowTasks")
                      }
                      aria-expanded={open}
                      onClick={() => toggle(project.id)}
                      disabled={row.taskCount === 0}
                    >
                      <RiArrowRightSLine
                        className={cx(
                          "size-4 transition-transform",
                          open && "rotate-90",
                        )}
                      />
                    </Button>
                    <ProjectAvatar id={project.id} name={project.name} />
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span className="min-w-0 flex-1 truncate font-medium" />
                        }
                      >
                        {project.name}
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="max-w-64 flex-col items-start gap-1 py-2"
                      >
                        <p className="font-medium">{project.name}</p>
                        {project.members.length === 0 ? (
                          <p className="opacity-70">{t("timelineNoTeam")}</p>
                        ) : (
                          <ul className="flex flex-col gap-0.5">
                            {project.members.map((m) => (
                              <li key={m.userId} className="opacity-80">
                                {m.name}
                                {m.isLead && (
                                  <span className="opacity-60">
                                    {` · ${t("timelineLead")}`}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </TooltipContent>
                    </Tooltip>
                    {/* Same status icons as the project list. */}
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <span
                            className="flex size-5 items-center justify-center"
                            aria-label={tp(STATUS_LABEL_KEYS[project.status])}
                          />
                        }
                      >
                        <ProjectStatusIcon status={project.status} />
                      </TooltipTrigger>
                      <TooltipContent>
                        {tp(STATUS_LABEL_KEYS[project.status])}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div
                    className={cx(ROW, "relative border-b")}
                    style={{ width: gridWidth }}
                  >
                    {bar ? (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <div
                              className="absolute top-1.5 bottom-1.5 flex items-center gap-2 overflow-hidden rounded-md bg-(--bar-tint) px-2 text-xs transition-colors hover:bg-(--bar-tint-hover)"
                              style={
                                {
                                  left: bar.left,
                                  width: bar.width,
                                  "--bar-tint": `color-mix(in oklch, ${color} 16%, transparent)`,
                                  "--bar-tint-hover": `color-mix(in oklch, ${color} 26%, transparent)`,
                                } as React.CSSProperties
                              }
                            />
                          }
                        >
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {project.name}
                          </span>
                          {bar.width > 120 && (
                            <span className="text-muted-foreground shrink-0 tabular-nums">
                              {daysLabel(duration)}
                            </span>
                          )}
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {project.name} ·{" "}
                          {format(project.start!, "d MMM", {
                            locale: dateLocale,
                          })}{" "}
                          –{" "}
                          {format(project.end!, "d MMM yyyy", {
                            locale: dateLocale,
                          })}{" "}
                          · {daysLabel(duration)}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span
                        className="text-muted-foreground sticky flex h-full items-center px-3 text-xs"
                        style={{ left: LABEL_WIDTH }}
                      >
                        {project.start && project.end
                          ? t("timelineOutOfRange")
                          : t("timelineNoDates")}
                      </span>
                    )}
                  </div>
                </div>
              )
            }

            const { task } = row
            // statusOf only reads status/done.
            const status = statusOf(task as unknown as TaskRow)
            const due = task.due_date ? parseISO(task.due_date) : null
            const marker = due ? barGeometry(due, due) : null
            const overdue =
              due && !task.done && differenceInCalendarDays(due, today) < 0
            const color = projectColorVar(row.project.id)
            return (
              <div key={task.id} className="group flex">
                <button
                  type="button"
                  onClick={() => onOpenTask(task)}
                  className={cx(
                    labelCell,
                    ROW,
                    "cursor-pointer gap-2 pr-2 pl-8 text-left group-hover:bg-(--row-hover)",
                  )}
                  style={{ width: LABEL_WIDTH }}
                >
                  <StatusDot status={status} className="size-3.5 shrink-0" />
                  <span
                    className={cx(
                      "min-w-0 flex-1 truncate",
                      task.done && "text-muted-foreground line-through",
                    )}
                  >
                    {task.title}
                  </span>
                  {task.assigneeName && (
                    <span className="text-muted-foreground max-w-20 shrink-0 truncate text-xs">
                      {task.assigneeName.split(" ")[0]}
                    </span>
                  )}
                </button>
                <div
                  className={cx(ROW, "relative border-b")}
                  style={{ width: gridWidth }}
                >
                  {marker ? (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <button
                            type="button"
                            onClick={() => onOpenTask(task)}
                            aria-label={task.title}
                            // A small card in the project's colour, from
                            // the due day; overdue gets a red ring.
                            className={cx(
                              "absolute top-1.5 bottom-1.5 flex cursor-pointer items-center gap-1.5 rounded-md bg-(--bar-tint) px-1.5 transition-colors hover:bg-(--bar-tint-hover)",
                              overdue && "ring-destructive ring-1 ring-inset",
                            )}
                            style={
                              {
                                left: marker.left,
                                "--bar-tint": `color-mix(in oklch, ${color} 16%, transparent)`,
                                "--bar-tint-hover": `color-mix(in oklch, ${color} 26%, transparent)`,
                              } as React.CSSProperties
                            }
                          />
                        }
                      >
                        <StatusDot
                          status={status}
                          className="size-3.5 shrink-0"
                        />
                        {dayWidth >= 20 && (
                          <span
                            className={cx(
                              "max-w-48 truncate text-xs font-medium",
                              task.done
                                ? "text-muted-foreground line-through"
                                : "text-foreground",
                            )}
                          >
                            {task.title}
                          </span>
                        )}
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {task.title} · {tp(STATUS_LABEL[status])} ·{" "}
                        {t("timelineDue", {
                          date: format(due!, "d MMM yyyy", {
                            locale: dateLocale,
                          }),
                        })}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span
                      className="text-muted-foreground sticky flex h-full items-center px-3 text-xs"
                      style={{ left: LABEL_WIDTH }}
                    >
                      {due ? t("timelineOutOfRange") : t("timelineNoDue")}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

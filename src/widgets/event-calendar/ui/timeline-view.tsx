"use client"

import { EmptyValue } from "@/components/empty-value"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { isAdminRole } from "@/shared/lib/roles"
import { cx } from "@/shared/lib/utils"
import {
  RiAddLine,
  RiArrowRightSLine,
  RiSubtractFill,
} from "@/shared/ui/lucide-icons"
import { useQuery } from "@tanstack/react-query"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useEffect, useMemo, useRef, useState } from "react"
import { useCalendarContext } from "./calendar-context"
import { getTimelineRange } from "./utils"

type Member = { userId: string; name: string; role: string; isLead: boolean }
type TimelineProject = {
  id: string
  name: string
  status: "Active" | "Completed" | "Archived" | null
  start: Date
  end: Date
  members: Member[]
}

type ProjectRow = {
  id: string
  name: string
  status: TimelineProject["status"]
  start_date: string
  end_date: string
  project_assignments: {
    user_id: string
    role_in_project: string
    is_lead: boolean | null
    profiles: { full_name: string | null } | null
  }[]
}

const DAY_WIDTHS = [14, 20, 28, 40]
const DEFAULT_WIDTH = 2
const LABEL_WIDTH = 240
const ROW = "h-9"

const TINTS = [
  { bar: "bg-primary/15 hover:bg-primary/25", dot: "bg-primary" },
  { bar: "bg-success/15 hover:bg-success/25", dot: "bg-success" },
  { bar: "bg-warning/15 hover:bg-warning/25", dot: "bg-warning" },
  { bar: "bg-destructive/15 hover:bg-destructive/25", dot: "bg-destructive" },
  { bar: "bg-info/15 hover:bg-info/25", dot: "bg-info" },
]
function tintFor(id: string) {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return TINTS[Math.abs(hash) % TINTS.length]
}

/**
 * Projects overlapping the range: all of them for stakeholders, the user's
 * own assignments for everyone else.
 */
function useTimelineProjects(rangeStart: Date, rangeEnd: Date) {
  const { profile } = useUserProfile()
  return useQuery<TimelineProject[]>({
    queryKey: [
      "timeline-projects",
      profile?.id,
      profile?.role,
      rangeStart.toISOString(),
      rangeEnd.toISOString(),
    ],
    enabled: Boolean(profile),
    queryFn: async () => {
      if (!profile) return []
      const supabase = createClient()
      const admin = isAdminRole(profile.role)

      let ids: string[] | null = null
      if (!admin) {
        const { data } = await supabase
          .from("project_assignments")
          .select("project_id")
          .eq("user_id", profile.id)
        ids = ((data ?? []) as { project_id: string }[]).map(
          (r) => r.project_id,
        )
        if (ids.length === 0) return []
      }

      let query = supabase
        .from("projects")
        .select(
          "id, name, status, start_date, end_date, project_assignments(user_id, role_in_project, is_lead, profiles(full_name))",
        )
        .lte("start_date", format(rangeEnd, "yyyy-MM-dd"))
        .gte("end_date", format(rangeStart, "yyyy-MM-dd"))
        .order("start_date")
      if (ids) query = query.in("id", ids)

      const { data, error } = await query
      if (error) throw error

      return ((data ?? []) as unknown as ProjectRow[]).map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        start: parseISO(p.start_date),
        end: parseISO(p.end_date),
        members: (p.project_assignments ?? [])
          .map((a) => ({
            userId: a.user_id,
            name: a.profiles?.full_name ?? "—",
            role: a.role_in_project,
            isLead: Boolean(a.is_lead),
          }))
          .sort(
            (a, b) =>
              Number(b.isLead) - Number(a.isLead) ||
              a.name.localeCompare(b.name),
          ),
      }))
    },
  })
}

function statusVariant(status: TimelineProject["status"]) {
  if (status === "Active") return "success" as const
  if (status === "Completed") return "info" as const
  return "secondary" as const
}

const STATUS_LABEL_KEYS = {
  Active: "timelineStatusActive",
  Completed: "timelineStatusCompleted",
  Archived: "timelineStatusArchived",
} as const

export function TimelineView() {
  const { currentDate } = useCalendarContext()
  const t = useT("calendar")
  const idLocale = useDateLocale()
  const daysLabel = (count: number) =>
    t(count === 1 ? "durationDaysOne" : "durationDaysOther", { count })
  const range = useMemo(() => getTimelineRange(currentDate), [currentDate])
  const days = useMemo(
    () => eachDayOfInterval({ start: range.start, end: range.end }),
    [range],
  )
  const [widthStep, setWidthStep] = useState(DEFAULT_WIDTH)
  const dayWidth = DAY_WIDTHS[widthStep]
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)
  const { data: projects = [], isLoading } = useTimelineProjects(
    range.start,
    range.end,
  )

  const today = new Date()
  const todayIndex = differenceInCalendarDays(today, range.start)
  const showToday = todayIndex >= 0 && todayIndex < days.length

  // Months for the top header row.
  const months = useMemo(() => {
    const out: { label: string; span: number }[] = []
    days.forEach((day, i) => {
      const last = out[out.length - 1]
      if (last && i > 0 && isSameMonth(day, days[i - 1])) {
        last.span += 1
      } else {
        out.push({
          label: format(day, "MMMM yyyy", { locale: idLocale }),
          span: 1,
        })
      }
    })
    return out
  }, [days, idLocale])

  // Land on today (or the start) when the range or zoom changes.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const target = showToday ? todayIndex * dayWidth - el.clientWidth / 3 : 0
    el.scrollTo({ left: Math.max(0, target) })
  }, [dayWidth, showToday, todayIndex])

  const toggle = (projectId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) next.delete(projectId)
      else next.add(projectId)
      return next
    })

  const barGeometry = (start: Date, end: Date) => {
    const from = maxDate([start, range.start])
    const to = minDate([end, range.end])
    const offset = differenceInCalendarDays(from, range.start)
    const span = differenceInCalendarDays(to, from) + 1
    return {
      left: offset * dayWidth,
      width: Math.max(span * dayWidth - 2, 6),
      clippedStart: start < range.start,
    }
  }

  const gridWidth = days.length * dayWidth

  // Rows are rendered twice (label column + bar area) from one list so the
  // two sides always share heights.
  const rows: (
    | { kind: "project"; project: TimelineProject }
    | { kind: "member"; project: TimelineProject; member: Member }
  )[] = []
  for (const project of projects) {
    rows.push({ kind: "project", project })
    if (expanded.has(project.id)) {
      for (const member of project.members) {
        rows.push({ kind: "member", project, member })
      }
    }
  }

  return (
    <div className="flex h-full min-h-0 text-sm">
      {/* Label column */}
      <div
        className="flex shrink-0 flex-col border-r"
        style={{ width: LABEL_WIDTH }}
      >
        <div className="bg-background dark:bg-surface sticky top-0 z-20 flex h-[61px] items-end gap-0.5 border-b px-2 pb-2">
          <button
            type="button"
            aria-label={t("weekZoomOut")}
            disabled={widthStep === 0}
            onClick={() => setWidthStep((s) => Math.max(0, s - 1))}
            className="text-muted-foreground hover:text-foreground hover:bg-accent flex size-5 cursor-pointer items-center justify-center rounded-sm disabled:pointer-events-none disabled:opacity-40"
          >
            <RiSubtractFill className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label={t("weekZoomIn")}
            disabled={widthStep === DAY_WIDTHS.length - 1}
            onClick={() =>
              setWidthStep((s) => Math.min(DAY_WIDTHS.length - 1, s + 1))
            }
            className="text-muted-foreground hover:text-foreground hover:bg-accent flex size-5 cursor-pointer items-center justify-center rounded-sm disabled:pointer-events-none disabled:opacity-40"
          >
            <RiAddLine className="size-3.5" />
          </button>
          <span className="text-muted-foreground ml-auto text-xs">
            {t(
              projects.length === 1
                ? "timelineProjectsOne"
                : "timelineProjectsOther",
              { count: projects.length },
            )}
          </span>
        </div>

        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cx(ROW, "flex items-center border-b px-3")}
              >
                <Skeleton className="h-3 w-32" />
              </div>
            ))
          : rows.map((row) =>
              row.kind === "project" ? (
                <div
                  key={row.project.id}
                  className={cx(
                    ROW,
                    "hover:bg-foreground/[0.03] flex items-center gap-1.5 border-b pr-2 pl-1.5",
                  )}
                >
                  <button
                    type="button"
                    aria-label={
                      expanded.has(row.project.id)
                        ? t("timelineHideTeam")
                        : t("timelineShowTeam")
                    }
                    onClick={() => toggle(row.project.id)}
                    disabled={row.project.members.length === 0}
                    className="text-muted-foreground hover:text-foreground flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm disabled:opacity-30"
                  >
                    <RiArrowRightSLine
                      className={cx(
                        "size-4 transition-transform",
                        expanded.has(row.project.id) && "rotate-90",
                      )}
                    />
                  </button>
                  <span
                    className={cx(
                      "size-2 shrink-0 rounded-[3px]",
                      tintFor(row.project.id).dot,
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {row.project.name}
                  </span>
                  <Badge variant={statusVariant(row.project.status)}>
                    {row.project.status ? (
                      STATUS_LABEL_KEYS[row.project.status] ? (
                        t(STATUS_LABEL_KEYS[row.project.status])
                      ) : (
                        row.project.status
                      )
                    ) : (
                      <EmptyValue />
                    )}
                  </Badge>
                </div>
              ) : (
                <div
                  key={`${row.project.id}-${row.member.userId}`}
                  className={cx(
                    ROW,
                    "text-muted-foreground flex items-center gap-2 border-b pr-2 pl-9",
                  )}
                >
                  <span className="bg-muted text-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium">
                    {row.member.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-foreground truncate">
                    {row.member.name}
                  </span>
                  <span className="ml-auto truncate text-xs">
                    {row.member.isLead ? `${t("timelineLead")} · ` : ""}
                    {row.member.role}
                  </span>
                </div>
              ),
            )}
        {!isLoading && projects.length === 0 && (
          <p className="text-muted-foreground px-3 py-6 text-sm">
            {t("timelineEmpty")}
          </p>
        )}
      </div>

      {/* Scrollable day grid */}
      <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto">
        <div className="relative" style={{ width: gridWidth }}>
          {/* Header: months + days */}
          <div className="bg-background dark:bg-surface sticky top-0 z-20 border-b">
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
                            ? "bg-foreground text-background flex size-5 items-center justify-center rounded-[4px] font-medium"
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

          {/* Weekend shading + today line */}
          <div className="pointer-events-none absolute inset-x-0 top-[61px] bottom-0 flex">
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
            <div
              className="bg-foreground/40 pointer-events-none absolute top-[61px] bottom-0 z-10 w-px"
              style={{ left: todayIndex * dayWidth + dayWidth / 2 }}
            />
          )}

          {/* Bars */}
          {rows.map((row) => {
            const { left, width } = barGeometry(
              row.project.start,
              row.project.end,
            )
            const tint = tintFor(row.project.id)
            const duration =
              differenceInCalendarDays(row.project.end, row.project.start) + 1
            return (
              <div
                key={
                  row.kind === "project"
                    ? row.project.id
                    : `${row.project.id}-${row.member.userId}`
                }
                className={cx(ROW, "relative border-b")}
              >
                {row.kind === "project" ? (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <div
                          className={cx(
                            "absolute top-1.5 bottom-1.5 flex items-center gap-2 overflow-hidden rounded-md px-2 text-xs transition-colors",
                            tint.bar,
                          )}
                          style={{ left, width }}
                        />
                      }
                    >
                      <span
                        className={cx(
                          "size-1.5 shrink-0 rounded-full",
                          tint.dot,
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {row.project.name}
                      </span>
                      {width > 120 && (
                        <span className="text-muted-foreground shrink-0 tabular-nums">
                          {daysLabel(duration)}
                        </span>
                      )}
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {row.project.name} ·{" "}
                      {format(row.project.start, "d MMM", { locale: idLocale })}{" "}
                      –{" "}
                      {format(row.project.end, "d MMM yyyy", {
                        locale: idLocale,
                      })}{" "}
                      · {daysLabel(duration)}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <div
                    className="bg-foreground/[0.06] absolute top-3 bottom-3 rounded-full"
                    style={{ left, width }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

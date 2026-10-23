"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { formatDistanceToNowStrict } from "date-fns"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Users,
} from "lucide-react"
import type { AdminDashboardData } from "../actions/dashboard-admin-actions"
import {
  HomeAction,
  HomeActions,
  HomeCard,
  HomeColumn,
  HomeEmpty,
  HomeFigure,
  HomeFooter,
  HomeGreeting,
  HomeGrid,
  HomeIconLink,
  HomeRow,
  HomeStats,
} from "./home-card"

interface AdminDashboardProps {
  data: AdminDashboardData
}

function Person({ name, src }: { name: string | null; src: string | null }) {
  return (
    <Avatar className="size-7">
      <AvatarImage src={src || undefined} />
      <AvatarFallback className="text-[10px]">
        {name?.[0] || "?"}
      </AvatarFallback>
    </Avatar>
  )
}

/**
 * Stakeholder home: one centred column — greeting, quick actions, then
 * today, what waits on a decision, and how the team is doing.
 */
export function AdminDashboard({ data }: AdminDashboardProps) {
  const { profile } = useUserProfile()
  const t = useT("dashboard")
  const dateLocale = useDateLocale()
  const firstName = profile?.full_name?.split(" ")[0] ?? ""

  const att = data.attendanceOverview
  const total = att.totalToday + att.onLeave + att.absent
  const split = [
    { label: t("splitOnTime"), value: att.onTime, color: "bg-success" },
    { label: t("splitLate"), value: att.late, color: "bg-warning" },
    { label: t("splitOnLeave"), value: att.onLeave, color: "bg-info" },
    { label: t("splitAbsent"), value: att.absent, color: "bg-destructive" },
  ]

  const reviews = data.pendingReviewsList
  const leaves = data.pendingLeaveApprovals
  const dist = data.performanceDistribution
  const rated = Object.values(dist).reduce((a, b) => a + b, 0)

  return (
    <HomeColumn>
      <HomeGreeting
        title={
          firstName ? t("greetingName", { name: firstName }) : t("greeting")
        }
      />

      <HomeActions>
        <HomeAction primary href="/leave" icon={<CalendarCheck />}>
          {t("actionLeaveApprovals")}
        </HomeAction>
        <HomeAction href="/leave/attendance" icon={<Clock />}>
          {t("actionAttendance")}
        </HomeAction>
        <HomeAction href="/performance?tab=360review" icon={<ClipboardCheck />}>
          {t("actionReview360")}
        </HomeAction>
        <HomeAction href="/teams" icon={<Users />}>
          {t("actionTeam")}
        </HomeAction>
        <HomeAction href="/calendar" icon={<CalendarDays />}>
          {t("actionCalendar")}
        </HomeAction>
      </HomeActions>

      <HomeGrid>
        <HomeCard
          title={t("adminAttendanceTitle")}
          actions={
            <HomeIconLink href="/leave/attendance" label={t("openAttendance")}>
              <ArrowUpRight />
            </HomeIconLink>
          }
        >
          <HomeFigure
            value={`${att.totalToday} / ${total}`}
            unit={t("adminPresentUnit")}
            hint={t("adminAttendanceHint", {
              rate: data.teamMetrics.todayAttendanceRate,
              total: data.teamMetrics.totalEmployees,
            })}
          />
          <div className="bg-muted flex h-2 overflow-hidden rounded-full">
            {total > 0 &&
              split.map((s) => (
                <div
                  key={s.label}
                  className={cn("bar-grow h-full", s.color)}
                  style={
                    {
                      "--bar": `${(s.value / total) * 100}%`,
                    } as React.CSSProperties
                  }
                />
              ))}
          </div>
          <HomeStats
            items={split.map((s) => ({
              label: s.label,
              value: (
                <span className="inline-flex items-center gap-1.5">
                  <span className={cn("size-1.5 rounded-full", s.color)} />
                  {s.value}
                </span>
              ),
            }))}
          />
        </HomeCard>

        <HomeCard
          title={t("adminPendingReviewsTitle")}
          badge={
            reviews.length > 0 ? (
              <Badge variant="secondary">{reviews.length}</Badge>
            ) : null
          }
          actions={
            <HomeIconLink
              href="/performance?tab=360review"
              label={t("openReview")}
            >
              <ArrowUpRight />
            </HomeIconLink>
          }
        >
          <div className="flex flex-1 flex-col">
            {reviews.length === 0 ? (
              <HomeEmpty>{t("adminReviewsAllDone")}</HomeEmpty>
            ) : (
              reviews
                .slice(0, 5)
                .map((r) => (
                  <HomeRow
                    key={`${r.employee_id}-${r.cycle_id}`}
                    href="/performance?tab=360review"
                    leading={
                      <Person name={r.employee_name} src={r.employee_avatar} />
                    }
                    title={r.employee_name}
                    subtitle={r.employee_job_title}
                    trailing={
                      <span className="text-muted-foreground text-[13px]">
                        {t("adminReviewersPending", { n: r.reviewers_pending })}
                      </span>
                    }
                  />
                ))
            )}
          </div>
        </HomeCard>
      </HomeGrid>

      <HomeGrid>
        <HomeCard
          title={t("leaveTitle")}
          actions={
            <HomeIconLink href="/leave" label={t("openLeave")}>
              <ArrowUpRight />
            </HomeIconLink>
          }
        >
          <HomeStats
            items={[
              { label: t("adminLeavePending"), value: leaves.length || "–" },
              { label: t("adminLeaveToday"), value: att.onLeave || "–" },
              { label: t("splitAbsent"), value: att.absent || "–" },
            ]}
          />
          <div className="flex flex-col">
            {leaves.slice(0, 3).map((l) => (
              <HomeRow
                key={l.id}
                href="/leave"
                leading={<Person name={l.user_name} src={l.user_avatar} />}
                title={l.user_name}
                subtitle={l.leave_type}
                trailing={
                  <span className="text-muted-foreground text-[13px]">
                    {t(l.days_requested === 1 ? "daysCountOne" : "daysCount", {
                      n: l.days_requested,
                    })}
                  </span>
                }
              />
            ))}
          </div>
          <HomeFooter
            label={t("adminLeaveAwaitingApproval")}
            value={t(
              leaves.length === 1
                ? "adminLeaveRequestsCountOne"
                : "adminLeaveRequestsCount",
              { n: leaves.length },
            )}
            href="/leave"
          />
        </HomeCard>

        <HomeCard
          title={t("adminTeamPerformanceTitle")}
          actions={
            <HomeIconLink href="/performance" label={t("openPerformance")}>
              <ArrowUpRight />
            </HomeIconLink>
          }
        >
          <HomeStats
            items={[
              {
                label: t("adminAvgScore"),
                value:
                  data.teamMetrics.avgTeamPerformance !== null
                    ? `${data.teamMetrics.avgTeamPerformance}%`
                    : "–",
              },
              {
                label: t("adminTopPerformers"),
                value: data.topPerformers.length || "–",
              },
              {
                label: t("adminNeedsAttention"),
                value: data.employeesNeedingAttention.length || "–",
                tone:
                  data.employeesNeedingAttention.length > 0
                    ? "text-destructive"
                    : undefined,
              },
            ]}
          />
          <div className="flex flex-col">
            {data.employeesNeedingAttention.slice(0, 3).map((e) => (
              <HomeRow
                key={e.employee_id}
                href={`/performance/employee/${e.employee_id}`}
                leading={
                  <Person name={e.employee_name} src={e.employee_avatar} />
                }
                title={e.employee_name}
                subtitle={e.employee_job_title}
                trailing={`${e.overall_percentage}%`}
              />
            ))}
          </div>
          <HomeFooter
            label={t("adminRated")}
            value={
              rated > 0
                ? t(rated === 1 ? "adminRatedCountOne" : "adminRatedCount", {
                    n: rated,
                  })
                : t("adminNoData")
            }
            href="/performance"
          />
        </HomeCard>
      </HomeGrid>

      <HomeCard title={t("adminRecentActivityTitle")}>
        {data.recentActivities.length === 0 ? (
          <HomeEmpty>{t("adminRecentActivityEmpty")}</HomeEmpty>
        ) : (
          <div className="flex flex-col">
            {data.recentActivities.slice(0, 8).map((a) => (
              <HomeRow
                key={a.id}
                leading={<Person name={a.user_name} src={a.user_avatar} />}
                title={
                  <>
                    <span className="font-medium">
                      {a.user_name || t("unknownUser")}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {a.description}
                    </span>
                  </>
                }
                trailing={
                  <span
                    className="text-tertiary-foreground text-[13px]"
                    suppressHydrationWarning
                  >
                    {formatDistanceToNowStrict(new Date(a.timestamp), {
                      locale: dateLocale,
                    })}
                  </span>
                }
              />
            ))}
          </div>
        )}
      </HomeCard>
    </HomeColumn>
  )
}

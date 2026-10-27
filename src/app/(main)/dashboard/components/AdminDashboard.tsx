"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { formatDistanceToNowStrict } from "date-fns"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  Inbox,
  Users,
} from "@/components/icons"
import {
  ApprovalInbox,
  InboxCount,
} from "@/page-slices/leave/ui/components/ApprovalInbox"
import { useRouter } from "next/navigation"
import { ClipboardCheck } from "lucide-react"
import type { AdminDashboardData } from "../actions/dashboard-admin-actions"
import { AttendanceSplit, type SplitItem } from "./attendance-split"
import { TeamKpiCard } from "./TeamKpiCard"
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
  const tl = useT("leave")
  const router = useRouter()
  const dateLocale = useDateLocale()
  const firstName = profile?.full_name?.split(" ")[0] ?? ""

  const att = data.attendanceOverview
  const total = att.totalToday + att.onLeave + att.absent
  const split: SplitItem[] = [
    // Lateness isn't recorded (every clock-in is "Present"), so no on-time
    // / late split.
    {
      key: "present",
      label: t("splitPresent"),
      value: att.totalToday,
      tone: "good",
    },
    {
      key: "leave",
      label: t("splitOnLeave"),
      value: att.onLeave,
      tone: "info",
    },
    {
      key: "absent",
      label: t("splitAbsent"),
      value: att.absent,
      tone: "neutral",
    },
  ]

  const reviews = data.pendingReviewsList
  const leaves = data.pendingLeaveApprovals

  return (
    <HomeColumn>
      <HomeGreeting
        title={
          firstName ? t("greetingName", { name: firstName }) : t("greeting")
        }
      />

      <HomeActions>
        <ApprovalInbox
          onChanged={router.refresh}
          trigger={(open, count) => (
            <HomeAction onClick={open} icon={<Inbox />}>
              {tl("inbox")}
              <InboxCount count={count} />
            </HomeAction>
          )}
        />
        <HomeAction href="/leave/attendance" icon={<Clock />}>
          {t("actionAttendance")}
        </HomeAction>
        <HomeAction
          desktopOnly
          href="/performance/360-review"
          icon={<ClipboardCheck />}
        >
          {t("actionReview360")}
        </HomeAction>
        <HomeAction desktopOnly href="/teams" icon={<Users />}>
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
          />
          <AttendanceSplit items={split} total={total} />
        </HomeCard>

        <HomeCard
          className="max-md:hidden"
          title={t("adminPendingReviewsTitle")}
          badge={
            reviews.length > 0 ? (
              <Badge variant="secondary">{reviews.length}</Badge>
            ) : null
          }
          actions={
            <HomeIconLink
              href="/performance/360-review"
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
                    href="/performance/360-review"
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
              // Counts: 0 is an answer, not missing data.
              { label: t("adminLeavePending"), value: leaves.length },
              { label: t("adminLeaveToday"), value: att.onLeave },
              { label: t("splitAbsent"), value: att.absent },
            ]}
          />
          <div className="flex flex-1 flex-col">
            {leaves.length === 0 && (
              <HomeEmpty>{t("adminLeaveNonePending")}</HomeEmpty>
            )}
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

        <div className="contents max-md:hidden">
          <TeamKpiCard data={data} />
        </div>
      </HomeGrid>

      <HomeCard className="max-md:hidden" title={t("adminRecentActivityTitle")}>
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
                      addSuffix: true,
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

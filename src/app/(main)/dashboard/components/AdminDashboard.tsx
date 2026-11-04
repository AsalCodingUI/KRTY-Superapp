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
import { ClipboardCheck, Copy, UserRound } from "@/components/icons"
import { ContextTarget } from "@/shared/context-menu"
import { employeeHref } from "@/shared/lib/url-params"
import {
  LeaveRequestContextMenu,
  useCopyWithToast,
} from "@/page-slices/leave/ui/components/leave-context-menu"
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
  const tm = useT("ctxmenu")
  const copy = useCopyWithToast()
  const firstName = profile?.full_name?.split(" ")[0] ?? ""
  /** The approval inbox on /leave, opened on one request (or the list). */
  const openInbox = (requestId?: string) =>
    router.push(
      requestId
        ? `/leave?inbox=leave&request=${encodeURIComponent(requestId)}`
        : "/leave?inbox=leave",
    )

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
        <ContextTarget
          type="attendance-card"
          label={t("adminAttendanceTitle")}
          href="/leave/attendance"
        >
          <HomeCard
            title={t("adminAttendanceTitle")}
            actions={
              <HomeIconLink
                href="/leave/attendance"
                label={t("openAttendance")}
              >
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
        </ContextTarget>

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
              reviews.slice(0, 5).map((r) => (
                // Right-click: the review page (the row's link), and
                // the person's profile.
                <ContextTarget
                  key={`${r.employee_id}-${r.cycle_id}`}
                  type="pending-review"
                  label={r.employee_name ?? undefined}
                  href="/performance/360-review"
                  items={() => [
                    {
                      id: "profile",
                      label: tl("ctxOpenProfile"),
                      icon: UserRound,
                      access: ["stakeholder"],
                      onSelect: () =>
                        router.push(
                          employeeHref({
                            id: r.employee_id,
                            full_name: r.employee_name,
                          }),
                        ),
                    },
                  ]}
                >
                  <HomeRow
                    href="/performance/360-review"
                    leading={
                      <Person name={r.employee_name} src={r.employee_avatar} />
                    }
                    title={r.employee_name}
                    subtitle={r.employee_job_title}
                    trailing={
                      <span className="text-muted-foreground text-meta">
                        {t("adminReviewersPending", { n: r.reviewers_pending })}
                      </span>
                    }
                  />
                </ContextTarget>
              ))
            )}
          </div>
        </HomeCard>
      </HomeGrid>

      <HomeGrid>
        <ContextTarget
          type="leave-card"
          label={t("leaveTitle")}
          href="/leave"
          items={() => [
            {
              id: "inbox",
              label: tl("inbox"),
              icon: Inbox,
              hint: leaves.length > 0 ? String(leaves.length) : undefined,
              onSelect: () => openInbox(),
            },
          ]}
        >
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
                // Right-click: review it in the inbox (on /leave), the
                // person, the dates.
                <LeaveRequestContextMenu
                  key={l.id}
                  req={{ ...l, status: "pending" }}
                  person={l.user_name}
                  calendar="team"
                  actions={{ onReviewInInbox: () => openInbox(l.id) }}
                >
                  <HomeRow
                    href="/leave"
                    leading={<Person name={l.user_name} src={l.user_avatar} />}
                    title={l.user_name}
                    subtitle={l.leave_type}
                    trailing={
                      <span className="text-muted-foreground text-meta">
                        {t(
                          l.days_requested === 1 ? "daysCountOne" : "daysCount",
                          {
                            n: l.days_requested,
                          },
                        )}
                      </span>
                    }
                  />
                </LeaveRequestContextMenu>
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
        </ContextTarget>

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
              <ContextTarget
                key={a.id}
                type="activity"
                label={a.user_name ?? t("unknownUser")}
                items={() => [
                  {
                    id: "copy",
                    label: tm("copy"),
                    icon: Copy,
                    onSelect: () =>
                      copy(
                        `${a.user_name || t("unknownUser")} ${a.description}`,
                      ),
                  },
                ]}
              >
                <HomeRow
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
                      className="text-tertiary-foreground text-meta"
                      suppressHydrationWarning
                    >
                      {formatDistanceToNowStrict(new Date(a.timestamp), {
                        locale: dateLocale,
                        addSuffix: true,
                      })}
                    </span>
                  }
                />
              </ContextTarget>
            ))}
          </div>
        )}
      </HomeCard>
    </HomeColumn>
  )
}

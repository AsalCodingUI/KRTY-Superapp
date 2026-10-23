"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { formatDistanceToNowStrict } from "date-fns"
import { id as idLocale } from "date-fns/locale"
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
  const firstName = profile?.full_name?.split(" ")[0] ?? ""

  const att = data.attendanceOverview
  const total = att.totalToday + att.onLeave + att.absent
  const split = [
    { label: "Tepat waktu", value: att.onTime, color: "bg-success" },
    { label: "Terlambat", value: att.late, color: "bg-warning" },
    { label: "Cuti", value: att.onLeave, color: "bg-info" },
    { label: "Tidak hadir", value: att.absent, color: "bg-destructive" },
  ]

  const reviews = data.pendingReviewsList
  const leaves = data.pendingLeaveApprovals
  const dist = data.performanceDistribution
  const rated = Object.values(dist).reduce((a, b) => a + b, 0)

  return (
    <HomeColumn>
      <HomeGreeting title={firstName ? `Halo, ${firstName}` : "Halo"} />

      <HomeActions>
        <HomeAction primary href="/leave" icon={<CalendarCheck />}>
          Persetujuan cuti
        </HomeAction>
        <HomeAction href="/leave/attendance" icon={<Clock />}>
          Kehadiran
        </HomeAction>
        <HomeAction href="/performance?tab=360review" icon={<ClipboardCheck />}>
          Review 360
        </HomeAction>
        <HomeAction href="/teams" icon={<Users />}>
          Tim
        </HomeAction>
        <HomeAction href="/calendar" icon={<CalendarDays />}>
          Kalender
        </HomeAction>
      </HomeActions>

      <HomeGrid>
        <HomeCard
          title="Kehadiran hari ini"
          actions={
            <HomeIconLink href="/leave/attendance" label="Buka kehadiran">
              <ArrowUpRight />
            </HomeIconLink>
          }
        >
          <HomeFigure
            value={`${att.totalToday} / ${total}`}
            unit="hadir"
            hint={`${data.teamMetrics.todayAttendanceRate}% dari ${data.teamMetrics.totalEmployees} anggota`}
          />
          <div className="bg-muted flex h-2 overflow-hidden rounded-full">
            {total > 0 &&
              split.map((s) => (
                <div
                  key={s.label}
                  className={cn("bar-grow h-full", s.color)}
                  style={{ "--bar": `${(s.value / total) * 100}%` } as React.CSSProperties}
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
          title="Review tertunda"
          badge={
            reviews.length > 0 ? (
              <Badge variant="secondary">{reviews.length}</Badge>
            ) : null
          }
          actions={
            <HomeIconLink href="/performance?tab=360review" label="Buka review">
              <ArrowUpRight />
            </HomeIconLink>
          }
        >
          <div className="flex flex-1 flex-col">
            {reviews.length === 0 ? (
              <HomeEmpty>Semua penilaian sudah lengkap.</HomeEmpty>
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
                        {r.reviewers_pending} belum menilai
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
          title="Cuti"
          actions={
            <HomeIconLink href="/leave" label="Buka cuti">
              <ArrowUpRight />
            </HomeIconLink>
          }
        >
          <HomeStats
            items={[
              { label: "Menunggu", value: leaves.length || "–" },
              { label: "Cuti hari ini", value: att.onLeave || "–" },
              { label: "Tidak hadir", value: att.absent || "–" },
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
                    {l.days_requested} hari
                  </span>
                }
              />
            ))}
          </div>
          <HomeFooter
            label="Menunggu persetujuan"
            value={`${leaves.length} pengajuan`}
            href="/leave"
          />
        </HomeCard>

        <HomeCard
          title="Performa tim"
          actions={
            <HomeIconLink href="/performance" label="Buka performa">
              <ArrowUpRight />
            </HomeIconLink>
          }
        >
          <HomeStats
            items={[
              {
                label: "Rata-rata skor",
                value:
                  data.teamMetrics.avgTeamPerformance !== null
                    ? `${data.teamMetrics.avgTeamPerformance}%`
                    : "–",
              },
              { label: "Teratas", value: data.topPerformers.length || "–" },
              {
                label: "Perlu perhatian",
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
            label="Sudah dinilai"
            value={rated > 0 ? `${rated} orang` : "Belum ada data"}
            href="/performance"
          />
        </HomeCard>
      </HomeGrid>

      <HomeCard title="Aktivitas terbaru">
        {data.recentActivities.length === 0 ? (
          <HomeEmpty>Aktivitas tim akan muncul di sini.</HomeEmpty>
        ) : (
          <div className="flex flex-col">
            {data.recentActivities.slice(0, 8).map((a) => (
              <HomeRow
                key={a.id}
                leading={<Person name={a.user_name} src={a.user_avatar} />}
                title={
                  <>
                    <span className="font-medium">
                      {a.user_name || "Unknown"}
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
                      locale: idLocale,
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

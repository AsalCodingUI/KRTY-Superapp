"use client"

import { AppIcon } from "@/components/app-icon"
import { EmptyState } from "@/components/empty-state"
import { SegmentedControl } from "@/components/segmented-control"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  formatLeaveRange,
  leaveDays,
} from "@/page-slices/leave/ui/components/AdminLeaveList"
import { useMyTasks } from "@/page-slices/projects/ui/my-tasks/my-tasks-data"
import { createClient } from "@/shared/api/supabase/client"
import { useNotifications } from "@/shared/hooks/useNotifications"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { getLocalDateString } from "@/shared/lib/date/utils"
import { annualLeaveSummary, daysKey, leaveTypeLabel } from "@/shared/lib/leave"
import {
  RiCheckLine,
  RiCloseLine,
  RiInboxLine,
  RiNotification3Line,
} from "@/shared/ui/lucide-icons"
import { canManageByRole } from "@/shared/lib/roles"
import { iconFor } from "@/widgets/notifications/ui/NotificationsPanel"
import { useQuery } from "@tanstack/react-query"
import {
  addDays,
  differenceInMinutes,
  format,
  formatDistanceToNowStrict,
} from "date-fns"
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Coffee,
  Inbox,
  ListChecks,
  LogIn,
  LogOut,
  Settings,
  Sun,
  TriangleAlert,
  Video,
  WifiOff,
} from "lucide-react"
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"
import { getPreviewNotifications } from "@/app/(fullscreen)/menubar/actions"

/**
 * The macOS menu bar popover (the KRTY desktop app, a Tauri shell around
 * /desktop): always dark, built from the app's own components. The data
 * comes from useMenubarData; what the buttons do comes from ActionsContext
 * (a toast in the /menubar preview, the real thing in the app).
 *
 * Layout D (Rail) is the one the app uses; A–C stay for the preview.
 */

export const SECTIONS = [
  { key: "attendance", label: "Absen (clock in / istirahat / out)" },
  { key: "schedule", label: "Jadwal hari ini" },
  { key: "tasks", label: "Tugas (terlambat, hari ini, 3 hari ke depan)" },
  { key: "notifications", label: "Notifikasi" },
  { key: "approvals", label: "Approval cuti (admin)" },
  { key: "leave", label: "Sisa cuti" },
] as const
export type SectionKey = (typeof SECTIONS)[number]["key"]
export type On = Record<SectionKey, boolean>
type Tab = "today" | "inbox" | "approvals"
export type Person = {
  id: string
  full_name: string | null
  role: string | null
}

const db = () => createClient()
/** The desktop app's own settings, kept on this device. */
export type DesktopPrefs = {
  notifyNew: boolean
  notifyEvents: boolean
  notifyClock: boolean
  launchAtLogin: boolean
  timerInMenuBar: boolean
}
const PREFS_KEY = "krty-desktop-prefs"
const PREFS_EVENT = "krty-desktop-prefs"
const DEFAULT_PREFS: DesktopPrefs = {
  notifyNew: true,
  notifyEvents: true,
  notifyClock: true,
  launchAtLogin: true,
  timerInMenuBar: false,
}

function readPrefs(): DesktopPrefs {
  try {
    return {
      ...DEFAULT_PREFS,
      ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}"),
    }
  } catch {
    return DEFAULT_PREFS
  }
}

/** The settings, shared by every component that reads them. */
export function useDesktopPrefs() {
  const [prefs, setPrefs] = useState<DesktopPrefs>(DEFAULT_PREFS)
  useEffect(() => {
    const sync = () => setPrefs(readPrefs())
    sync()
    window.addEventListener(PREFS_EVENT, sync)
    return () => window.removeEventListener(PREFS_EVENT, sync)
  }, [])
  const setPref = (key: keyof DesktopPrefs, value: boolean) => {
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ ...readPrefs(), [key]: value }),
      )
    } catch {}
    window.dispatchEvent(new Event(PREFS_EVENT))
  }
  return [prefs, setPref] as const
}

/** What the popover's buttons do. The preview only shows a toast; the
 *  desktop app wires them to the real thing. */
export type PopoverActions = {
  clockIn: () => void
  toggleBreak: () => void
  clockOut: () => void
  completeTask: (id: string) => void
  decide: (leaveId: number, approve: boolean) => void
  /** A path in the web app ("/leave") or a full URL, in the browser. */
  open: (pathOrUrl: string) => void
  openNotification: (n: { id: string; link?: string | null }) => void
  retry: () => void
  signIn: () => void
  signOut: () => void
  checkUpdate: () => void
  /** Things only the preview layouts have (no real action yet). */
  todo: () => void
}

const preview = () => toast("Prototipe: belum menyimpan apa-apa")
export const PREVIEW_ACTIONS: PopoverActions = {
  clockIn: preview,
  toggleBreak: preview,
  clockOut: preview,
  completeTask: preview,
  decide: preview,
  open: (to) => window.open(to, "_blank", "noopener"),
  openNotification: preview,
  retry: preview,
  signIn: preview,
  signOut: preview,
  checkUpdate: preview,
  todo: preview,
}
export const ActionsContext = createContext<PopoverActions>(PREVIEW_ACTIONS)
const useActions = () => useContext(ActionsContext)

type PendingLeave = {
  id: number
  leave_type: string
  start_date: string
  end_date: string
  reason: string | null
  profiles: { full_name: string; avatar_url: string | null } | null
}

export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

const duration = (minutes: number) =>
  minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}j ${minutes % 60}m`

const initials = (name?: string | null) =>
  (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

/** What state the preview shows: real data, or a made-up worst case. */
export const SCENARIOS = [
  { value: "real", label: "Asli" },
  { value: "busy", label: "Hari sibuk" },
  { value: "long", label: "Teks panjang" },
  { value: "loading", label: "Memuat" },
  { value: "error", label: "Error" },
  { value: "offline", label: "Offline" },
  { value: "signedOut", label: "Belum login" },
] as const
export type Scenario = (typeof SCENARIOS)[number]["value"]

/** Long names, titles and counts, to see what truncates and what wraps. */
function longDay(now: Date) {
  const day = getLocalDateString(now)
  const at = (h: number) =>
    new Date(`${day}T${String(h).padStart(2, "0")}:00:00`).toISOString()
  const long =
    "Presentasi final rebranding menyeluruh beserta guideline turunan untuk seluruh kanal digital dan cetak"
  return {
    name: "Muhammad Rizki Fadhilah Habibi Pratama Wijayakusuma",
    events: [0, 1, 2].map((i) => ({
      id: `long-e${i}`,
      title: `${long} (sesi ${i + 1})`,
      start_at: at(10 + i * 3),
      end_at: at(11 + i * 3),
      all_day: i === 2,
      meeting_url: "https://meet.google.com/",
      event_type: "Event",
      user_id: null,
    })),
    tasks: [-12, 0, 40].map((offset, i) => ({
      id: `long-t${i}`,
      title: `${long} — revisi ke-${i + 7}`,
      due_date: getLocalDateString(addDays(now, offset)),
      projectName: "PT Sinar Harapan Makmur Sejahtera Abadi Internasional Tbk",
    })),
    unread: [0, 1, 2].map((i) => ({
      id: `long-n${i}`,
      title: `${long} sudah disetujui dan menunggu tanda tangan`,
      message: `${long}. ${long}. Mohon dicek sebelum tenggat berakhir.`,
      type: i === 0 ? "announcement" : "task_assigned",
      created_at: new Date(
        now.getTime() - (i + 1) * 86_400_000 * 40,
      ).toISOString(),
      is_read: false,
    })),
    unreadCount: 1284,
    pending: [
      {
        id: -1,
        leave_type: "Annual Leave",
        start_date: day,
        end_date: getLocalDateString(addDays(now, 13)),
        reason: `${long}. ${long}.`,
        profiles: {
          full_name: "Muhammad Rizki Fadhilah Habibi Pratama Wijayakusuma",
          avatar_url: null,
        },
      },
    ],
  }
}

/** A made-up busy day (nothing is saved): 9 events and 14 tasks. */
function busyDay(now: Date) {
  const day = getLocalDateString(now)
  const at = (h: number, m = 0) =>
    new Date(
      `${day}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`,
    ).toISOString()
  const events = [
    ["Daily standup", 9, 0, 9, 15, true],
    ["Review brand kit Milxa", 9, 30, 10, 30, true],
    ["Sync klien Cambridge Studio", 10, 45, 11, 30, true],
    ["Makan siang tim", 12, 0, 13, 0, false],
    ["Kick-off project Franke Framing", 13, 30, 14, 30, true],
    ["1:1 dengan Rizki", 15, 0, 15, 30, true],
    ["Design critique mingguan", 16, 0, 17, 0, true],
    ["Handoff ke developer", 17, 15, 17, 45, false],
    ["Retro sprint", 18, 0, 18, 30, true],
  ].map(([title, h1, m1, h2, m2, online], i) => ({
    id: `sample-e${i}`,
    title: title as string,
    start_at: at(h1 as number, m1 as number),
    end_at: at(h2 as number, m2 as number),
    all_day: false,
    meeting_url: online ? "https://meet.google.com/" : null,
    event_type: "Event",
    user_id: null,
  }))
  const offsets = [-3, -1, -1, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 3]
  const projects = [
    "Milxa",
    "Cambridge Studio",
    "Franke Framing",
    "Christina Weigl",
  ]
  const titles = [
    "Revisi logo final",
    "Kirim invoice termin 2",
    "Susun moodboard kampanye",
    "Finalisasi brand guideline",
    "Export aset sosial media",
    "Review copywriting landing page",
    "Wireframe halaman checkout",
    "Siapkan presentasi klien",
    "Riset kompetitor",
    "Update timeline project",
    "Mockup kemasan produk",
    "Dokumentasi komponen UI",
    "Ilustrasi hero section",
    "QA prototipe interaktif",
  ]
  const tasks = titles.map((title, i) => ({
    id: `sample-t${i}`,
    title,
    due_date: getLocalDateString(addDays(now, offsets[i])),
    projectName: projects[i % projects.length],
  }))
  return { events, tasks }
}

/** Everything the popover shows, read once and shared by every layout. */
export function useMenubarData(
  on: On,
  person: Person,
  scenario: Scenario = "real",
) {
  const { profile: me } = useUserProfile()
  const userId = person.id
  const isAdmin = canManageByRole(person.role)
  const isMe = person.id === me?.id
  const now = useNow()
  const today = getLocalDateString(now)

  const { data: log } = useQuery({
    queryKey: ["menubar-attendance", userId, today],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await db()
        .from("attendance_logs")
        .select("id, clock_in, clock_out, is_break, break_start, break_total")
        .eq("user_id", userId!)
        .eq("date", today)
        .order("clock_in", { ascending: false })
        .limit(1)
        .maybeSingle()
      return data as {
        id: string
        clock_in: string
        clock_out: string | null
        is_break: boolean | null
        break_start: string | null
        break_total: number | null
      } | null
    },
  })

  const { data: events = [] } = useQuery({
    queryKey: ["menubar-events", userId, today],
    enabled: Boolean(userId),
    queryFn: async () => {
      const start = new Date(`${today}T00:00:00`)
      const { data } = await db()
        .from("calendar_events")
        .select(
          "id, title, start_at, end_at, all_day, meeting_url, event_type, user_id",
        )
        .lt("start_at", addDays(start, 1).toISOString())
        .gte("end_at", start.toISOString())
        .order("start_at")
      return (
        (data ?? []) as {
          id: string
          title: string
          start_at: string
          end_at: string
          all_day: boolean | null
          meeting_url: string | null
          event_type: string | null
          user_id: string | null
        }[]
      ).filter((e) => e.event_type !== "Personal" || e.user_id === userId)
    },
  })

  const { data: myTasks } = useMyTasks(userId)
  const tasks = useMemo(() => {
    const until = getLocalDateString(addDays(now, 3))
    return (myTasks?.tasks ?? [])
      .filter((t) => !t.done && t.due_date && t.due_date <= until)
      .sort((a, b) => a.due_date!.localeCompare(b.due_date!))
      .map((t) => ({
        ...t,
        projectName: myTasks?.projects[t.project_id]?.name ?? "",
      }))
  }, [myTasks, now])

  // Own notifications from the app's hook; someone else's (admin preview)
  // through a server action, since they're private by RLS.
  const own = useNotifications()
  const { data: theirs } = useQuery({
    queryKey: ["menubar-preview-notifications", userId],
    enabled: Boolean(me && userId) && !isMe,
    queryFn: () => getPreviewNotifications(userId),
  })
  const unread = isMe
    ? own.notifications.filter((n) => !n.is_read).slice(0, 6)
    : (theirs?.list ?? [])
  const unreadCount = isMe ? own.unreadCount : (theirs?.unread ?? 0)

  // Admins: leave requests waiting for a decision (same query as the inbox).
  const showApprovals = isAdmin && on.approvals
  const { data: pending = [] } = useQuery({
    queryKey: ["menubar-pending-leave"],
    enabled: showApprovals,
    queryFn: async () => {
      const { data } = await db()
        .from("leave_requests")
        .select(
          "id,leave_type,start_date,end_date,reason,profiles(full_name, avatar_url)",
        )
        .eq("status", "pending")
        .order("start_date", { ascending: true })
      return (data ?? []) as unknown as PendingLeave[]
    },
  })

  const { data: leave } = useQuery({
    queryKey: ["menubar-leave", userId, now.getFullYear()],
    enabled: Boolean(userId),
    queryFn: async () => {
      const year = now.getFullYear()
      const [{ data: me }, { data: approved }] = await Promise.all([
        db()
          .from("profiles")
          .select("join_date, employment_type")
          .eq("id", userId!)
          .maybeSingle(),
        db()
          .from("leave_requests")
          .select("start_date, end_date")
          .eq("user_id", userId!)
          .eq("status", "approved")
          .eq("leave_type", "Annual Leave")
          .gte("end_date", `${year}-01-01`),
      ])
      return annualLeaveSummary(approved ?? [], year, me ?? {})
    },
  })

  // Attendance state and the running time.
  const working = Boolean(log && !log.clock_out)
  const onBreak = Boolean(working && log?.is_break)
  const worked = log
    ? Math.max(
        0,
        differenceInMinutes(
          log.clock_out ? new Date(log.clock_out) : now,
          new Date(log.clock_in),
        ) -
          (log.break_total ?? 0) -
          (onBreak && log.break_start
            ? differenceInMinutes(now, new Date(log.break_start))
            : 0),
      )
    : 0

  // Made-up cases: a busy day (long lists) or long text everywhere.
  const sampleDay = useMemo(
    () =>
      scenario === "busy"
        ? busyDay(now)
        : scenario === "long"
          ? longDay(now)
          : null,
    [scenario, now],
  )
  const long =
    scenario === "long" ? (sampleDay as ReturnType<typeof longDay>) : null

  return {
    scenario,
    person: long ? { ...person, full_name: long.name } : person,
    now,
    today,
    log,
    working,
    onBreak,
    worked,
    events: sampleDay?.events ?? events,
    tasks: (sampleDay?.tasks ?? tasks) as typeof tasks,
    unread: (long?.unread ?? unread) as typeof unread,
    unreadCount: long?.unreadCount ?? unreadCount,
    showApprovals,
    pending: (long?.pending ?? pending) as typeof pending,
    leave,
  }
}
export type Data = ReturnType<typeof useMenubarData>

/** Empty states on the popover: the icon tiles are lifted a step lighter
 *  than the app's dark surface, so they don't sink into the glass. */
const EMPTY_ON_GLASS =
  "[&>[aria-hidden]>div]:bg-[oklch(0.34_0_0)] [&>[aria-hidden]>div:first-child]:bg-[oklch(0.29_0_0)]"

/** The popover surface: how much it blurs and how solid it is. */
export type Surface = { blur: number; solid: number }
/** Tuned on the preview page: blur 80px, 95% solid. */
export const DEFAULT_SURFACE: Surface = { blur: 80, solid: 95 }
export const SurfaceContext = createContext<Surface>(DEFAULT_SURFACE)

/* ─── Shell and shared pieces ─────────────────────────────────────────── */

/** The popover's surface: always dark, and always the neutral base with
 *  the blue primary, whatever color the viewer picked for the web app. */
function Shell({
  width = 380,
  className,
  children,
}: {
  width?: number
  className?: string
  children: ReactNode
}) {
  const surface = useContext(SurfaceContext)
  return (
    <div
      className="dark"
      style={{ "--tint-c": 0, "--tint-h": 250 } as React.CSSProperties}
    >
      <div
        style={{
          width,
          background: `color-mix(in oklch, var(--popover) ${surface.solid}%, transparent)`,
          backdropFilter: `blur(${surface.blur}px) saturate(1.6)`,
          WebkitBackdropFilter: `blur(${surface.blur}px) saturate(1.6)`,
        }}
        className={cn(
          "text-popover-foreground flex flex-col overflow-hidden rounded-3xl border border-white/8 shadow-(--elev-5)",
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

function Header({ data, trailing }: { data: Data; trailing?: ReactNode }) {
  const act = useActions()
  const dateLocale = useDateLocale()
  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
      <AppIcon variant="mark" size={192} className="size-7" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {data.person.full_name ?? "Kretya Studio"}
        </p>
        <p className="text-muted-foreground text-xs">
          {format(data.now, "EEEE, d MMMM", { locale: dateLocale })}
        </p>
      </div>
      {trailing ?? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Pengaturan"
          className="text-muted-foreground"
          onClick={act.todo}
        >
          <Settings />
        </Button>
      )}
    </div>
  )
}

export function statusText(data: Data) {
  const { log, onBreak, working } = data
  if (!log) return "Belum clock in"
  if (onBreak) return "Istirahat"
  if (working) return `Bekerja sejak ${format(new Date(log.clock_in), "HH:mm")}`
  return `Selesai ${format(new Date(log.clock_out!), "HH:mm")}`
}

function StatusDot({ data }: { data: Data }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-2 shrink-0 rounded-full",
        !data.log
          ? "bg-foreground/30"
          : data.onBreak
            ? "bg-warning"
            : data.working
              ? "bg-success"
              : "bg-info",
      )}
    />
  )
}

/** Clock in, or break / clock out while working; nothing once done. */
function ClockButtons({
  data,
  size = "default",
  className,
}: {
  data: Data
  size?: "default" | "sm"
  className?: string
}) {
  const act = useActions()
  if (data.log && !data.working) return null
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {!data.log ? (
        <Button size={size} className="col-span-2" onClick={act.clockIn}>
          <LogIn data-icon="inline-start" />
          Clock in
        </Button>
      ) : (
        <>
          <Button size={size} variant="secondary" onClick={act.toggleBreak}>
            <Coffee data-icon="inline-start" />
            {data.onBreak ? "Lanjut" : "Istirahat"}
          </Button>
          <Button size={size} variant="secondary" onClick={act.clockOut}>
            <LogOut data-icon="inline-start" />
            Clock out
          </Button>
        </>
      )}
    </div>
  )
}

/** The big attendance card (layouts A and C). */
function AttendanceCard({ data }: { data: Data }) {
  return (
    <div className="bg-muted mx-3 mb-3 rounded-2xl p-4">
      <p className="text-muted-foreground flex items-center gap-2 text-[13px]">
        <StatusDot data={data} />
        {statusText(data)}
      </p>
      <p className="font-heading text-heading mt-1 text-3xl leading-tight font-medium tracking-tight tabular-nums">
        {data.log ? duration(data.worked) : "—"}
      </p>
      <ClockButtons data={data} className="mt-3" />
    </div>
  )
}

function Footer({ data, on }: { data: Data; on: On }) {
  return (
    <div className="mt-auto flex items-center gap-3 border-t border-white/8 px-4 py-2.5 text-[13px]">
      {on.leave && data.leave && (
        <span className="text-muted-foreground">
          Sisa cuti{" "}
          <span className="text-foreground font-medium tabular-nums">
            {data.leave.eligible
              ? `${data.leave.remaining}/${data.leave.quota}`
              : "—"}
          </span>
        </span>
      )}
      <OpenApp className="ml-auto" />
    </div>
  )
}

function OpenApp({ className }: { className?: string }) {
  const act = useActions()
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={() => act.open("/dashboard")}
    >
      Buka KRTY
      <ArrowUpRight data-icon="inline-end" />
    </Button>
  )
}

function Group({
  title,
  icon,
  count,
  children,
}: {
  title: string
  icon: ReactNode
  count?: number
  children: ReactNode
}) {
  return (
    <section className="py-1.5">
      <p className="text-muted-foreground flex items-center gap-1.5 px-2 py-1 text-xs font-medium [&_svg]:size-3.5">
        {icon}
        {title}
        {count ? (
          <span className="text-tertiary-foreground tabular-nums">{count}</span>
        ) : null}
      </p>
      <div className="flex flex-col">{children}</div>
    </section>
  )
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div className="hover:bg-muted flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors">
      {children}
    </div>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground px-2 py-2 text-[13px]">{children}</p>
  )
}

/* ─── Content lists ───────────────────────────────────────────────────── */

function ScheduleRows({ data }: { data: Data }) {
  const act = useActions()
  const [showPast, setShowPast] = useState(false)
  if (data.events.length === 0) return <Empty>Tidak ada jadwal hari ini</Empty>
  // Events already over fold into one line, so what's next stays in view.
  const isPast = (e: Data["events"][number]) =>
    !e.all_day && new Date(e.end_at) < data.now
  const pastCount = data.events.filter(isPast).length
  const events =
    showPast || pastCount < 2
      ? data.events
      : data.events.filter((e) => !isPast(e))
  const rows = events.map((e) => {
    const past = !e.all_day && new Date(e.end_at) < data.now
    const live =
      !e.all_day &&
      new Date(e.start_at) <= data.now &&
      new Date(e.end_at) >= data.now
    return (
      <Row key={e.id}>
        <span
          className={cn(
            "flex w-12 shrink-0 items-center gap-1 text-xs tabular-nums",
            live ? "text-success" : "text-tertiary-foreground",
          )}
          title={live ? "Sedang berlangsung" : undefined}
        >
          {e.all_day ? "Seharian" : format(new Date(e.start_at), "HH:mm")}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            past &&
              "text-tertiary-foreground line-through decoration-current/30",
          )}
        >
          {e.title}
        </span>
        {e.meeting_url && !past && (
          <Button size="xs" onClick={() => act.open(e.meeting_url!)}>
            <Video data-icon="inline-start" />
            Join
          </Button>
        )}
      </Row>
    )
  })
  return (
    <>
      {pastCount >= 2 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground justify-start self-start px-2"
          onClick={() => setShowPast((v) => !v)}
        >
          {showPast
            ? "Sembunyikan yang sudah lewat"
            : `${pastCount} jadwal sudah lewat`}
        </Button>
      )}
      {rows}
    </>
  )
}

function TaskRows({ data, limit = 5 }: { data: Data; limit?: number }) {
  const act = useActions()
  const dateLocale = useDateLocale()
  if (data.tasks.length === 0)
    return <Empty>Tidak ada tugas yang mendesak</Empty>
  const tomorrow = getLocalDateString(addDays(data.now, 1))
  const more = data.tasks.length - limit
  const rows = data.tasks.slice(0, limit).map((t) => {
    const date = t.due_date!
    const due =
      date < data.today
        ? { text: "Terlambat", tone: "text-destructive" }
        : date === data.today
          ? { text: "Hari ini", tone: "text-warning" }
          : {
              text:
                date === tomorrow
                  ? "Besok"
                  : format(new Date(`${date}T00:00:00`), "EEE d MMM", {
                      locale: dateLocale,
                    }),
              tone: "text-tertiary-foreground",
            }
    return (
      <Row key={t.id}>
        <Checkbox
          aria-label="Tandai selesai"
          checked={false}
          onCheckedChange={() => act.completeTask(t.id)}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate">{t.title}</span>
          <span className="text-muted-foreground block truncate text-xs">
            {t.projectName}
          </span>
        </span>
        <span className={cn("shrink-0 text-xs tabular-nums", due.tone)}>
          {due.text}
        </span>
      </Row>
    )
  })
  return (
    <>
      {rows}
      {more > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground mt-0.5 justify-start self-start px-2"
          onClick={() => act.open("/projects/my-tasks")}
        >
          {more} tugas lainnya
          <ArrowUpRight data-icon="inline-end" />
        </Button>
      )}
    </>
  )
}

function NotificationRows({ data, limit }: { data: Data; limit?: number }) {
  const act = useActions()
  const dateLocale = useDateLocale()
  if (data.unread.length === 0)
    return (
      <EmptyState
        title="Semua sudah dibaca"
        icon={<RiNotification3Line className="size-5" />}
        placement="inner"
        className={EMPTY_ON_GLASS}
      />
    )
  return (
    <ul className="flex flex-col">
      {data.unread.slice(0, limit).map((n) => {
        const Icon = iconFor(n.type)
        return (
          <li
            key={n.id}
            role="button"
            tabIndex={0}
            onClick={() => act.openNotification(n)}
            onKeyDown={(e) => e.key === "Enter" && act.openNotification(n)}
            className="hover:bg-muted flex cursor-default gap-3 rounded-lg px-2 py-2.5 transition-colors"
          >
            <DotIcon dot size={32}>
              <span className="bg-muted text-muted-foreground flex size-full items-center justify-center rounded-lg">
                <Icon className="size-4" />
              </span>
            </DotIcon>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
              <div className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate font-medium">
                  {n.title}
                </span>
                <time className="text-tertiary-foreground shrink-0 text-xs tabular-nums">
                  {formatDistanceToNowStrict(new Date(n.created_at!), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </time>
              </div>
              {n.message && (
                <p className="text-muted-foreground line-clamp-2 text-[13px]">
                  {n.message}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function ApprovalRows({ data }: { data: Data }) {
  const act = useActions()
  const tl = useT("leave")
  const dateLocale = useDateLocale()
  if (data.pending.length === 0)
    return (
      <EmptyState
        title="Tidak ada pengajuan yang menunggu"
        icon={<RiInboxLine className="size-5" />}
        placement="inner"
        className={EMPTY_ON_GLASS}
      />
    )
  return (
    <div className="flex flex-col">
      {data.pending.map((req) => {
        const days = leaveDays(req.start_date, req.end_date)
        return (
          <div
            key={req.id}
            className="flex items-start gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-(--row-hover)"
          >
            <Avatar className="size-8">
              {req.profiles?.avatar_url && (
                <AvatarImage src={req.profiles.avatar_url} />
              )}
              <AvatarFallback className="text-[11px]">
                {initials(req.profiles?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-[13px]">
              <p className="truncate">
                <span className="font-medium">
                  {req.profiles?.full_name ?? "—"}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  · {leaveTypeLabel(req.leave_type, tl)}
                </span>
              </p>
              <p className="text-muted-foreground tabular-nums">
                {formatLeaveRange(req.start_date, req.end_date, dateLocale)} ·{" "}
                {tl(daysKey(days), { n: days })}
              </p>
              {req.reason && (
                <p className="text-tertiary-foreground mt-0.5 line-clamp-2">
                  {req.reason}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Tolak"
                title="Tolak"
                onClick={() => act.decide(req.id, false)}
              >
                <RiCloseLine />
              </Button>
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label="Setujui"
                title="Setujui"
                onClick={() => act.decide(req.id, true)}
                className="text-green-11"
              >
                <RiCheckLine />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Today's schedule and tasks, as groups. */
function TodayGroups({
  data,
  on,
  taskLimit,
}: {
  data: Data
  on: On
  taskLimit?: number
}) {
  const showSchedule = on.schedule && data.events.length > 0
  const showTasks = on.tasks && data.tasks.length > 0
  // Nothing today: one calm empty state instead of two empty groups.
  if ((on.schedule || on.tasks) && !showSchedule && !showTasks)
    return (
      <EmptyState
        title="Hari ini masih kosong"
        description="Tidak ada jadwal atau tugas yang mendesak."
        icon={<Sun />}
        placement="inner"
        className={EMPTY_ON_GLASS}
      />
    )
  return (
    <>
      {showSchedule && (
        <Group
          title="Jadwal"
          icon={<CalendarDays />}
          count={data.events.length}
        >
          <ScheduleRows data={data} />
        </Group>
      )}
      {showTasks && (
        <Group title="Tugas" icon={<ListChecks />} count={data.tasks.length}>
          <TaskRows data={data} limit={taskLimit} />
        </Group>
      )}
    </>
  )
}

/** The tabs a layout can switch between, by what's turned on. */
function useTabs(data: Data, on: On) {
  const [tab, setTab] = useState<Tab>("today")
  const tabs = [
    (on.schedule || on.tasks) && {
      value: "today" as Tab,
      label: "Hari ini",
      icon: Sun,
      count: data.tasks.length + data.events.length,
    },
    on.notifications && {
      value: "inbox" as Tab,
      label: "Notifikasi",
      icon: Bell,
      count: data.unreadCount,
    },
    data.showApprovals && {
      value: "approvals" as Tab,
      label: "Approval",
      icon: Inbox,
      count: data.pending.length,
    },
  ].filter(Boolean) as {
    value: Tab
    label: string
    icon: typeof Sun
    count: number
  }[]
  const active = tabs.some((t) => t.value === tab) ? tab : tabs[0]?.value
  return { tabs, active, setTab }
}

function TabContent({
  data,
  on,
  active,
}: {
  data: Data
  on: On
  active: Tab | undefined
}) {
  if (active === "today") return <TodayGroups data={data} on={on} />
  if (active === "inbox") return <NotificationRows data={data} />
  if (active === "approvals") return <ApprovalRows data={data} />
  return null
}

/* ─── A · Tabs ────────────────────────────────────────────────────────── */

export function LayoutTabs({ data, on }: { data: Data; on: On }) {
  const { tabs, active, setTab } = useTabs(data, on)
  return (
    <Shell>
      <Header data={data} />
      {on.attendance && <AttendanceCard data={data} />}
      {tabs.length > 1 && (
        <div className="px-3 pb-1">
          <SegmentedControl
            value={active!}
            onChange={setTab}
            items={tabs.map((t) => ({
              value: t.value,
              label:
                t.count > 0 && t.value !== "today"
                  ? `${t.label} · ${t.count}`
                  : t.label,
            }))}
          />
        </div>
      )}
      <div className="max-h-[360px] overflow-y-auto px-2 py-1 [scrollbar-width:none]">
        <TabContent data={data} on={on} active={active} />
      </div>
      <Footer data={data} on={on} />
    </Shell>
  )
}

/* ─── B · One list ────────────────────────────────────────────────────── */

export function LayoutList({ data, on }: { data: Data; on: On }) {
  return (
    <Shell>
      {/* Attendance folded into the header: status, time, one action. */}
      <Header
        data={data}
        trailing={
          on.attendance ? (
            <span className="text-muted-foreground flex items-center gap-1.5 text-[13px] tabular-nums">
              <StatusDot data={data} />
              {data.log ? duration(data.worked) : "Belum masuk"}
            </span>
          ) : undefined
        }
      />
      {on.attendance && (
        <ClockButtons data={data} size="sm" className="px-4 pb-3" />
      )}
      <div className="max-h-[440px] overflow-y-auto border-t border-white/8 px-2 py-1 [scrollbar-width:none]">
        {data.showApprovals && data.pending.length > 0 && (
          <Group
            title="Menunggu approval"
            icon={<Inbox />}
            count={data.pending.length}
          >
            <ApprovalRows data={data} />
          </Group>
        )}
        <TodayGroups data={data} on={on} />
        {on.notifications && (
          <Group title="Notifikasi" icon={<Bell />} count={data.unreadCount}>
            <NotificationRows data={data} limit={3} />
          </Group>
        )}
      </div>
      <Footer data={data} on={on} />
    </Shell>
  )
}

/* ─── C · Summary tiles ───────────────────────────────────────────────── */

export function LayoutTiles({ data, on }: { data: Data; on: On }) {
  const act = useActions()
  const { tabs, active, setTab } = useTabs(data, on)
  const tiles = [
    ...tabs.map((t) => ({ ...t, onClick: () => setTab(t.value) })),
    ...(on.leave && data.leave?.eligible
      ? [
          {
            value: "leave" as const,
            label: "Sisa cuti",
            icon: CalendarDays,
            count: data.leave.remaining,
            onClick: () => act.open("/leave"),
          },
        ]
      : []),
  ]
  return (
    <Shell>
      <Header data={data} />
      {on.attendance && <AttendanceCard data={data} />}
      {tiles.length > 0 && (
        <div
          className="grid gap-2 px-3 pb-2"
          style={{ gridTemplateColumns: `repeat(${tiles.length}, 1fr)` }}
        >
          {tiles.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={t.onClick}
              className={cn(
                "flex flex-col items-start gap-1 rounded-2xl px-3 py-2.5 text-left transition-colors",
                active === t.value
                  ? "bg-accent text-foreground"
                  : "hover:bg-muted text-muted-foreground",
              )}
            >
              <t.icon className="size-4" />
              <span className="text-foreground text-lg leading-none font-medium tabular-nums">
                {t.count}
              </span>
              <span className="text-xs">{t.label}</span>
            </button>
          ))}
        </div>
      )}
      <div className="max-h-[320px] overflow-y-auto border-t border-white/8 px-2 py-1 [scrollbar-width:none]">
        <TabContent data={data} on={on} active={active} />
      </div>
      <div className="flex border-t border-white/8 px-4 py-2.5">
        <OpenApp className="ml-auto" />
      </div>
    </Shell>
  )
}

/* ─── D · Rail ────────────────────────────────────────────────────────── */

export function LayoutRail({ data, on }: { data: Data; on: On }) {
  const act = useActions()
  const { tabs, active: tab, setTab } = useTabs(data, on)
  const [settings, setSettings] = useState(false)
  const active = settings ? undefined : tab
  const current = tabs.find((t) => t.value === active)
  const { scenario } = data
  if (scenario === "signedOut") return <RailSignedOut />
  return (
    <Shell width={420} className="h-[560px]">
      <div className="flex min-h-0 flex-1">
        {/* Icon rail */}
        <nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-white/8 py-3">
          <AppIcon variant="mark" size={192} className="mb-2 size-6" />
          {tabs.map((t) => (
            <Button
              key={t.value}
              variant="ghost"
              size="icon"
              aria-label={t.label}
              title={t.label}
              onClick={() => {
                setSettings(false)
                setTab(t.value)
              }}
              className={cn(
                "relative",
                active === t.value
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <DotIcon dot={t.count > 0 && t.value !== "today"}>
                <t.icon className="size-4" />
              </DotIcon>
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Pengaturan"
            title="Pengaturan"
            className={cn(
              "mt-auto",
              settings ? "bg-accent text-foreground" : "text-muted-foreground",
            )}
            onClick={() => setSettings(true)}
          >
            <Settings />
          </Button>
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-baseline justify-between gap-2 px-4 pt-4 pb-2">
            <p className="text-sm font-medium">
              {settings ? "Pengaturan" : current?.label}
            </p>
            {!settings &&
              on.leave &&
              data.leave?.eligible &&
              scenario !== "loading" &&
              scenario !== "error" && (
                <span className="text-muted-foreground text-xs">
                  Sisa cuti{" "}
                  <span className="text-foreground font-medium tabular-nums">
                    {data.leave.remaining}/{data.leave.quota}
                  </span>
                </span>
              )}
          </div>
          {scenario === "offline" && !settings && (
            <div className="bg-warning-subtle text-warning mx-3 mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
              <WifiOff className="size-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">
                Offline · data terakhir {format(data.now, "HH:mm")}
              </span>
              <Button
                variant="ghost"
                size="xs"
                className="text-warning -my-1"
                onClick={act.retry}
              >
                Coba lagi
              </Button>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 [scrollbar-width:none]">
            {settings ? (
              <SettingsPanel data={data} />
            ) : scenario === "loading" ? (
              <RailSkeleton />
            ) : scenario === "error" ? (
              <EmptyState
                title="Gagal memuat data"
                description="Periksa koneksi, lalu coba lagi."
                icon={<TriangleAlert />}
                action={{ label: "Coba lagi", onClick: act.retry }}
                placement="inner"
                className={EMPTY_ON_GLASS}
              />
            ) : active === "today" ? (
              <TodayGroups data={data} on={on} taskLimit={8} />
            ) : (
              <TabContent data={data} on={on} active={active} />
            )}
          </div>
        </div>
      </div>

      {/* Attendance pinned to the bottom: what's going on, then the action. */}
      {on.attendance && <RailClock data={data} />}
    </Shell>
  )
}

/** The rail's attendance bar: one line of state, the time, and the actions
 *  at their own width (not stretched). */
function RailClock({ data }: { data: Data }) {
  const act = useActions()
  const done = data.log && !data.working
  if (data.scenario === "loading")
    return (
      <div className="flex items-center gap-3 border-t border-white/8 px-4 py-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
    )
  if (data.scenario === "error")
    return (
      <div className="flex items-center gap-3 border-t border-white/8 px-4 py-3">
        <span
          aria-hidden
          className="bg-destructive size-2 shrink-0 rounded-full"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">Absen tidak termuat</p>
          <p className="text-muted-foreground truncate text-xs">
            Clock in dari web app dulu
          </p>
        </div>
        <Button
          className="h-9 px-4"
          variant="secondary"
          onClick={() => act.open("/attendance")}
        >
          Buka web
          <ArrowUpRight data-icon="inline-end" />
        </Button>
      </div>
    )
  const offline = data.scenario === "offline"
  return (
    <div className="flex items-center gap-3 border-t border-white/8 px-4 py-3">
      <StatusDot data={data} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium tabular-nums">
          {!data.log
            ? "Belum clock in"
            : data.onBreak
              ? `Istirahat · ${duration(data.worked)}`
              : duration(data.worked)}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {!data.log
            ? "Mulai hari kerjamu"
            : done
              ? statusText(data)
              : `Sejak ${format(new Date(data.log.clock_in), "HH:mm")}`}
        </p>
      </div>
      {!data.log ? (
        <Button className="h-9 px-4" disabled={offline} onClick={act.clockIn}>
          <LogIn data-icon="inline-start" />
          Clock in
        </Button>
      ) : data.working ? (
        <div className="flex items-center gap-2">
          <Button
            className="h-9 px-4"
            variant="secondary"
            disabled={offline}
            onClick={act.toggleBreak}
          >
            <Coffee data-icon="inline-start" />
            {data.onBreak ? "Lanjut" : "Istirahat"}
          </Button>
          <Button
            className="h-9 px-4"
            variant="secondary"
            disabled={offline}
            onClick={act.clockOut}
          >
            <LogOut data-icon="inline-start" />
            Clock out
          </Button>
        </div>
      ) : null}
    </div>
  )
}

/**
 * An icon with an unread dot on its top-right corner. The icon is cut out
 * (masked) around the dot, so the dot needs no ring and sits cleanly on
 * any background, translucent ones included.
 */
function DotIcon({
  dot,
  size = 16,
  className,
  children,
}: {
  dot: boolean
  /** The icon's box in px (the dot is 8px). */
  size?: number
  className?: string
  children: ReactNode
}) {
  const cx = size - 2
  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <span
        className="flex size-full items-center justify-center"
        style={
          dot
            ? {
                mask: `radial-gradient(circle at ${cx}px 2px, transparent 5.5px, #000 6px)`,
              }
            : undefined
        }
      >
        {children}
      </span>
      {dot && (
        <span className="bg-primary absolute -top-0.5 -right-0.5 size-2 rounded-full" />
      )}
    </span>
  )
}

/**
 * The app's own settings (not the web app's): desktop notifications, how
 * the app starts and opens, the account. No theme choice: always dark.
 */
function SettingsPanel({ data }: { data: Data }) {
  const act = useActions()
  const [prefs, setPref] = useDesktopPrefs()
  const toggle = (key: keyof DesktopPrefs) => (value: boolean) =>
    setPref(key, value)

  return (
    <div className="flex flex-col gap-1 pb-2">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <Avatar className="size-8">
          <AvatarFallback className="text-[11px]">
            {initials(data.person.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {data.person.full_name}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {canManageByRole(data.person.role) ? "Admin" : "Karyawan"} · Kretya
            Studio
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={act.signOut}>
          Keluar
        </Button>
      </div>

      <SettingsGroup title="Notifikasi desktop">
        <SettingRow
          label="Notifikasi baru"
          hint="Pengumuman, tugas, approval, review"
          checked={prefs.notifyNew}
          onChange={toggle("notifyNew")}
        />
        <SettingRow
          label="Pengingat jadwal"
          hint="10 menit sebelum mulai, dengan link Join"
          checked={prefs.notifyEvents}
          onChange={toggle("notifyEvents")}
        />
        <SettingRow
          label="Pengingat absen"
          hint="Clock in jam 09:00, clock out setelah 8 jam"
          checked={prefs.notifyClock}
          onChange={toggle("notifyClock")}
        />
      </SettingsGroup>

      <SettingsGroup title="Umum">
        <SettingRow
          label="Buka saat Mac menyala"
          checked={prefs.launchAtLogin}
          onChange={toggle("launchAtLogin")}
        />
        <SettingRow
          label="Durasi kerja di menu bar"
          hint="Tampilkan 4j 51m di samping ikon"
          checked={prefs.timerInMenuBar}
          onChange={toggle("timerInMenuBar")}
        />
        <div className="flex items-center gap-3 px-2 py-2 text-sm">
          <span className="flex-1">Shortcut buka</span>
          <KbdGroup>
            <Kbd>⌥</Kbd>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </div>
      </SettingsGroup>

      <div className="text-tertiary-foreground flex items-center justify-between px-2 pt-2 text-xs">
        <span>KRTY untuk Mac · versi 0.1.0</span>
        <Button variant="ghost" size="xs" onClick={act.checkUpdate}>
          Cek pembaruan
        </Button>
      </div>
    </div>
  )
}

function SettingsGroup({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-t border-white/8 pt-2">
      <p className="text-muted-foreground px-2 py-1 text-xs font-medium">
        {title}
      </p>
      <div className="flex flex-col">{children}</div>
    </section>
  )
}

function SettingRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors">
      <span className="min-w-0 flex-1">
        <span className="block">{label}</span>
        {hint && (
          <span className="text-muted-foreground block text-xs">{hint}</span>
        )}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

/** Not signed in: the app's mark and one way in (the web app's Google
 *  sign-in, opened in the browser). */
function RailSignedOut() {
  const act = useActions()
  return (
    <Shell width={420} className="h-[560px]">
      <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
        <AppIcon variant="mark" size={192} className="size-12" />
        <p className="font-heading text-heading mt-6 text-xl font-medium">
          Masuk ke Kretya
        </p>
        <p className="text-muted-foreground mt-2 text-sm text-balance">
          Absen, jadwal, tugas dan notifikasi kamu langsung dari menu bar.
        </p>
        <Button className="mt-6 h-9 px-4" onClick={act.signIn}>
          Lanjutkan dengan Google
          <ArrowUpRight data-icon="inline-end" />
        </Button>
        <p className="text-tertiary-foreground mt-3 text-xs">
          Login dibuka di browser, lalu kembali ke sini.
        </p>
      </div>
    </Shell>
  )
}

/** Placeholder rows while the first load runs. */
function RailSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-2 py-1.5">
      <Skeleton className="mb-1 h-3 w-16" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
      <Skeleton className="mt-3 mb-1 h-3 w-14" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="size-4 rounded-[5px]" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

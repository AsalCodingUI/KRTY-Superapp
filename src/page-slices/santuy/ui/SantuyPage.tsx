"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Panel, PanelEmpty, surfaceClassName } from "@/components/panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { accessLevel } from "@/shared/config/access"
import { ContextTarget, copyText, type CtxItem } from "@/shared/context-menu"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { registerUndo, runUndo, UndoStale } from "@/shared/undo"
import {
  addDays,
  nextWeekday,
  santuySchedule,
  todayIn,
  type SantuySession,
} from "@/shared/lib/santuy"
import {
  RiCalendarLine,
  RiCupLine,
  RiExternalLinkLine,
  RiFileCopyLine,
  RiMoreFill,
  RiSettings5Line,
  RiVideoOnLine,
} from "@/shared/ui/lucide-icons"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import {
  CalendarClock,
  CalendarOff,
  Copy,
  Link as LinkIcon,
  RotateCcw,
  Settings2,
  UserCheck,
  Video,
} from "@/components/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  activeQueue,
  commitSantuy,
  santuyKey,
  santuyMeet,
  setSantuyWeek,
  type SantuyWeekValue,
  useSantuy,
  type SantuyData,
  type SantuyMember,
} from "../data"
import {
  AddPersonDialog,
  SettingsDialog,
  WeekDialog,
  type WeekChoice,
} from "./SantuyDialogs"
import { SantuyQueue } from "./SantuyQueue"
import { dayDate, endTime, PersonAvatar, personName, zoneLabel } from "./shared"

/** How many upcoming weeks the schedule lists. */
const LIST_WEEKS = 12

/**
 * Sharing Santuy: who presents which week (a looping queue), the Meet link,
 * and, for stakeholders and PMs, the controls: reorder/add/remove people,
 * assign or skip a week, and set the day and time.
 */
export function SantuyPage({
  googleConfigured,
}: {
  googleConfigured: boolean
}) {
  const t = useT("santuy")
  const { profile } = useUserProfile()
  const canEdit = !!profile && accessLevel(profile) !== "employee"
  const { data, isLoading, isError } = useSantuy()

  return (
    <div className="flex flex-col">
      <PageHeader title={t("title")} />
      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : isError || !data ? (
        <EmptyState title={t("loadFailed")} icon={<RiCupLine />} />
      ) : (
        <SantuyBody
          data={data}
          canEdit={canEdit}
          profileLoaded={!!profile}
          googleConfigured={googleConfigured}
        />
      )}
    </div>
  )
}

function SantuyBody({
  data,
  canEdit,
  profileLoaded,
  googleConfigured,
}: {
  data: SantuyData
  canEdit: boolean
  /** Who's viewing is known (canEdit is final). */
  profileLoaded: boolean
  googleConfigured: boolean
}) {
  const t = useT("santuy")
  const tu = useT("undo")
  const dateLocale = useDateLocale()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [weekOpen, setWeekOpen] = useState(false)
  const [weekDate, setWeekDate] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { settings } = data
  const queue = activeQueue(data.members)
  const today = todayIn(settings.timezone)
  const tz = zoneLabel(settings.timezone)
  // A moved week's own time, in the session's zone.
  const hhmm = (d: Date) =>
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: settings.timezone,
    })
  const timeLabel = `${settings.startTime}–${endTime(settings.startTime, settings.durationMin)} ${tz}`

  // Long enough to reach everyone's next turn, plus the listed weeks.
  const schedule = useMemo(
    () =>
      santuySchedule({
        settings,
        queue,
        weeks: data.weeks,
        from: today,
        to: addDays(
          today,
          7 * (Math.max(queue.length, LIST_WEEKS) + data.weeks.length + 2),
        ),
      }).filter((s) => !s.history),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, today],
  )
  const listed = schedule.slice(0, LIST_WEEKS)
  const upcoming = schedule.find((s) => s.kind === "session")
  const nextDates = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of schedule)
      if (s.kind === "session" && s.profileId && !map.has(s.profileId))
        map.set(s.profileId, s.date)
    return map
  }, [schedule])

  // Monday–Sunday week of today.
  const weekStart = addDays(today, -((dayDate(today).getDay() + 6) % 7))
  const isThisWeek = (date: string) =>
    date >= weekStart && date <= addDays(weekStart, 6)

  const weekChoices: WeekChoice[] = useMemo(() => {
    const first = nextWeekday(
      today > settings.anchorDate ? today : settings.anchorDate,
      settings.weekday,
    )
    const byDate = new Map(
      santuySchedule({
        settings,
        queue,
        weeks: data.weeks,
        from: first,
        to: addDays(first, 7 * 25),
      }).map((s) => [s.date, s]),
    )
    return Array.from({ length: 26 }, (_, i) => {
      const date = addDays(first, 7 * i)
      return { date, rotationId: byDate.get(date)?.rotationProfileId ?? null }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, today])

  // /calendar/santuy?week=<date> (the calendar's "Tunjuk orang buat minggu
  // ini"): open that week's dialog, then drop the param.
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const linkedWeek = searchParams.get("week")
  useEffect(() => {
    if (!linkedWeek || !profileLoaded) return
    if (canEdit && weekChoices.some((c) => c.date === linkedWeek)) {
      setWeekDate(linkedWeek)
      setWeekOpen(true)
    }
    router.replace(pathname, { scroll: false })
  }, [linkedWeek, profileLoaded, canEdit, weekChoices, router, pathname])

  const refresh = () => queryClient.invalidateQueries({ queryKey: santuyKey })

  const run = async (work: () => Promise<unknown>, success?: string) => {
    setBusy(true)
    try {
      await work()
      if (success) toast.success(success)
    } catch (error) {
      toast.error(t("saveFailed"))
      throw error
    } finally {
      await refresh()
      setBusy(false)
    }
  }

  /**
   * Save a queue edit. `undo` (the queue before it) adds an "Undo" action
   * to the toast, which saves that order back.
   */
  const changeQueue = async (
    members: SantuyMember[],
    note: string,
    undo?: SantuyMember[],
  ) => {
    // The latest saved state (an undo can come after other edits).
    const current = queryClient.getQueryData<SantuyData>(santuyKey) ?? data
    // Show the new order at once (the drop shouldn't snap back while saving).
    queryClient.setQueryData<SantuyData>(santuyKey, {
      ...current,
      members: members.map((m, position) => ({ ...m, position })),
    })
    try {
      await run(() => commitSantuy(current, members))
    } catch {
      return
    }
    // ⌘Z and the toast's Undo are the same step (shared/undo).
    const undoId = undo ? registerQueueUndo(undo, members) : 0
    toast.success(
      note,
      undo
        ? {
            action: {
              label: t("undo"),
              onClick: () =>
                void (undoId
                  ? runUndo("undo", undoId)
                  : changeQueue(undo, t("saved"))),
            },
          }
        : undefined,
    )
  }

  /** Back to `before` while the saved queue is still `after`. */
  const registerQueueUndo = (before: SantuyMember[], after: SantuyMember[]) => {
    const sig = (list: SantuyMember[]) =>
      list.map((m) => `${m.profileId}:${m.active}`).join()
    const go = async (expected: SantuyMember[], next: SantuyMember[]) => {
      await refresh()
      const current = queryClient.getQueryData<SantuyData>(santuyKey)
      if (!current || sig(current.members) !== sig(expected))
        throw new UndoStale()
      queryClient.setQueryData<SantuyData>(santuyKey, {
        ...current,
        members: next.map((m, position) => ({ ...m, position })),
      })
      await run(() => commitSantuy(current, next))
    }
    return registerUndo({
      label: tu("santuyQueue"),
      undo: () => go(after, before),
      redo: () => go(before, after),
    })
  }

  const saveWeek = async (date: string, value: SantuyWeekValue) => {
    // What the week was, for ⌘Z (shared/undo).
    const week = data.weeks.find((w) => w.date === date)
    const before: SantuyWeekValue = !week
      ? null
      : week.kind === "assign" && week.profileId
        ? { kind: "assign", profileId: week.profileId }
        : week.kind === "move" && week.movedDate
          ? {
              kind: "move",
              movedDate: week.movedDate,
              movedTime: week.movedTime ?? null,
              note: week.note,
            }
          : { kind: "skip", note: week.note }
    await run(() => setSantuyWeek(date, value), t("weekSaved"))
    const same = (
      w: SantuyData["weeks"][number] | undefined,
      v: SantuyWeekValue,
    ) =>
      !v
        ? !w
        : !!w &&
          w.kind === v.kind &&
          (v.kind !== "assign" || w.profileId === v.profileId) &&
          (v.kind !== "move" ||
            (w.movedDate === v.movedDate &&
              (w.movedTime ?? null) === (v.movedTime ?? null)))
    if (JSON.stringify(before) === JSON.stringify(value)) return
    const go = async (expected: SantuyWeekValue, next: SantuyWeekValue) => {
      await refresh()
      const current = queryClient.getQueryData<SantuyData>(santuyKey)
      if (
        !current ||
        !same(
          current.weeks.find((w) => w.date === date),
          expected,
        )
      )
        throw new UndoStale()
      await run(() => setSantuyWeek(date, next))
    }
    registerUndo({
      label: tu("santuyWeek", { date: dayLabel(date, "d MMM") }),
      undo: () => go(value, before),
      redo: () => go(before, value),
    })
  }

  const dayLabel = (date: string, pattern = "EEE, d MMM") =>
    format(dayDate(date), pattern, { locale: dateLocale })

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-4">
        <NextUpCard
          data={data}
          session={upcoming}
          thisWeek={!!upcoming && isThisWeek(upcoming.date)}
          isToday={upcoming?.date === today}
          timeLabel={timeLabel}
          canEdit={canEdit}
          googleConfigured={googleConfigured}
          onSettings={() => setSettingsOpen(true)}
          onAssign={(date) => {
            setWeekDate(date)
            setWeekOpen(true)
          }}
          onMeetChanged={refresh}
        />

        <Panel
          title={t("scheduleTitle")}
          action={
            canEdit ? (
              <Button
                variant="ghost"
                size="sm"
                className="-mr-2"
                onClick={() => {
                  setWeekDate(null)
                  setWeekOpen(true)
                }}
              >
                <RiCalendarLine data-icon="inline-start" />
                {t("weekButton")}
              </Button>
            ) : undefined
          }
        >
          {listed.length === 0 ? (
            <PanelEmpty
              icon={<RiCalendarLine />}
              title={t("noSessions")}
              description={t("noSessionsHint")}
            />
          ) : (
            <ul className={cn(busy && "opacity-70")}>
              {listed.map((s) => (
                <ScheduleRow
                  key={s.date}
                  session={s}
                  data={data}
                  dayLabel={dayLabel(s.movedTo ?? s.date)}
                  timeLabel={
                    s.movedTo
                      ? `${hhmm(s.start)}–${hhmm(s.end)} ${tz}`
                      : timeLabel
                  }
                  movedFrom={s.movedTo ? dayLabel(s.date) : null}
                  badge={
                    (s.movedTo ?? s.date) === today
                      ? t("today")
                      : isThisWeek(s.movedTo ?? s.date)
                        ? t("thisWeek")
                        : null
                  }
                  canEdit={canEdit}
                  busy={busy}
                  meetUrl={data.settings.meetUrl}
                  onAssign={() => {
                    setWeekDate(s.date)
                    setWeekOpen(true)
                  }}
                  onSkip={() =>
                    saveWeek(s.date, { kind: "skip" }).catch(() => {})
                  }
                  onReset={() =>
                    run(
                      () => setSantuyWeek(s.date, null),
                      t("restoredWeek", { date: dayLabel(s.date) }),
                    ).catch(() => {})
                  }
                />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <SantuyQueue
          data={data}
          canEdit={canEdit}
          nextDates={nextDates}
          upcomingId={upcoming?.rotationProfileId ?? null}
          busy={busy}
          onChange={changeQueue}
          onAdd={() => setAddOpen(true)}
        />
      </div>

      {canEdit && (
        <>
          <WeekDialog
            open={weekOpen}
            onOpenChange={setWeekOpen}
            data={data}
            dates={weekChoices}
            initialDate={weekDate}
            onSave={saveWeek}
          />
          <AddPersonDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            data={data}
            onAdd={async (profileId) => {
              const existing = data.members.find(
                (m) => m.profileId === profileId,
              )
              const active = data.members.filter((m) => m.active)
              const left = data.members.filter(
                (m) => !m.active && m.profileId !== profileId,
              )
              const name = personName(data.people.get(profileId))
              await run(
                () =>
                  commitSantuy(data, [
                    ...active,
                    existing
                      ? { ...existing, active: true }
                      : { profileId, position: active.length, active: true },
                    ...left,
                  ]),
                t("added", { name }),
              )
            }}
          />
          <SettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            data={data}
            onSave={(schedule) =>
              run(async () => {
                await commitSantuy(data, data.members, schedule)
                // Keep our Google event on the same day/time (best effort).
                if (settings.googleEventId)
                  await santuyMeet({ action: "sync" }).catch(() => {})
              }, t("settingsSaved"))
            }
          />
        </>
      )}
    </div>
  )
}

function ScheduleRow({
  session: s,
  data,
  dayLabel,
  timeLabel,
  movedFrom,
  badge,
  canEdit,
  busy,
  meetUrl,
  onAssign,
  onSkip,
  onReset,
}: {
  session: SantuySession
  data: SantuyData
  dayLabel: string
  timeLabel: string
  /** Moved: the week's usual day. */
  movedFrom: string | null
  badge: string | null
  canEdit: boolean
  busy: boolean
  meetUrl: string | null
  onAssign: () => void
  /** Take the week off (the presenter goes the week after). */
  onSkip: () => void
  onReset: () => void
}) {
  const t = useT("santuy")
  const skip = s.kind === "skip"
  const person = s.profileId ? data.people.get(s.profileId) : null
  const rotation = s.rotationProfileId
    ? data.people.get(s.rotationProfileId)
    : null
  const overridden = skip || s.assigned || !!s.movedTo

  return (
    // Right-click: the "…" menu's actions, plus Meet and copy.
    <ContextTarget
      type="santuy-week"
      id={s.date}
      label={skip ? dayLabel : `${dayLabel} · ${personName(person)}`}
      suppress={["button"]}
      items={() =>
        visibleItems([
          {
            id: "assign",
            label: t("assignWeek"),
            icon: UserCheck,
            hidden: !canEdit,
            disabled: busy,
            onSelect: onAssign,
          },
          {
            id: "move",
            label: t("moveWeek"),
            icon: CalendarClock,
            hidden: !canEdit || skip,
            disabled: busy,
            onSelect: onAssign,
          },
          {
            id: "skip",
            label: t("skipWeek"),
            icon: CalendarOff,
            hidden: !canEdit || skip,
            disabled: busy,
            onSelect: onSkip,
          },
          {
            id: "reset",
            label: t("backToRotation"),
            icon: RotateCcw,
            hidden: !canEdit || !overridden,
            disabled: busy,
            onSelect: onReset,
          },
          ...meetItems(skip ? null : meetUrl, t),
          {
            id: "copy-name",
            label: t("ctxCopyName"),
            icon: Copy,
            hidden: skip || !person,
            onSelect: () =>
              copyWithToast(personName(person), t("ctxNameCopied")),
          },
        ])
      }
    >
      <li
        className={cn(
          "border-border flex min-h-14 items-center gap-3 border-b px-4 py-2.5 last:border-b-0",
          badge && "bg-accent/40",
        )}
      >
        <div className="flex w-[5.5rem] shrink-0 flex-col sm:w-28">
          <span
            className={cn(
              "text-sm tabular-nums",
              skip ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {dayLabel}
          </span>
          {/* Same every week; phones see it in the card above. */}
          <span className="text-tertiary-foreground text-xs tabular-nums max-sm:hidden">
            {timeLabel}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {skip ? (
            <span className="text-muted-foreground min-w-0 truncate text-sm">
              {t("skip")}
              {rotation && (
                <span className="text-tertiary-foreground max-sm:hidden">
                  {" · "}
                  {t("wouldBe", { name: personName(rotation) })}
                </span>
              )}
            </span>
          ) : (
            <>
              <PersonAvatar person={person} />
              <div className="flex min-w-0 flex-col">
                <span className="text-foreground truncate text-sm">
                  {personName(person)}
                </span>
                {s.assigned && rotation && rotation.id !== person?.id && (
                  <span className="text-tertiary-foreground truncate text-xs">
                    {t("wouldBe", { name: personName(rotation) })}
                  </span>
                )}
                {movedFrom && (
                  <span className="text-tertiary-foreground truncate text-xs">
                    {t("movedFrom", { date: movedFrom })}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {badge && <Badge variant="info">{badge}</Badge>}
          {skip && <Badge variant="secondary">{t("skip")}</Badge>}
          {s.assigned && <Badge variant="warning">{t("assigned")}</Badge>}
          {movedFrom && <Badge variant="info">{t("moved")}</Badge>}
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("rowActions")}
                    className="text-muted-foreground -mr-1.5"
                    disabled={busy}
                  />
                }
              >
                <RiMoreFill />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem onClick={onAssign}>
                  {t("assignWeek")}
                </DropdownMenuItem>
                {!skip && (
                  <>
                    <DropdownMenuItem onClick={onAssign}>
                      {t("moveWeek")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onSkip}>
                      {t("skipWeek")}
                    </DropdownMenuItem>
                  </>
                )}
                {overridden && (
                  <DropdownMenuItem onClick={onReset}>
                    {t("backToRotation")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </li>
    </ContextTarget>
  )
}

const visibleItems = (items: CtxItem[]) => items.filter((item) => !item.hidden)

async function copyWithToast(text: string, done: string) {
  if (await copyText(text)) toast.success(done)
  else toast.error(text)
}

/** Gabung Meet / Salin link Meet, when there is a link. */
function meetItems(
  meetUrl: string | null,
  t: ReturnType<typeof useT<"santuy">>,
): CtxItem[] {
  if (!meetUrl) return []
  return [
    {
      id: "join-meet",
      label: t("ctxJoinMeet"),
      icon: Video,
      onSelect: () =>
        void window.open(meetUrl, "_blank", "noopener,noreferrer"),
    },
    {
      id: "copy-meet",
      label: t("ctxCopyLink"),
      icon: LinkIcon,
      onSelect: () => copyWithToast(meetUrl, t("copied")),
    },
  ]
}

/** The next session big, with the Meet link (copy / join / manage). */
function NextUpCard({
  data,
  session,
  thisWeek,
  isToday,
  timeLabel,
  canEdit,
  googleConfigured,
  onSettings,
  onAssign,
  onMeetChanged,
}: {
  data: SantuyData
  session?: SantuySession
  thisWeek: boolean
  isToday: boolean
  timeLabel: string
  canEdit: boolean
  googleConfigured: boolean
  onSettings: () => void
  /** Open the week dialog on this session's date. */
  onAssign: (date: string) => void
  onMeetChanged: () => Promise<unknown>
}) {
  const t = useT("santuy")
  const dateLocale = useDateLocale()
  const person = session?.profileId ? data.people.get(session.profileId) : null
  const meetUrl = data.settings.meetUrl

  return (
    <section className={cn(surfaceClassName, "overflow-hidden")}>
      {/* Right-click: pick someone for this session, the schedule, Meet. */}
      <ContextTarget
        type="santuy-next"
        suppress={["button"]}
        label={session ? personName(person) : t("title")}
        items={() =>
          visibleItems([
            {
              id: "assign",
              label: t("ctxAssignNext"),
              icon: UserCheck,
              hidden: !canEdit || !session,
              onSelect: () => session && onAssign(session.date),
            },
            {
              id: "settings",
              label: t("settingsButton"),
              icon: Settings2,
              hidden: !canEdit,
              onSelect: onSettings,
            },
            ...meetItems(meetUrl, t),
            {
              id: "copy-name",
              label: t("ctxCopyName"),
              icon: Copy,
              hidden: !person,
              onSelect: () =>
                copyWithToast(personName(person), t("ctxNameCopied")),
            },
          ])
        }
      >
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <PersonAvatar
              person={person}
              className="size-14"
              fallbackClassName="text-lg"
            />
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-meta">
                  {t("presenter")}
                </span>
                {session && (
                  <Badge variant={thisWeek ? "info" : "secondary"}>
                    {isToday
                      ? t("today")
                      : thisWeek
                        ? t("thisWeek")
                        : t("nextUp")}
                  </Badge>
                )}
              </div>
              <span className="text-heading truncate text-lg font-medium">
                {session ? personName(person) : t("noSessions")}
              </span>
              {session && (
                <span className="text-muted-foreground text-sm tabular-nums">
                  {format(dayDate(session.date), "EEEE, d MMMM yyyy", {
                    locale: dateLocale,
                  })}
                  {" · "}
                  {timeLabel}
                </span>
              )}
            </div>
          </div>
          {canEdit && (
            <Button
              variant="outline"
              className="self-start sm:self-center"
              onClick={onSettings}
            >
              <RiSettings5Line data-icon="inline-start" />
              {t("settingsButton")}
            </Button>
          )}
        </div>
      </ContextTarget>
      <MeetRow
        meetUrl={meetUrl}
        canEdit={canEdit}
        googleConfigured={googleConfigured}
        onChanged={onMeetChanged}
      />
    </section>
  )
}

function MeetRow({
  meetUrl,
  canEdit,
  googleConfigured,
  onChanged,
}: {
  meetUrl: string | null
  canEdit: boolean
  googleConfigured: boolean
  onChanged: () => Promise<unknown>
}) {
  const t = useT("santuy")
  const [busy, setBusy] = useState(false)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [pasting, setPasting] = useState(false)
  const [draft, setDraft] = useState(meetUrl ?? "")
  const showPaste = canEdit && (!googleConfigured || pasting)

  const copy = async () => {
    if (!meetUrl) return
    try {
      await navigator.clipboard.writeText(meetUrl)
      toast.success(t("copied"))
    } catch {
      toast.error(meetUrl)
    }
  }

  const create = async () => {
    setBusy(true)
    try {
      await santuyMeet({ action: "google" })
      toast.success(t("meetCreated"))
      await onChanged()
    } catch {
      toast.error(t("meetFailed"))
    } finally {
      setBusy(false)
    }
  }

  const saveManual = async () => {
    const url = draft.trim()
    if (url && !/^https:\/\/\S+$/i.test(url)) {
      toast.error(t("invalidLink"))
      return
    }
    setBusy(true)
    try {
      await santuyMeet({ action: "manual", url })
      toast.success(t("linkSaved"))
      setPasting(false)
      setDraft("")
      await onChanged()
    } catch {
      toast.error(t("saveFailed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    // Right-click: the row's buttons (join, copy, new / replace, paste).
    <ContextTarget
      type="santuy-meet"
      label={t("meetTitle")}
      suppress={["button", "link"]}
      items={() =>
        visibleItems([
          ...meetItems(meetUrl, t),
          {
            id: "create",
            label: meetUrl ? t("replaceMeet") : t("createMeet"),
            icon: Video,
            hidden: !canEdit || !googleConfigured,
            disabled: busy,
            onSelect: () => (meetUrl ? setConfirmReplace(true) : create()),
          },
          {
            id: "paste",
            label: t("pasteLink"),
            icon: LinkIcon,
            hidden: !canEdit || !googleConfigured || pasting,
            onSelect: () => {
              setDraft(meetUrl ?? "")
              setPasting(true)
            },
          },
        ])
      }
    >
      <div className="bg-muted dark:bg-muted/40 border-border flex flex-col gap-3 border-t px-5 py-3.5">
        <div className="flex items-center gap-3">
          <RiVideoOnLine className="text-muted-foreground size-4 shrink-0" />
          {meetUrl ? (
            <a
              href={meetUrl}
              target="_blank"
              rel="noreferrer"
              className="text-foreground min-w-0 flex-1 truncate text-sm underline-offset-2 hover:underline"
            >
              {meetUrl.replace(/^https:\/\//, "")}
            </a>
          ) : (
            <span className="text-muted-foreground min-w-0 flex-1 text-sm">
              {t("meetNone")}
            </span>
          )}
          {/* Copy / join as icons by the link; managing it (replace,
              paste your own) tucked in "…" so the row stays calm. */}
          <div className="flex shrink-0 items-center gap-1">
            {meetUrl ? (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("copy")}
                  title={t("copy")}
                  onClick={copy}
                >
                  <RiFileCopyLine />
                </Button>
                <Button
                  size="icon-sm"
                  aria-label={t("join")}
                  title={t("join")}
                  nativeButton={false}
                  render={<a href={meetUrl} target="_blank" rel="noreferrer" />}
                >
                  <RiExternalLinkLine />
                </Button>
              </>
            ) : (
              canEdit &&
              googleConfigured && (
                <Button size="sm" disabled={busy} onClick={create}>
                  {busy && <Spinner data-icon="inline-start" />}
                  {t("createMeet")}
                </Button>
              )
            )}
            {canEdit && googleConfigured && (meetUrl || !pasting) && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("meetTitle")}
                      className="text-muted-foreground"
                      disabled={busy}
                    />
                  }
                >
                  {busy && meetUrl ? <Spinner /> : <RiMoreFill />}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-44">
                  {meetUrl && (
                    <DropdownMenuItem onClick={() => setConfirmReplace(true)}>
                      <RotateCcw />
                      {t("replaceMeet")}
                    </DropdownMenuItem>
                  )}
                  {!pasting && (
                    <DropdownMenuItem
                      onClick={() => {
                        setDraft(meetUrl ?? "")
                        setPasting(true)
                      }}
                    >
                      <LinkIcon />
                      {t("pasteLink")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {showPaste && (
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              saveManual()
            }}
          >
            {!googleConfigured && (
              <p className="text-muted-foreground text-meta">
                {t("googleOff")}
              </p>
            )}
            <div className="flex gap-2">
              <Input
                type="url"
                inputMode="url"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("pastePlaceholder")}
                aria-label={t("meetTitle")}
                className="min-w-0 flex-1"
              />
              <Button type="submit" variant="outline" disabled={busy}>
                {t("saveLink")}
              </Button>
            </div>
          </form>
        )}
        <ConfirmDialog
          open={confirmReplace}
          onOpenChange={setConfirmReplace}
          title={t("replaceTitle")}
          description={t("replaceBody")}
          confirmText={t("replaceMeet")}
          onConfirm={create}
        />
      </div>
    </ContextTarget>
  )
}

"use client"

import { DateField } from "@/components/date-field"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow, ListRowActions } from "@/components/grouped-list"
import { TimeSelect } from "@/components/time-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SegmentedControl } from "@/components/segmented-control"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import { RiAddLine, RiCalendarLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { format, isPast, isToday, isTomorrow, type Locale } from "date-fns"
import { useMemo, useState, type ReactNode } from "react"
import { toast } from "sonner"
import { periodLabel } from "../kpi/period"
import { GridGroup, ListColumns, StatBand } from "../list"

export type Slot = {
  id: string
  cycle_name: string
  start_at: string
  end_at: string
  mode: "online" | "offline"
  location: string | null
  status: "open" | "booking" | "booked" | "cancelled"
  meeting_url: string | null
  organizer?: { id: string; full_name: string | null } | null
  booked_by_profile?: { id: string; full_name: string | null } | null
}

export type PerformanceT = ReturnType<typeof useT<"performance">>

type SlotForm = {
  date: string
  start: string
  end: string
  mode: "online" | "offline"
  location: string
}

const toIso = (date: string, time: string) => {
  const [y, m, d] = date.split("-").map(Number)
  const [h, min] = time.split(":").map(Number)
  return new Date(y, m - 1, d, h, min).toISOString()
}

export const timeRange = (slot: Slot) =>
  `${format(new Date(slot.start_at), "HH:mm")}–${format(new Date(slot.end_at), "HH:mm")}`

export function dayLabel(key: string, t: PerformanceT, locale: Locale) {
  const d = new Date(`${key}T00:00:00`)
  const long = format(d, "EEEE, d MMMM", { locale })
  if (isToday(d)) return t("dayToday", { date: long })
  if (isTomorrow(d)) return t("dayTomorrow", { date: long })
  return long
}

export function byDay(slots: Slot[]) {
  const map = new Map<string, Slot[]>()
  for (const s of slots) {
    const key = format(new Date(s.start_at), "yyyy-MM-dd")
    map.set(key, [...(map.get(key) ?? []), s])
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

export async function post(
  url: string,
  body: unknown,
  method = "POST",
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null)
  if (res?.ok) return { ok: true }
  const data = (await res?.json().catch(() => null)) as {
    error?: string
  } | null
  return { ok: false, error: data?.error }
}

const SLOT_ERRORS = {
  slot_overlap: "slotOverlap",
  slot_unavailable: "bookFailed",
  already_booked: "alreadyBooked",
  already_met: "alreadyMet",
  slot_past: "slotGone",
} as const

/** A slot API error code as a message, else `fallback`. */
export function slotError(
  t: PerformanceT,
  code: string | undefined,
  fallback: Parameters<PerformanceT>[0],
) {
  return code && code in SLOT_ERRORS
    ? t(SLOT_ERRORS[code as keyof typeof SLOT_ERRORS])
    : t(fallback)
}

export const modeLabel = (slot: Slot, t: PerformanceT) =>
  slot.mode === "online"
    ? t("modeOnline")
    : slot.location
      ? t("modeOfflineAt", { location: slot.location })
      : t("modeOffline")

function ModeBadge({ slot }: { slot: Slot }) {
  const t = useT("performance")
  return (
    <div className="hidden min-w-0 md:block">
      <Badge variant="secondary" className="max-w-full">
        <span className="truncate">{modeLabel(slot, t)}</span>
      </Badge>
    </div>
  )
}

/** Shared column templates so headers, day summaries and rows line up. */
const ADMIN_GRID =
  "grid grid-cols-[minmax(0,1fr)_6rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_12rem_6rem] lg:grid-cols-[minmax(0,1fr)_12rem_6rem_12rem]"
const EMPLOYEE_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_12rem_10rem]"

/** Two-line first cell: the time, then who / what. */
function SlotCell({
  primary,
  secondary,
  muted,
}: {
  primary: ReactNode
  secondary?: ReactNode
  muted?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <span
        className={cn(
          "truncate tabular-nums",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {primary}
      </span>
      {secondary && (
        <span className="text-tertiary-foreground truncate text-[13px]">
          {secondary}
        </span>
      )}
    </div>
  )
}

const shortDate = (slot: Slot, locale: Locale, pattern = "d MMM") =>
  format(new Date(slot.start_at), pattern, { locale })

/** Jadwal 1:1: admins publish slots, employees pick one. */
export function OneOnOne({ period }: { period: string }) {
  const t = useT("performance")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const { profile } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const queryClient = useQueryClient()
  const queryKey = ["one-on-one-slots", period]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(
        `/api/one-on-one/slots?cycle=${encodeURIComponent(period)}`,
      )
      if (!res.ok) throw new Error("fetch_failed")
      return ((await res.json()) as { slots: Slot[] }).slots
    },
  })
  const slots = useMemo(() => data ?? [], [data])
  const refresh = () => queryClient.invalidateQueries({ queryKey })

  const [form, setForm] = useState<SlotForm | null>(null)
  const [editing, setEditing] = useState<Slot | null>(null)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{
    title: string
    description: string
    confirmText: string
    run: () => Promise<void>
  } | null>(null)

  const openCreate = () => {
    setEditing(null)
    setForm({
      date: format(new Date(Date.now() + 86_400_000), "yyyy-MM-dd"),
      start: "10:00",
      end: "10:30",
      mode: "online",
      location: "",
    })
  }
  const openReschedule = (slot: Slot) => {
    setEditing(slot)
    setForm({
      date: format(new Date(slot.start_at), "yyyy-MM-dd"),
      start: format(new Date(slot.start_at), "HH:mm"),
      end: format(new Date(slot.end_at), "HH:mm"),
      mode: slot.mode,
      location: slot.location ?? "",
    })
  }

  const saveForm = async () => {
    if (!form) return
    if (form.end <= form.start) {
      toast.error(t("endAfterStart"))
      return
    }
    const startAt = toIso(form.date, form.start)
    if (new Date(startAt) < new Date()) {
      toast.error(t("pickFutureTime"))
      return
    }
    setSaving(true)
    const { ok, error } = editing
      ? await post(
          `/api/one-on-one/slots/${editing.id}`,
          {
            date: form.date,
            startTime: form.start,
            endTime: form.end,
            startAt,
            endAt: toIso(form.date, form.end),
          },
          "PATCH",
        )
      : await post("/api/one-on-one/slots", {
          mode: form.mode,
          location: form.mode === "offline" ? form.location : undefined,
          slots: [
            {
              date: form.date,
              startTime: form.start,
              endTime: form.end,
              startAt,
              endAt: toIso(form.date, form.end),
            },
          ],
        })
    setSaving(false)
    if (!ok) {
      toast.error(
        slotError(t, error, editing ? "rescheduleFailed" : "addSlotFailed"),
      )
      return
    }
    toast.success(editing ? t("rescheduled") : t("slotAdded"))
    setForm(null)
    refresh()
  }

  const act = async (
    slot: Slot,
    action: "book" | "release" | "cancel" | "remove",
  ) => {
    setBusyId(slot.id)
    const { ok, error } =
      action === "book"
        ? await post("/api/one-on-one/book", { slotId: slot.id })
        : await post("/api/one-on-one/cancel", {
            slotId: slot.id,
            action: action === "release" ? "release" : "cancel",
            remove: action === "remove",
          })
    setBusyId(null)
    const messages = {
      book: ["bookSuccess", "bookError"],
      release: ["releaseSuccess", "releaseFailed"],
      cancel: ["cancelSuccess", "cancelFailed"],
      remove: ["removeSuccess", "removeFailed"],
    } as const
    if (ok) toast.success(t(messages[action][0]))
    else toast.error(slotError(t, error, messages[action][1]))
    refresh()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  }

  const upcoming = slots.filter((s) => !isPast(new Date(s.end_at)))
  const past = slots.filter((s) => isPast(new Date(s.end_at)))
  const mine = slots.filter((s) => s.booked_by_profile?.id === profile?.id)
  const myUpcoming = mine.filter((s) => !isPast(new Date(s.end_at)))
  const open = upcoming.filter((s) => s.status === "open")
  const nextLive = upcoming.find((s) => s.status !== "cancelled")

  const slotForm = (
    <Dialog open={Boolean(form)} onOpenChange={(o) => !o && setForm(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? t("reschedule") : t("addSlot11")}
          </DialogTitle>
          {/* Only when someone gets told about it. */}
          {(!editing || editing.booked_by_profile) && (
            <DialogDescription>
              {editing?.booked_by_profile
                ? t("rescheduleNotify", {
                    name: editing.booked_by_profile.full_name ?? "",
                  })
                : t("slotFormDescription")}
            </DialogDescription>
          )}
        </DialogHeader>
        {form && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="slot-date">{t("date")}</Label>
              <DateField
                id="slot-date"
                value={form.date}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(value) => setForm({ ...form, date: value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>{t("start")}</Label>
                <TimeSelect
                  value={form.start}
                  onValueChange={(start) => {
                    const [h, m] = start.split(":").map(Number)
                    const end = new Date(2000, 0, 1, h, m + 30)
                    setForm({ ...form, start, end: format(end, "HH:mm") })
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t("end")}</Label>
                <TimeSelect
                  value={form.end}
                  onValueChange={(end) => setForm({ ...form, end })}
                />
              </div>
            </div>
            {!editing && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label>{t("place")}</Label>
                  <SegmentedControl<string>
                    value={form.mode}
                    onChange={(mode) =>
                      setForm({ ...form, mode: mode as SlotForm["mode"] })
                    }
                    items={[
                      { value: "online", label: t("modeOnlineMeet") },
                      { value: "offline", label: t("modeOffline") },
                    ]}
                  />
                </div>
                {form.mode === "offline" && (
                  <Input
                    maxLength={120}
                    placeholder={t("locationPlaceholder")}
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                  />
                )}
              </>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setForm(null)}>
            {tc("cancel")}
          </Button>
          <Button onClick={saveForm} disabled={saving}>
            {saving ? tc("saving") : editing ? tc("save") : t("addSlot")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const confirmDialog = (
    <ConfirmDialog
      open={Boolean(confirm)}
      onOpenChange={(o) => !o && setConfirm(null)}
      title={confirm?.title ?? ""}
      description={confirm?.description ?? ""}
      confirmText={confirm?.confirmText ?? tc("yes")}
      cancelText={tc("cancel")}
      variant="destructive"
      onConfirm={async () => {
        await confirm?.run()
        setConfirm(null)
      }}
    />
  )

  // ── Admin ────────────────────────────────────────────────────────────
  if (isAdmin) {
    const statusBadge = (s: Slot) =>
      s.status === "cancelled" ? (
        <Badge variant="destructive">{t("slotCancelled")}</Badge>
      ) : s.booked_by_profile ? (
        <Badge variant="secondary">{t("slotBooked")}</Badge>
      ) : (
        <Badge variant="success">{t("slotAvailable")}</Badge>
      )
    return (
      <div className="flex flex-col">
        <StatBand
          stats={[
            {
              label: t("nextSlot"),
              value: nextLive
                ? `${shortDate(nextLive, dateLocale, "EEE, d MMM")} · ${format(new Date(nextLive.start_at), "HH:mm")}`
                : null,
            },
            {
              label: t("slotBooked"),
              value: upcoming.filter((s) => s.status === "booked").length,
            },
            { label: t("slotAvailable"), value: open.length },
            { label: t("slotPast"), value: past.length },
          ]}
          aside={
            <Button onClick={openCreate}>
              <RiAddLine data-icon="inline-start" />
              {t("addSlot")}
            </Button>
          }
        />
        {upcoming.length === 0 && (
          <EmptyState
            title={
              slots.length === 0
                ? t("noSlotsIn", { period: periodLabel(period, t) })
                : t("noUpcomingSlots")
            }
            description={t("noSlotsDescription")}
            icon={<RiCalendarLine className="size-5" />}
            placement="inner"
          />
        )}
        {slots.length > 0 && (
          <GroupedList>
            {upcoming.length > 0 && (
              <ListColumns grid={ADMIN_GRID}>
                <span>{t("schedule")}</span>
                <span className="hidden md:block">{t("place")}</span>
                <span>{t("status")}</span>
                <span className="hidden lg:block" />
              </ListColumns>
            )}
            {byDay(upcoming).map(([day, items]) => (
              <GridGroup
                key={day}
                grid={ADMIN_GRID}
                label={dayLabel(day, t, dateLocale)}
                summary={
                  <>
                    <span className="text-tertiary-foreground hidden text-[13px] tabular-nums md:block">
                      {t("slotCount", { n: items.length })}
                    </span>
                    <span className="text-tertiary-foreground text-[13px] tabular-nums">
                      {t("bookedCount", {
                        n: items.filter((s) => s.status === "booked").length,
                      })}
                    </span>
                    <span className="hidden lg:block" />
                  </>
                }
              >
                {items.map((s) => (
                  <ListRow key={s.id} className={cn(ADMIN_GRID, "min-h-14")}>
                    <SlotCell
                      primary={timeRange(s)}
                      secondary={s.booked_by_profile?.full_name}
                      muted={s.status === "cancelled"}
                    />
                    <ModeBadge slot={s} />
                    <div>{statusBadge(s)}</div>
                    {/* Actions wrap under the row on narrow screens. */}
                    <div className="col-span-full flex justify-end lg:col-span-1">
                      <ListRowActions className="max-lg:opacity-100">
                        {s.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openReschedule(s)}
                          >
                            {t("reschedule")}
                          </Button>
                        )}
                        {s.status === "booked" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={busyId === s.id}
                            onClick={() =>
                              setConfirm({
                                title: t("cancelOneOnOneTitle"),
                                description: t("willBeNotified", {
                                  name:
                                    s.booked_by_profile?.full_name ??
                                    t("employee"),
                                }),
                                confirmText: t("cancelSlotAction"),
                                run: () => act(s, "cancel"),
                              })
                            }
                          >
                            {t("cancelSlotAction")}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={busyId === s.id}
                            onClick={() =>
                              setConfirm({
                                title: t("deleteSlotTitle"),
                                description: t("slotDeletePermanent"),
                                confirmText: tc("delete"),
                                run: () => act(s, "remove"),
                              })
                            }
                          >
                            {tc("delete")}
                          </Button>
                        )}
                      </ListRowActions>
                    </div>
                  </ListRow>
                ))}
              </GridGroup>
            ))}
            {past.length > 0 && (
              <GridGroup
                grid={ADMIN_GRID}
                label={t("slotPast")}
                extra={
                  <span className="text-tertiary-foreground tabular-nums">
                    {past.length}
                  </span>
                }
                defaultOpen={false}
              >
                {[...past].reverse().map((s) => (
                  <ListRow key={s.id} className={cn(ADMIN_GRID, "min-h-14")}>
                    <SlotCell
                      primary={`${shortDate(s, dateLocale)} · ${timeRange(s)}`}
                      secondary={s.booked_by_profile?.full_name}
                      muted
                    />
                    <ModeBadge slot={s} />
                    <div>{statusBadge(s)}</div>
                    <span className="hidden lg:block" />
                  </ListRow>
                ))}
              </GridGroup>
            )}
          </GroupedList>
        )}
        {slotForm}
        {confirmDialog}
      </div>
    )
  }

  // ── Employee ─────────────────────────────────────────────────────────
  const next = myUpcoming.find((s) => s.status === "booked")
  return (
    <div className="flex flex-col">
      <StatBand
        stats={[
          {
            label: t("yourSchedule"),
            value: next
              ? `${shortDate(next, dateLocale, "EEE, d MMM")} · ${format(new Date(next.start_at), "HH:mm")}`
              : t("resultNone"),
          },
          { label: t("availableSlots"), value: open.length },
        ]}
      />

      <section className="flex flex-col">
        <h2 className="text-foreground pt-4 pb-3 text-sm">
          {t("yourSchedule")}
        </h2>
        {myUpcoming.length === 0 ? (
          <p className="text-muted-foreground border-t py-6 text-sm">
            {open.length ? t("noOneOnOneYetPick") : t("noOneOnOneYet")}
          </p>
        ) : (
          <GroupedList>
            <ListColumns grid={EMPLOYEE_GRID}>
              <span>{t("schedule")}</span>
              <span className="hidden md:block">{t("place")}</span>
              <span />
            </ListColumns>
            {myUpcoming.map((s) => (
              <ListRow key={s.id} className={cn(EMPLOYEE_GRID, "min-h-14")}>
                <SlotCell
                  primary={`${shortDate(s, dateLocale, "EEE, d MMM")} · ${timeRange(s)}`}
                  secondary={
                    s.status === "cancelled"
                      ? t("cancelledByAdmin")
                      : t("withOrganizer", {
                          name: s.organizer?.full_name ?? t("admin"),
                        })
                  }
                  muted={s.status === "cancelled"}
                />
                <ModeBadge slot={s} />
                <div className="flex justify-end gap-1">
                  {s.status === "booked" && (
                    <>
                      {s.meeting_url && (
                        <Button
                          size="sm"
                          variant="secondary"
                          nativeButton={false}
                          render={
                            <a
                              href={s.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          }
                        >
                          {t("join")}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === s.id}
                        onClick={() =>
                          setConfirm({
                            title: t("releaseTitle"),
                            description: t("releaseDescription"),
                            confirmText: t("release"),
                            run: () => act(s, "release"),
                          })
                        }
                      >
                        {t("release")}
                      </Button>
                    </>
                  )}
                </div>
              </ListRow>
            ))}
          </GroupedList>
        )}
      </section>

      <section className="flex flex-col">
        <h2 className="text-foreground pt-6 pb-3 text-sm">
          {t("availableSlots")}
        </h2>
        {open.length === 0 ? (
          <EmptyState
            title={t("noAvailableSlots")}
            icon={<RiCalendarLine className="size-5" />}
            placement="inner"
          />
        ) : (
          <GroupedList>
            <ListColumns grid={EMPLOYEE_GRID}>
              <span>{t("schedule")}</span>
              <span className="hidden md:block">{t("place")}</span>
              <span />
            </ListColumns>
            {byDay(open).map(([day, items]) => (
              <GridGroup
                key={day}
                grid={EMPLOYEE_GRID}
                label={dayLabel(day, t, dateLocale)}
                summary={
                  <>
                    <span className="text-tertiary-foreground hidden text-[13px] tabular-nums md:block">
                      {t("slotCount", { n: items.length })}
                    </span>
                    <span />
                  </>
                }
              >
                {items.map((s) => (
                  <ListRow key={s.id} className={cn(EMPLOYEE_GRID, "min-h-14")}>
                    <SlotCell
                      primary={timeRange(s)}
                      secondary={
                        <>
                          {t("withOrganizer", {
                            name: s.organizer?.full_name ?? t("admin"),
                          })}
                          <span className="md:hidden">
                            {" "}
                            · {modeLabel(s, t)}
                          </span>
                        </>
                      }
                    />
                    <ModeBadge slot={s} />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={
                          busyId === s.id ||
                          myUpcoming.some((m) => m.status === "booked")
                        }
                        title={
                          myUpcoming.some((m) => m.status === "booked")
                            ? t("releaseFirst")
                            : undefined
                        }
                        onClick={() => act(s, "book")}
                      >
                        {t("pick")}
                      </Button>
                    </div>
                  </ListRow>
                ))}
              </GridGroup>
            ))}
          </GroupedList>
        )}
      </section>
      {confirmDialog}
    </div>
  )
}

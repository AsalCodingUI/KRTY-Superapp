"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import {
  GroupedList,
  ListChip,
  ListGroup,
  ListRow,
  ListRowActions,
} from "@/components/grouped-list"
import { TimeSelect } from "@/components/time-select"
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
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import { RiAddLine, RiCalendarLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format, isPast, isToday, isTomorrow } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { periodLabel } from "../kpi/period"

type Slot = {
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

const timeRange = (slot: Slot) =>
  `${format(new Date(slot.start_at), "HH:mm")}–${format(new Date(slot.end_at), "HH:mm")}`

function dayLabel(key: string) {
  const d = new Date(`${key}T00:00:00`)
  const long = format(d, "EEEE, d MMMM", { locale: idLocale })
  if (isToday(d)) return `Hari ini · ${long}`
  if (isTomorrow(d)) return `Besok · ${long}`
  return long
}

function byDay(slots: Slot[]) {
  const map = new Map<string, Slot[]>()
  for (const s of slots) {
    const key = format(new Date(s.start_at), "yyyy-MM-dd")
    map.set(key, [...(map.get(key) ?? []), s])
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

async function post(url: string, body: unknown, method = "POST") {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null)
  return res?.ok ?? false
}

function ModeChip({ slot }: { slot: Slot }) {
  return (
    <ListChip>
      {slot.mode === "online"
        ? "Online"
        : `Offline${slot.location ? ` · ${slot.location}` : ""}`}
    </ListChip>
  )
}

/** Jadwal 1:1: admins publish slots, employees pick one. */
export function OneOnOne({ period }: { period: string }) {
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
      toast.error("Jam selesai harus setelah jam mulai.")
      return
    }
    const startAt = toIso(form.date, form.start)
    if (new Date(startAt) < new Date()) {
      toast.error("Pilih waktu yang belum lewat.")
      return
    }
    setSaving(true)
    const ok = editing
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
      toast.error(editing ? "Gagal mengubah jadwal." : "Gagal menambah slot.")
      return
    }
    toast.success(editing ? "Jadwal diubah" : "Slot ditambahkan")
    setForm(null)
    refresh()
  }

  const act = async (
    slot: Slot,
    action: "book" | "release" | "cancel" | "remove",
  ) => {
    setBusyId(slot.id)
    const ok =
      action === "book"
        ? await post("/api/one-on-one/book", { slotId: slot.id })
        : await post("/api/one-on-one/cancel", {
            slotId: slot.id,
            action: action === "release" ? "release" : "cancel",
            remove: action === "remove",
          })
    setBusyId(null)
    const messages = {
      book: ["Jadwal 1:1 terkonfirmasi", "Slot sudah diambil orang lain."],
      release: ["Jadwal dilepas", "Gagal melepas jadwal."],
      cancel: ["Slot dibatalkan", "Gagal membatalkan slot."],
      remove: ["Slot dihapus", "Gagal menghapus slot."],
    } as const
    if (ok) toast.success(messages[action][0])
    else toast.error(messages[action][1])
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

  const slotForm = (
    <Dialog open={Boolean(form)} onOpenChange={(o) => !o && setForm(null)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Ubah jadwal" : "Tambah slot 1:1"}
          </DialogTitle>
          <DialogDescription>
            {editing?.booked_by_profile
              ? `${editing.booked_by_profile.full_name} akan diberi tahu jadwal barunya.`
              : "Karyawan bisa memilih slot ini di Jadwal 1:1."}
          </DialogDescription>
        </DialogHeader>
        {form && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="slot-date">Tanggal</Label>
              <Input
                id="slot-date"
                type="date"
                value={form.date}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Mulai</Label>
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
                <Label>Selesai</Label>
                <TimeSelect
                  value={form.end}
                  onValueChange={(end) => setForm({ ...form, end })}
                />
              </div>
            </div>
            {!editing && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label>Tempat</Label>
                  <SegmentedControl<string>
                    value={form.mode}
                    onChange={(mode) =>
                      setForm({ ...form, mode: mode as SlotForm["mode"] })
                    }
                    items={[
                      { value: "online", label: "Online (Meet)" },
                      { value: "offline", label: "Offline" },
                    ]}
                  />
                </div>
                {form.mode === "offline" && (
                  <Input
                    placeholder="Lokasi, mis. ruang rapat"
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
          <Button variant="ghost" onClick={() => setForm(null)}>
            Batal
          </Button>
          <Button onClick={saveForm} disabled={saving}>
            {saving ? "Menyimpan…" : editing ? "Simpan" : "Tambah slot"}
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
      confirmText={confirm?.confirmText ?? "Ya"}
      cancelText="Batal"
      variant="destructive"
      onConfirm={async () => {
        await confirm?.run()
        setConfirm(null)
      }}
    />
  )

  // ── Admin ────────────────────────────────────────────────────────────
  if (isAdmin) {
    const statusOf = (s: Slot) =>
      s.status === "cancelled"
        ? "Dibatalkan"
        : s.booked_by_profile
          ? s.booked_by_profile.full_name
          : "Tersedia"
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            {upcoming.filter((s) => s.status === "booked").length} terisi ·{" "}
            {open.length} tersedia
          </p>
          <Button onClick={openCreate}>
            <RiAddLine data-icon="inline-start" />
            Tambah slot
          </Button>
        </div>
        {slots.length === 0 ? (
          <EmptyState
            title={`Belum ada slot di ${periodLabel(period)}`}
            description="Tambahkan slot, karyawan akan diberi tahu."
            icon={<RiCalendarLine className="size-5" />}
            placement="inner"
          />
        ) : (
          <GroupedList>
            {byDay(upcoming).map(([day, items]) => (
              <ListGroup key={day} label={dayLabel(day)} count={items.length}>
                {items.map((s) => (
                  <ListRow key={s.id}>
                    <span className="w-24 shrink-0 font-medium tabular-nums">
                      {timeRange(s)}
                    </span>
                    <span
                      className={
                        s.status === "cancelled"
                          ? "text-muted-foreground min-w-0 flex-1 truncate line-through"
                          : s.booked_by_profile
                            ? "min-w-0 flex-1 truncate"
                            : "text-success min-w-0 flex-1 truncate"
                      }
                    >
                      {statusOf(s)}
                    </span>
                    <ListRowActions>
                      {s.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openReschedule(s)}
                        >
                          Ubah jadwal
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
                              title: "Batalkan 1:1 ini?",
                              description: `${s.booked_by_profile?.full_name ?? "Karyawan"} akan diberi tahu.`,
                              confirmText: "Batalkan",
                              run: () => act(s, "cancel"),
                            })
                          }
                        >
                          Batalkan
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={busyId === s.id}
                          onClick={() =>
                            setConfirm({
                              title: "Hapus slot ini?",
                              description: "Slot dihapus permanen.",
                              confirmText: "Hapus",
                              run: () => act(s, "remove"),
                            })
                          }
                        >
                          Hapus
                        </Button>
                      )}
                    </ListRowActions>
                    <ModeChip slot={s} />
                  </ListRow>
                ))}
              </ListGroup>
            ))}
            {past.length > 0 && (
              <ListGroup
                label="Sudah lewat"
                count={past.length}
                defaultOpen={false}
              >
                {[...past].reverse().map((s) => (
                  <ListRow key={s.id} className="text-muted-foreground">
                    <span className="w-40 shrink-0 tabular-nums">
                      {format(new Date(s.start_at), "d MMM", {
                        locale: idLocale,
                      })}{" "}
                      · {timeRange(s)}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {statusOf(s)}
                    </span>
                    <ModeChip slot={s} />
                  </ListRow>
                ))}
              </ListGroup>
            )}
          </GroupedList>
        )}
        {slotForm}
        {confirmDialog}
      </div>
    )
  }

  // ── Employee ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Jadwal kamu</h2>
        {myUpcoming.length === 0 ? (
          <p className="text-muted-foreground border-t py-6 text-sm">
            Kamu belum memilih jadwal 1:1
            {open.length ? ". Pilih salah satu slot di bawah." : "."}
          </p>
        ) : (
          <div className="-mx-4 flex flex-col">
            {myUpcoming.map((s) => (
              <div
                key={s.id}
                className="border-border/50 group/row flex min-h-12 items-center gap-3 border-b px-4 py-2 text-sm first:border-t"
              >
                <span className="w-44 shrink-0 font-medium">
                  {format(new Date(s.start_at), "EEE, d MMM", {
                    locale: idLocale,
                  })}{" "}
                  · <span className="tabular-nums">{timeRange(s)}</span>
                </span>
                <span className="text-muted-foreground min-w-0 flex-1 truncate">
                  {s.status === "cancelled"
                    ? "Dibatalkan admin, pilih slot lain"
                    : `dengan ${s.organizer?.full_name ?? "admin"}`}
                </span>
                <ModeChip slot={s} />
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
                        Gabung
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId === s.id}
                      onClick={() =>
                        setConfirm({
                          title: "Lepas jadwal ini?",
                          description:
                            "Slot akan tersedia lagi untuk orang lain.",
                          confirmText: "Lepas",
                          run: () => act(s, "release"),
                        })
                      }
                    >
                      Lepas
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Slot tersedia</h2>
        {open.length === 0 ? (
          <EmptyState
            title="Belum ada slot tersedia"
            description="Kamu akan diberi notifikasi saat ada slot baru."
            icon={<RiCalendarLine className="size-5" />}
            placement="inner"
          />
        ) : (
          <GroupedList>
            {byDay(open).map(([day, items]) => (
              <ListGroup key={day} label={dayLabel(day)} count={items.length}>
                {items.map((s) => (
                  <ListRow key={s.id}>
                    <span className="w-24 shrink-0 font-medium tabular-nums">
                      {timeRange(s)}
                    </span>
                    <span className="text-muted-foreground min-w-0 flex-1 truncate">
                      dengan {s.organizer?.full_name ?? "admin"}
                    </span>
                    <ModeChip slot={s} />
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={
                        busyId === s.id ||
                        myUpcoming.some((m) => m.status === "booked")
                      }
                      title={
                        myUpcoming.some((m) => m.status === "booked")
                          ? "Lepas jadwalmu dulu untuk memilih slot lain"
                          : undefined
                      }
                      onClick={() => act(s, "book")}
                    >
                      Pilih
                    </Button>
                  </ListRow>
                ))}
              </ListGroup>
            ))}
          </GroupedList>
        )}
      </section>
      {confirmDialog}
    </div>
  )
}

"use client"

import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import { DatePicker } from "@/components/date-picker"
import { EmptyState } from "@/components/empty-state"
import { TableSection } from "@/components/table-section"
import { TimeSelect } from "@/components/time-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RiCalendarLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useMemo, useState } from "react"
import { toast } from "sonner"

type OneOnOneSlot = {
  id: string
  cycle_name: string
  start_at: string
  end_at: string
  mode: "online" | "offline"
  location: string | null
  status: "open" | "booking" | "booked" | "cancelled"
  meeting_url: string | null
  organizer?: { id: string; full_name: string | null; email: string | null }
  booked_by_profile?: {
    id: string
    full_name: string | null
    email: string | null
  }
}

function toLocalIso(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString()
}

const formatSlotTime = (start: string, end: string) => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${format(startDate, "dd MMM yyyy")} · ${format(
    startDate,
    "HH:mm",
  )} - ${format(endDate, "HH:mm")}`
}

export function OneOnOneMeetingTab({
  selectedQuarter = "2025-Q1",
}: {
  selectedQuarter?: string
}) {
  const { profile } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("09:30")
  const [mode, setMode] = useState<"online" | "offline">("online")
  const [location, setLocation] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState("")
  const [editStartTime, setEditStartTime] = useState("")
  const [editEndTime, setEditEndTime] = useState("")
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)

  const parseDateValue = (value: string) => {
    if (!value) return undefined
    const parsed = new Date(`${value}T00:00:00`)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }

  const queryClient = useQueryClient()

  const { data: slotResponse, isLoading } = useQuery({
    queryKey: ["one-on-one-slots", selectedQuarter],
    queryFn: async () => {
      try {
        const response = await fetch(
          `/api/one-on-one/slots?cycle=${encodeURIComponent(selectedQuarter)}`,
        )
        if (!response.ok) {
          throw new Error("fetch_failed")
        }
        return (await response.json()) as { slots: OneOnOneSlot[] }
      } catch (error) {
        toast.error("Gagal memuat slot 1:1")
        throw error
      }
    },
  })

  const slots = useMemo(() => slotResponse?.slots || [], [slotResponse])

  const availableSlots = useMemo(
    () => slots.filter((slot) => slot.status === "open"),
    [slots],
  )

  const mySlots = useMemo(
    () => slots.filter((slot) => slot.booked_by_profile?.id === profile?.id),
    [slots, profile?.id],
  )

  const handleCreateSlot = async () => {
    if (!date || !startTime || !endTime) {
      toast.error("Tanggal dan jam harus diisi")
      return
    }

    const startAt = toLocalIso(date, startTime)
    const endAt = toLocalIso(date, endTime)

    setSubmitting(true)
    try {
      const response = await fetch("/api/one-on-one/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycle: selectedQuarter,
          mode,
          location: mode === "offline" ? location : undefined,
          slots: [{ date, startTime, endTime, startAt, endAt }],
        }),
      })

      if (!response.ok) {
        throw new Error("create_failed")
      }

      toast.success("Slot berhasil ditambahkan")
      setDate("")
      await queryClient.invalidateQueries({
        queryKey: ["one-on-one-slots", selectedQuarter],
      })
    } catch {
      toast.error("Gagal menambahkan slot")
    } finally {
      setSubmitting(false)
    }
  }

  const handleBookSlot = async (slotId: string) => {
    setBookingId(slotId)
    try {
      const response = await fetch("/api/one-on-one/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId }),
      })

      if (!response.ok) {
        throw new Error("book_failed")
      }

      toast.success("Slot berhasil dibooking")
      await queryClient.invalidateQueries({
        queryKey: ["one-on-one-slots", selectedQuarter],
      })
    } catch {
      toast.error("Slot sudah diambil orang lain")
    } finally {
      setBookingId(null)
    }
  }

  const handleCancel = async (slotId: string, action: "cancel" | "release") => {
    setCancelId(slotId)
    try {
      const response = await fetch("/api/one-on-one/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, action }),
      })

      if (!response.ok) {
        throw new Error("cancel_failed")
      }

      toast.success(
        action === "cancel" ? "Slot dibatalkan" : "Booking dibatalkan",
      )
      await queryClient.invalidateQueries({
        queryKey: ["one-on-one-slots", selectedQuarter],
      })
    } catch {
      toast.error("Gagal membatalkan")
    } finally {
      setCancelId(null)
    }
  }

  const handleDelete = async (slotId: string) => {
    setCancelId(slotId)
    try {
      const response = await fetch("/api/one-on-one/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, action: "cancel", remove: true }),
      })

      if (!response.ok) {
        throw new Error("delete_failed")
      }

      toast.success("Slot dihapus")
      await queryClient.invalidateQueries({
        queryKey: ["one-on-one-slots", selectedQuarter],
      })
    } catch {
      toast.error("Gagal menghapus slot")
    } finally {
      setCancelId(null)
    }
  }

  const handleReschedule = async () => {
    if (!editingSlotId || !editDate || !editStartTime || !editEndTime) {
      toast.error("Tanggal dan jam harus diisi")
      return
    }

    const startAt = toLocalIso(editDate, editStartTime)
    const endAt = toLocalIso(editDate, editEndTime)

    setRescheduleId(editingSlotId)
    try {
      const response = await fetch(`/api/one-on-one/slots/${editingSlotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: editDate,
          startTime: editStartTime,
          endTime: editEndTime,
          startAt,
          endAt,
        }),
      })

      if (!response.ok) {
        throw new Error("reschedule_failed")
      }

      toast.success("Jadwal berhasil diubah")
      setEditingSlotId(null)
      await queryClient.invalidateQueries({
        queryKey: ["one-on-one-slots", selectedQuarter],
      })
    } catch {
      toast.error("Gagal mengubah jadwal")
    } finally {
      setRescheduleId(null)
    }
  }

  const startEdit = (slot: OneOnOneSlot) => {
    const startDate = new Date(slot.start_at)
    const endDate = new Date(slot.end_at)
    setEditingSlotId(slot.id)
    setEditDate(format(startDate, "yyyy-MM-dd"))
    setEditStartTime(format(startDate, "HH:mm"))
    setEditEndTime(format(endDate, "HH:mm"))
  }

  return (
    <div className="flex flex-col gap-3">
      {isAdmin && (
        <TableSection
          title={`Buat Slot 1:1 (${selectedQuarter})`}
          contentClassName="pt-1"
        >
          <div
            className={
              mode === "offline"
                ? "grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_auto] xl:items-end"
                : "grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)_minmax(0,0.95fr)_minmax(0,1.2fr)_auto] xl:items-end"
            }
          >
            <div className="flex flex-col gap-2">
              <Label>Tanggal</Label>
              <DatePicker
                value={parseDateValue(date)}
                onChange={(value) =>
                  setDate(value ? format(value, "yyyy-MM-dd") : "")
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Start</Label>
              <TimeSelect
                value={startTime}
                onValueChange={setStartTime}
                step={30}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>End</Label>
              <TimeSelect
                value={endTime}
                onValueChange={setEndTime}
                step={30}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Mode</Label>
              <Select
                value={mode}
                onValueChange={(value) =>
                  setMode(value as "online" | "offline")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === "offline" && (
              <div className="flex flex-col gap-2">
                <Label>Lokasi</Label>
                <Input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Ruangan / lokasi meeting"
                />
              </div>
            )}

            <div className="flex items-end xl:justify-end">
              <Button
                variant="outline"
                onClick={handleCreateSlot}
                disabled={submitting}
              >
                Tambah Slot
              </Button>
            </div>
          </div>
        </TableSection>
      )}

      <TableSection title={isAdmin ? "Daftar Slot 1:1" : "Slot Tersedia"}>
        <Table>
          <TableHeader>
            <TableRow className="h-[40px] hover:bg-transparent">
              <TableHead>Waktu</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Peserta</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(isAdmin ? slots : availableSlots).map((slot) => (
              <TableRow key={slot.id}>
                <TableCell>
                  {formatSlotTime(slot.start_at, slot.end_at)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {slot.mode === "online" ? "Online" : "Offline"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      slot.status === "booked"
                        ? "success"
                        : slot.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {slot.status === "booked"
                      ? "Booked"
                      : slot.status === "cancelled"
                        ? "Cancelled"
                        : "Open"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {slot.booked_by_profile?.full_name || "-"}
                </TableCell>
                <TableCell>
                  {isAdmin ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => startEdit(slot)}
                        disabled={slot.status === "cancelled"}
                      >
                        Reschedule
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDelete(slot.id)}
                        disabled={cancelId === slot.id}
                      >
                        Delete
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleCancel(slot.id, "cancel")}
                        disabled={cancelId === slot.id}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleBookSlot(slot.id)}
                      disabled={bookingId === slot.id}
                    >
                      Pilih Slot
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {(isAdmin ? slots : availableSlots).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner className="size-8" />
                    </div>
                  ) : (
                    <EmptyState
                      title={
                        isAdmin ? "No 1:1 slots yet" : "No available slots"
                      }
                      description={
                        isAdmin
                          ? "Create a slot to start scheduling."
                          : "There are no bookable slots for this period."
                      }
                      icon={<RiCalendarLine className="size-5" />}
                      placement="inner"
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {isAdmin && editingSlotId && (
          <div className="mt-4 border-t pt-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
              <div className="flex flex-col gap-2">
                <Label>Tanggal</Label>
                <DatePicker
                  value={parseDateValue(editDate)}
                  onChange={(value) =>
                    setEditDate(value ? format(value, "yyyy-MM-dd") : "")
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Start</Label>
                <TimeSelect
                  value={editStartTime}
                  onValueChange={setEditStartTime}
                  step={30}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>End</Label>
                <TimeSelect
                  value={editEndTime}
                  onValueChange={setEditEndTime}
                  step={30}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleReschedule}
                  disabled={rescheduleId === editingSlotId}
                >
                  Simpan
                </Button>
                <Button variant="ghost" onClick={() => setEditingSlotId(null)}>
                  Batal
                </Button>
              </div>
            </div>
          </div>
        )}
      </TableSection>

      {!isAdmin && (
        <TableSection title="Jadwal 1:1 Saya">
          <Table>
            <TableHeader>
              <TableRow className="h-[40px] hover:bg-transparent">
                <TableHead>Waktu</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Meeting</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mySlots.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell>
                    {formatSlotTime(slot.start_at, slot.end_at)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {slot.mode === "online" ? "Online" : "Offline"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {slot.meeting_url ? (
                        <Button
                          variant="outline"
                          onClick={() =>
                            window.open(slot.meeting_url || "", "_blank")
                          }
                        >
                          Join
                        </Button>
                      ) : slot.mode === "online" ? (
                        <Button variant="outline" disabled>
                          Join
                        </Button>
                      ) : (
                        <span>{slot.location || "-"}</span>
                      )}
                      <Button
                        variant="destructive"
                        onClick={() => handleCancel(slot.id, "release")}
                        disabled={cancelId === slot.id}
                      >
                        Cancel
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {mySlots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="p-0">
                    <EmptyState
                      title="No 1:1 bookings yet"
                      description="You have not booked a slot yet."
                      icon={<RiCalendarLine className="size-5" />}
                      placement="inner"
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableSection>
      )}
    </div>
  )
}

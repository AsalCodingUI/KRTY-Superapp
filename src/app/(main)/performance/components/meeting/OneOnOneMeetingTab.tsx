"use client"

import {
  Badge,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSection,
  TextInput,
} from "@/shared/ui"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import { format } from "date-fns"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import useSWR from "swr"

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

  const {
    data: slotResponse,
    isLoading,
    mutate,
  } = useSWR(
    ["one-on-one-slots", selectedQuarter],
    async () => {
      const response = await fetch(
        `/api/one-on-one/slots?cycle=${encodeURIComponent(selectedQuarter)}`,
      )
      if (!response.ok) {
        throw new Error("fetch_failed")
      }
      return (await response.json()) as { slots: OneOnOneSlot[] }
    },
    {
      revalidateOnFocus: false,
      onError: () => toast.error("Gagal memuat slot 1:1"),
    },
  )

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

    setSubmitting(true)
    try {
      const response = await fetch("/api/one-on-one/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycle: selectedQuarter,
          mode,
          location: mode === "offline" ? location : undefined,
          slots: [{ date, startTime, endTime }],
        }),
      })

      if (!response.ok) {
        throw new Error("create_failed")
      }

      toast.success("Slot berhasil ditambahkan")
      setDate("")
      await mutate()
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
      await mutate()
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
      await mutate()
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
      await mutate()
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

    setRescheduleId(editingSlotId)
    try {
      const response = await fetch(
        `/api/one-on-one/slots/${editingSlotId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: editDate,
            startTime: editStartTime,
            endTime: editEndTime,
          }),
        },
      )

      if (!response.ok) {
        throw new Error("reschedule_failed")
      }

      toast.success("Jadwal berhasil diubah")
      setEditingSlotId(null)
      await mutate()
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
    <div className="flex flex-col gap-md">
      {isAdmin && (
        <TableSection
          title={`Buat Slot 1:1 (${selectedQuarter})`}
          contentClassName="px-xl pb-xl pt-sm"
        >
          <div className="grid grid-cols-1 gap-md md:grid-cols-4">
            <div className="flex flex-col gap-2">
              <Label>Tanggal</Label>
              <TextInput
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Start</Label>
              <TextInput
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>End</Label>
              <TextInput
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === "offline" ? (
              <>
                <div className="flex flex-col gap-2 md:col-span-3">
                  <Label>Lokasi</Label>
                  <TextInput
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Ruangan / lokasi meeting"
                  />
                </div>
                <div className="flex items-end md:col-span-1 md:justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCreateSlot}
                    disabled={submitting}
                  >
                    Tambah Slot
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-end md:col-span-4 md:justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCreateSlot}
                  disabled={submitting}
                >
                  Tambah Slot
                </Button>
              </div>
            )}
          </div>
        </TableSection>
      )}

      <TableSection title={isAdmin ? "Daftar Slot 1:1" : "Slot Tersedia"}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Waktu</TableHeaderCell>
              <TableHeaderCell>Mode</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Peserta</TableHeaderCell>
              <TableHeaderCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {(isAdmin ? slots : availableSlots).map((slot) => (
              <TableRow key={slot.id}>
                <TableCell>{formatSlotTime(slot.start_at, slot.end_at)}</TableCell>
                <TableCell>
                  <Badge variant="zinc" size="sm">
                    {slot.mode === "online" ? "Online" : "Offline"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      slot.status === "booked"
                        ? "success"
                        : slot.status === "cancelled"
                          ? "error"
                          : "zinc"
                    }
                    size="sm"
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
                        size="sm"
                        variant="secondary"
                        onClick={() => startEdit(slot)}
                        disabled={slot.status === "cancelled"}
                      >
                        Reschedule
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDelete(slot.id)}
                        disabled={cancelId === slot.id}
                      >
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancel(slot.id, "cancel")}
                        disabled={cancelId === slot.id}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleBookSlot(slot.id)}
                      disabled={bookingId === slot.id}
                    >
                      Pilih Slot
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {((isAdmin ? slots : availableSlots).length === 0) && (
              <TableRow>
                <TableCell colSpan={5}>
                  {isLoading ? "Memuat..." : "Belum ada slot"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {isAdmin && editingSlotId && (
          <div className="border-neutral-primary bg-surface-neutral-primary mt-4 rounded-lg border p-3">
            <div className="grid grid-cols-1 gap-md md:grid-cols-4">
              <div className="flex flex-col gap-2">
                <Label>Tanggal</Label>
                <TextInput
                  type="date"
                  value={editDate}
                  onChange={(event) => setEditDate(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Start</Label>
                <TextInput
                  type="time"
                  value={editStartTime}
                  onChange={(event) => setEditStartTime(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>End</Label>
                <TextInput
                  type="time"
                  value={editEndTime}
                  onChange={(event) => setEditEndTime(event.target.value)}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleReschedule}
                  disabled={rescheduleId === editingSlotId}
                >
                  Simpan
                </Button>
                <Button
                  size="sm"
                  variant="tertiary"
                  onClick={() => setEditingSlotId(null)}
                >
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
            <TableHead>
              <TableRow>
                <TableHeaderCell>Waktu</TableHeaderCell>
                <TableHeaderCell>Mode</TableHeaderCell>
                <TableHeaderCell>Meeting</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mySlots.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell>{formatSlotTime(slot.start_at, slot.end_at)}</TableCell>
                  <TableCell>
                    <Badge variant="zinc" size="sm">
                      {slot.mode === "online" ? "Online" : "Offline"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {slot.meeting_url ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            window.open(slot.meeting_url || "", "_blank")
                          }
                        >
                          Join
                        </Button>
                      ) : slot.mode === "online" ? (
                        <Button size="sm" variant="secondary" disabled>
                          Join
                        </Button>
                      ) : (
                        <span>{slot.location || "-"}</span>
                      )}
                      <Button
                        size="sm"
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
                  <TableCell colSpan={3}>Belum ada jadwal</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableSection>
      )}
    </div>
  )
}

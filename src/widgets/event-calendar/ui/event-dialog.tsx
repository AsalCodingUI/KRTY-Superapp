"use client"

import { cx } from "@/shared/lib/utils"
import { logError } from "@/shared/lib/utils/logger"
import { DatePicker } from "@/components/date-picker"
import { TimeSelect } from "@/components/time-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  RiCloseLine,
  RiDeleteBinLine,
  RiSaveLine,
} from "@/shared/ui/lucide-icons"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { HolidayDialog } from "./dialog-variants/HolidayDialog"
import { LeaveDialog } from "./dialog-variants/LeaveDialog"
import { MeetingDialog } from "./dialog-variants/MeetingDialog"
import { PerformanceDialog } from "./dialog-variants/PerformanceDialog"
import {
  getAllEventTypes,
  getEventTypeDefinition,
} from "./event-color-registry"
import type { CalendarEvent } from "./types"

/** Now, rounded up to the next quarter hour (new events start on a slot). */
function nextQuarterHour() {
  const d = new Date()
  d.setSeconds(0, 0)
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15)
  return d
}

const eventSchema = z
  .object({
    title: z.string().min(1, "Judul harus diisi"),
    description: z.string().optional(),
    start: z.string(),
    end: z.string(),
    location: z.string().optional(),
    color: z.enum([
      "emerald",
      "orange",
      "violet",
      "blue",
      "rose",
      "amber",
      "cyan",
      "neutral",
    ]),
    type: z.string().optional(),
    allDay: z.boolean().optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.start)
      const end = new Date(data.end)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
        return false
      // All-day: compare dates only (may end the same day). Timed: end later.
      return data.allDay
        ? new Date(end).setHours(0, 0, 0, 0) >=
            new Date(start).setHours(0, 0, 0, 0)
        : end.getTime() > start.getTime()
    },
    { message: "Selesai harus setelah mulai", path: ["end"] },
  )

type EventFormData = z.infer<typeof eventSchema>

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: CalendarEvent | null
  initialDate?: Date
  onSave?: (event: Partial<CalendarEvent>) => Promise<void>
  onDelete?: (eventId: string) => Promise<void>
  readOnly?: boolean
}

// EVENT_TYPES must match the categories in CalendarClient.tsx getVisibleCategories()
// Use centralized event type registry
const EVENT_TYPES = getAllEventTypes().filter(
  (type) => type.value !== "Public Holiday",
)

const getBadgeVariant = (color?: CalendarEvent["color"]) => {
  switch (color) {
    case "emerald":
      return "success"
    case "rose":
      return "destructive"
    case "orange":
    case "amber":
      return "warning"
    case "cyan":
    case "blue":
    case "violet":
      return "info"
    case "neutral":
    default:
      return "secondary"
  }
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  initialDate,
  onSave,
  onDelete,
  readOnly = false,
}: EventDialogProps) {
  // IMPORTANT: All hooks must be called BEFORE any conditional returns
  // This fixes the "Rendered more hooks than during the previous render" error

  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false) // Internal editing state
  const [isDeletePending, setIsDeletePending] = useState(false)
  const normalizedEventType =
    getEventTypeDefinition(event?.type)?.value ?? event?.type

  const defaultValues: EventFormData = event
    ? {
        title: event.title,
        description: event.description || "",
        start: format(event.start, "yyyy-MM-dd'T'HH:mm"),
        end: format(event.end, "yyyy-MM-dd'T'HH:mm"),
        location: event.location || "",
        color: event.color,
        type: normalizedEventType || "Event",
        allDay: event.allDay || false,
      }
    : {
        title: "",
        description: "",
        start: initialDate
          ? format(initialDate, "yyyy-MM-dd'T'HH:mm")
          : format(nextQuarterHour(), "yyyy-MM-dd'T'HH:mm"),
        end: initialDate
          ? format(
              new Date(initialDate.getTime() + 60 * 60 * 1000),
              "yyyy-MM-dd'T'HH:mm",
            )
          : format(
              new Date(nextQuarterHour().getTime() + 60 * 60 * 1000),
              "yyyy-MM-dd'T'HH:mm",
            ),
        location: "",
        color: "blue",
        type: "Event",
        allDay: false,
      }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  })

  /**
   * Move the start and carry the end along so the duration stays the same
   * (otherwise picking a later start leaves the end before it).
   */
  const moveStart = (nextStart: Date) => {
    const prevStart = new Date(watch("start"))
    const prevEnd = new Date(watch("end"))
    const duration = prevEnd.getTime() - prevStart.getTime()
    const keep =
      Number.isFinite(duration) && duration > 0 ? duration : 60 * 60 * 1000
    setValue("start", format(nextStart, "yyyy-MM-dd'T'HH:mm"))
    setValue(
      "end",
      format(new Date(nextStart.getTime() + keep), "yyyy-MM-dd'T'HH:mm"),
      { shouldValidate: Boolean(errors.end) },
    )
  }

  // Memoize reset function to prevent unnecessary re-renders
  const resetForm = useCallback(() => {
    if (event) {
      reset({
        title: event.title,
        description: event.description || "",
        start: format(event.start, "yyyy-MM-dd'T'HH:mm"),
        end: format(event.end, "yyyy-MM-dd'T'HH:mm"),
        location: event.location || "",
        color: event.color,
        type: normalizedEventType || "Event",
        allDay: event.allDay || false,
      })
    } else {
      const startDate = initialDate || nextQuarterHour()
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000)

      reset({
        title: "",
        description: "",
        start: format(startDate, "yyyy-MM-dd'T'HH:mm"),
        end: format(endDate, "yyyy-MM-dd'T'HH:mm"),
        location: "",
        color: "blue",
        type: "Event",
        allDay: false,
      })
    }
  }, [event, initialDate, normalizedEventType, reset])

  useEffect(() => {
    // Reset editing state when dialog opens/closes or event changes
    setIsEditing(false)
    resetForm()
  }, [open, resetForm])

  // Cleanup delete pending state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsDeletePending(false)
    }
  }, [open])

  const selectedType = watch("type")
  // Older events can carry a type that's no longer in the list (e.g.
  // "Sharing Santuy"); keep it selectable so editing doesn't lose it.
  const typeOptions =
    selectedType && !EVENT_TYPES.some((t) => t.value === selectedType)
      ? [...EVENT_TYPES, { value: selectedType, label: selectedType }]
      : EVENT_TYPES

  // Auto-set color based on type
  const handleTypeChange = (type: string) => {
    setValue("type", type)
    const eventType = EVENT_TYPES.find((t) => t.value === type)
    if (eventType) {
      setValue("color", eventType.color)
    }
  }

  // NOW we can do conditional returns - after all hooks are called

  // 1. Route to LeaveDialog for approved leave requests (WFH, Cuti) - read-only
  if (event && event.id.startsWith("leave-")) {
    return <LeaveDialog open={open} onOpenChange={onOpenChange} event={event} />
  }

  // 2. Route to HolidayDialog for public holidays - read-only
  if (event && normalizedEventType === "Public Holiday") {
    return (
      <HolidayDialog open={open} onOpenChange={onOpenChange} event={event} />
    )
  }

  // 3. Route to MeetingDialog for Internal meetings from GCal - read-only
  if (event && readOnly && normalizedEventType === "Internal") {
    return (
      <MeetingDialog
        open={open}
        onOpenChange={onOpenChange}
        event={event}
        onDelete={onDelete}
      />
    )
  }

  // 4. Route to PerformanceDialog for system 301 Meeting - read-only
  if (event && event.id.startsWith("perf-")) {
    return (
      <PerformanceDialog
        open={open}
        onOpenChange={onOpenChange}
        event={event}
      />
    )
  }

  // 5. Default to editable EventDialog for creating/editing (Event type only)

  const onSubmit = async (data: EventFormData) => {
    if (readOnly || !onSave) return
    setLoading(true)
    try {
      const eventData: Partial<CalendarEvent> = {
        ...event,
        title: data.title,
        description: data.description,
        start: new Date(data.start),
        end: new Date(data.end),
        allDay: data.allDay || false,
        location: data.location,
        color: data.color,
        type: data.type,
        isRecurring: false,
        recurrenceRule: undefined,
        recurrencePattern: undefined,
      }

      await onSave(eventData)
      reset()
      onOpenChange(false)
    } catch (error) {
      logError("Failed to save event:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = () => {
    setIsDeletePending(true)
  }

  const handleCancelDelete = () => {
    setIsDeletePending(false)
  }

  const handleConfirmDelete = async () => {
    if (!event || !onDelete) return
    setLoading(true)
    try {
      await onDelete(event.id)
      onOpenChange(false)
    } catch (error) {
      logError("Failed to delete event:", error)
      setIsDeletePending(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[35rem]">
        <DialogHeader>
          <DialogTitle>
            {event
              ? readOnly && !isEditing
                ? "Detail Jadwal"
                : "Edit Jadwal"
              : "Tambah Jadwal Baru"}
          </DialogTitle>
        </DialogHeader>

        {event && readOnly && !isEditing ? (
          <div className="-mx-1 space-y-5 overflow-y-auto px-1 py-1">
            {/* Event Title & Type */}
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-foreground text-base font-semibold break-words">
                {event.title}
              </h3>
              <Badge
                variant={getBadgeVariant(event.color)}
                className="shrink-0"
              >
                {event.type || "Jadwal"}
              </Badge>
            </div>

            {/* Date & Time */}
            <div className="bg-foreground/[0.03] grid grid-cols-2 gap-4 rounded-lg p-4">
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">
                  Mulai
                </p>
                <p className="text-foreground text-sm">
                  {format(event.start, "dd MMM yyyy", { locale: id })}
                </p>
                {!event.allDay && (
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {format(event.start, "HH:mm")}
                  </p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-sm font-medium">
                  Selesai
                </p>
                <p className="text-foreground text-sm">
                  {format(event.end, "dd MMM yyyy", { locale: id })}
                </p>
                {!event.allDay && (
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {format(event.end, "HH:mm")}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm font-medium">
                  Lokasi
                </p>
                <p className="text-foreground text-sm break-words">
                  {event.location}
                </p>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="border-border space-y-2 border-t pt-4">
                <p className="text-muted-foreground text-sm font-medium">
                  Deskripsi
                </p>
                <p className="text-foreground text-sm break-words whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Action buttons for read-only view */}
            <div className="border-border flex items-center justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                <RiCloseLine className="mr-2 h-4 w-4" />
                Tutup
              </Button>
            </div>
          </div>
        ) : (
          <>
            <form
              id="event-form"
              onSubmit={handleSubmit(onSubmit)}
              className="min-h-0 flex-1"
            >
              <div className="-mx-1 space-y-5 overflow-y-auto px-1 py-1">
                {/* Title */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="title">Judul *</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="Masukkan judul jadwal"
                    aria-invalid={!!errors.title}
                    disabled={readOnly}
                  />
                  {errors.title?.message && (
                    <FieldError className="text-xs">
                      {errors.title.message}
                    </FieldError>
                  )}
                </div>

                {/* Type */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="type">Tipe Jadwal</Label>
                  <Select
                    value={selectedType}
                    onValueChange={(v) => v !== null && handleTypeChange(v)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* All Day Toggle */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="allDay"
                    checked={watch("allDay") || false}
                    onCheckedChange={(checked) =>
                      setValue("allDay", checked === true)
                    }
                    disabled={readOnly}
                  />
                  <Label htmlFor="allDay" className="cursor-pointer">
                    Sepanjang Hari
                  </Label>
                </div>

                {/* Date and Time */}
                <div className="space-y-4">
                  {/* Start Date & Time */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="start">Mulai *</Label>
                    <div
                      className={cx(
                        watch("allDay") ? "" : "grid grid-cols-2 gap-2",
                      )}
                    >
                      <DatePicker
                        value={
                          watch("start") ? new Date(watch("start")) : undefined
                        }
                        onChange={(date: Date | undefined) => {
                          if (date) {
                            const currentStart = watch("start")
                              ? new Date(watch("start"))
                              : new Date()
                            const newDate = new Date(date)
                            // Preserve time from current start if valid
                            if (!isNaN(currentStart.getTime())) {
                              newDate.setHours(
                                currentStart.getHours(),
                                currentStart.getMinutes(),
                              )
                            }
                            moveStart(newDate)
                          }
                        }}
                        placeholder="Pilih tanggal"
                        disabled={readOnly}
                      />
                      {!watch("allDay") && (
                        <TimeSelect
                          value={(() => {
                            const startValue = watch("start")
                            if (!startValue) return ""
                            const date = new Date(startValue)
                            return isNaN(date.getTime())
                              ? ""
                              : format(date, "HH:mm")
                          })()}
                          onValueChange={(value) => {
                            const currentStart = watch("start")
                              ? new Date(watch("start"))
                              : new Date()
                            const [hours, minutes] = value.split(":")
                            if (!isNaN(currentStart.getTime())) {
                              currentStart.setHours(
                                parseInt(hours),
                                parseInt(minutes),
                              )
                              moveStart(currentStart)
                            }
                          }}
                          disabled={readOnly}
                        />
                      )}
                    </div>
                    {errors.start && (
                      <p className="text-destructive text-xs">
                        {errors.start.message}
                      </p>
                    )}
                  </div>

                  {/* End Date & Time */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="end">Selesai *</Label>
                    <div
                      className={cx(
                        watch("allDay") ? "" : "grid grid-cols-2 gap-2",
                      )}
                    >
                      <DatePicker
                        value={
                          watch("end") ? new Date(watch("end")) : undefined
                        }
                        onChange={(date: Date | undefined) => {
                          if (date) {
                            const currentEnd = watch("end")
                              ? new Date(watch("end"))
                              : new Date()
                            const newDate = new Date(date)
                            // Preserve time from current end if valid
                            if (!isNaN(currentEnd.getTime())) {
                              newDate.setHours(
                                currentEnd.getHours(),
                                currentEnd.getMinutes(),
                              )
                            }
                            setValue(
                              "end",
                              format(newDate, "yyyy-MM-dd'T'HH:mm"),
                            )
                          }
                        }}
                        placeholder="Pilih tanggal"
                        disabled={readOnly}
                      />
                      {!watch("allDay") && (
                        <TimeSelect
                          value={(() => {
                            const endValue = watch("end")
                            if (!endValue) return ""
                            const date = new Date(endValue)
                            return isNaN(date.getTime())
                              ? ""
                              : format(date, "HH:mm")
                          })()}
                          onValueChange={(value) => {
                            const currentEnd = watch("end")
                              ? new Date(watch("end"))
                              : new Date()
                            const [hours, minutes] = value.split(":")
                            if (!isNaN(currentEnd.getTime())) {
                              currentEnd.setHours(
                                parseInt(hours),
                                parseInt(minutes),
                              )
                              setValue(
                                "end",
                                format(currentEnd, "yyyy-MM-dd'T'HH:mm"),
                              )
                            }
                          }}
                          disabled={readOnly}
                        />
                      )}
                    </div>
                    {errors.end && (
                      <p className="text-destructive text-xs">
                        {errors.end.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="location">Lokasi</Label>
                  <Input
                    id="location"
                    {...register("location")}
                    placeholder="Masukkan lokasi (opsional)"
                    disabled={readOnly}
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Tambahkan deskripsi (opsional)"
                    rows={3}
                    disabled={readOnly}
                  />
                </div>

                {/* Recurrence hidden for now */}
              </div>
            </form>
            <DialogFooter className="sm:justify-between">
              <div className="flex-1">
                {!readOnly && event && onDelete && (
                  <>
                    {isDeletePending ? (
                      <div className="animate-fadeIn flex items-center gap-2">
                        <span className="text-destructive text-sm font-medium">
                          Yakin hapus?
                        </span>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleConfirmDelete}
                          disabled={loading}
                          className=""
                        >
                          Ya, Hapus
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelDelete}
                          disabled={loading}
                        >
                          Batal
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDeleteClick}
                        disabled={loading}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <RiDeleteBinLine className="mr-2 h-4 w-4" />
                        Hapus
                      </Button>
                    )}
                  </>
                )}
              </div>
              <div className="ml-4 flex gap-2">
                {!isDeletePending && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={loading}
                    >
                      <RiCloseLine className="mr-2 h-4 w-4" />
                      {readOnly ? "Tutup" : "Batal"}
                    </Button>
                    {!readOnly && (
                      <Button
                        type="submit"
                        form="event-form"
                        disabled={loading}
                      >
                        <RiSaveLine className="mr-2 h-4 w-4" />
                        {loading ? "Menyimpan..." : "Simpan"}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

"use client"

import {
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  TextInput,
} from "@/components/ui"
import { logError } from "@/shared/lib/utils/logger"
import { patternToRRule, rruleToPattern } from "@/shared/lib/date/recurrence"
import { cx } from "@/shared/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { RiCloseLine, RiDeleteBinLine, RiSaveLine } from "@remixicon/react"
import { format } from "date-fns"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { RecurrenceSelector } from "./components/RecurrenceSelector"
import { HolidayDialog } from "./dialog-variants/HolidayDialog"
import { LeaveDialog } from "./dialog-variants/LeaveDialog"
import { MeetingDialog } from "./dialog-variants/MeetingDialog"
import { PerformanceDialog } from "./dialog-variants/PerformanceDialog"
import { getAllEventTypes, getEventColorClasses } from "./event-color-registry"
import type { CalendarEvent, RecurrencePattern } from "./types"

const eventSchema = z.object({
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
const EVENT_TYPES = getAllEventTypes()

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
  const [recurrencePattern, setRecurrencePattern] =
    useState<RecurrencePattern | null>(
      event?.recurrenceRule ? rruleToPattern(event.recurrenceRule) : null,
    )
  const [isDeletePending, setIsDeletePending] = useState(false)

  const defaultValues: EventFormData = event
    ? {
        title: event.title,
        description: event.description || "",
        start: format(event.start, "yyyy-MM-dd'T'HH:mm"),
        end: format(event.end, "yyyy-MM-dd'T'HH:mm"),
        location: event.location || "",
        color: event.color,
        type: event.type || "Event",
        allDay: event.allDay || false,
      }
    : {
        title: "",
        description: "",
        start: initialDate
          ? format(initialDate, "yyyy-MM-dd'T'HH:mm")
          : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        end: initialDate
          ? format(
              new Date(initialDate.getTime() + 60 * 60 * 1000),
              "yyyy-MM-dd'T'HH:mm",
            )
          : format(new Date(Date.now() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
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
        type: event.type || "Event",
        allDay: event.allDay || false,
      })
    } else {
      const startDate = initialDate || new Date()
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
  }, [event, initialDate, reset])

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
  if (event?.id?.startsWith("leave-")) {
    return <LeaveDialog open={open} onOpenChange={onOpenChange} event={event} />
  }

  // 2. Route to HolidayDialog for public holidays - read-only
  if (event?.type === "holiday") {
    return (
      <HolidayDialog open={open} onOpenChange={onOpenChange} event={event} />
    )
  }

  // 3. Route to MeetingDialog for Internal meetings from GCal - read-only
  if (readOnly && event?.type === "Internal") {
    return (
      <MeetingDialog
        open={open}
        onOpenChange={onOpenChange}
        event={event}
        onDelete={onDelete}
      />
    )
  }

  // 4. Route to PerformanceDialog for 301 Meeting - read-only
  if (event?.type === "301Meeting" || event?.id?.startsWith("perf-")) {
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
        isRecurring: !!recurrencePattern,
        recurrenceRule: recurrencePattern
          ? patternToRRule(recurrencePattern)
          : undefined,
        recurrencePattern: recurrencePattern || undefined,
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
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[500px]">
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
          <div className="mt-4 space-y-6 overflow-y-auto pr-2">
            {/* Event Title & Type */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-content text-heading-lg break-words">
                  {event.title}
                </h3>
                <div
                  className={cx(
                    "text-label-xs flex-shrink-0 rounded-md px-3 py-1.5 whitespace-nowrap",
                    getEventColorClasses(event.color, "default"),
                  )}
                >
                  {event.type || "Event"}
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="bg-muted/50 border-border-border grid grid-cols-2 gap-4 rounded-lg border p-4">
              <div>
                <h4 className="text-content-muted text-label-xs mb-2">Mulai</h4>
                <p className="text-content text-label-md">
                  {format(event.start, "dd MMM yyyy")}
                </p>
                <p className="text-content-muted text-body-sm mt-0.5">
                  {format(event.start, "HH:mm")}
                </p>
              </div>
              <div>
                <h4 className="text-content-muted text-label-xs mb-2">
                  Selesai
                </h4>
                <p className="text-content text-label-md">
                  {format(event.end, "dd MMM yyyy")}
                </p>
                <p className="text-content-muted text-body-sm mt-0.5">
                  {format(event.end, "HH:mm")}
                </p>
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="space-y-2">
                <h4 className="text-content text-label-md">Lokasi</h4>
                <p className="text-content-muted text-label-md break-words">
                  {event.location}
                </p>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="border-border-border space-y-2 border-t pt-4">
                <h4 className="text-content text-label-md">Deskripsi</h4>
                <p className="text-content-muted text-label-md break-words whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Action buttons for read-only view */}
            <div className="border-border-border flex items-center justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                <RiCloseLine className="mr-2 h-4 w-4" />
                Tutup
              </Button>
              {/* Show Edit button only if the event is not from Google Calendar */}
              {!event.googleEventId && (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2"
          >
            {/* Title */}
            <div>
              <Label htmlFor="title">Judul *</Label>
              <TextInput
                id="title"
                {...register("title")}
                placeholder="Masukkan judul jadwal"
                error={!!errors.title}
                errorMessage={errors.title?.message}
                disabled={readOnly}
              />
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="type">Tipe Jadwal</Label>
              <Select
                value={selectedType}
                onValueChange={handleTypeChange}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDay"
                checked={watch("allDay") || false}
                onChange={(e) => setValue("allDay", e.target.checked)}
                className="border-border-border text-primary h-4 w-4 rounded focus:ring-[--focus-ring-color]"
                disabled={readOnly}
              />
              <Label htmlFor="allDay" className="cursor-pointer">
                Sepanjang Hari (All Day)
              </Label>
            </div>

            {/* Date and Time */}
            <div className="space-y-4">
              {/* Start Date & Time */}
              <div>
                <Label htmlFor="start">Mulai *</Label>
                <div
                  className={cx(
                    "mt-1",
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
                        setValue("start", format(newDate, "yyyy-MM-dd'T'HH:mm"))
                      }
                    }}
                    placeholder="Select date"
                    disabled={readOnly}
                  />
                  {!watch("allDay") && (
                    <input
                      type="time"
                      value={(() => {
                        const startValue = watch("start")
                        if (!startValue) return ""
                        const date = new Date(startValue)
                        return isNaN(date.getTime())
                          ? ""
                          : format(date, "HH:mm")
                      })()}
                      onChange={(e) => {
                        const currentStart = watch("start")
                          ? new Date(watch("start"))
                          : new Date()
                        const [hours, minutes] = e.target.value.split(":")
                        if (!isNaN(currentStart.getTime())) {
                          currentStart.setHours(
                            parseInt(hours),
                            parseInt(minutes),
                          )
                          setValue(
                            "start",
                            format(currentStart, "yyyy-MM-dd'T'HH:mm"),
                          )
                        }
                      }}
                      className={cx(
                        "text-body-sm w-full rounded-md px-3 py-2 transition-colors",
                        "border-border-border bg-surface text-content border",
                        "focus:border-primary focus:ring-2 focus:ring-[--focus-ring-color] focus:outline-none",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                      disabled={readOnly}
                    />
                  )}
                </div>
                {errors.start && (
                  <p className="text-danger text-body-xs mt-1">
                    {errors.start.message}
                  </p>
                )}
              </div>

              {/* End Date & Time */}
              <div>
                <Label htmlFor="end">Selesai *</Label>
                <div
                  className={cx(
                    "mt-1",
                    watch("allDay") ? "" : "grid grid-cols-2 gap-2",
                  )}
                >
                  <DatePicker
                    value={watch("end") ? new Date(watch("end")) : undefined}
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
                        setValue("end", format(newDate, "yyyy-MM-dd'T'HH:mm"))
                      }
                    }}
                    placeholder="Select date"
                    disabled={readOnly}
                  />
                  {!watch("allDay") && (
                    <input
                      type="time"
                      value={(() => {
                        const endValue = watch("end")
                        if (!endValue) return ""
                        const date = new Date(endValue)
                        return isNaN(date.getTime())
                          ? ""
                          : format(date, "HH:mm")
                      })()}
                      onChange={(e) => {
                        const currentEnd = watch("end")
                          ? new Date(watch("end"))
                          : new Date()
                        const [hours, minutes] = e.target.value.split(":")
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
                      className={cx(
                        "text-body-sm w-full rounded-md px-3 py-2 transition-colors",
                        "border-border-border bg-surface text-content border",
                        "focus:border-primary focus:ring-2 focus:ring-[--focus-ring-color] focus:outline-none",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                      disabled={readOnly}
                    />
                  )}
                </div>
                {errors.end && (
                  <p className="text-danger text-body-xs mt-1">
                    {errors.end.message}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Lokasi</Label>
              <TextInput
                id="location"
                {...register("location")}
                placeholder="Masukkan lokasi (opsional)"
                disabled={readOnly}
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Tambahkan deskripsi (opsional)"
                rows={3}
                disabled={readOnly}
              />
            </div>

            {/* Recurrence */}
            {!readOnly && (
              <div className="space-y-2">
                <Label htmlFor="recurrence">Repeat</Label>
                <RecurrenceSelector
                  value={recurrencePattern}
                  onChange={setRecurrencePattern}
                  eventStart={
                    watch("start") ? new Date(watch("start")) : undefined
                  }
                />
              </div>
            )}

            {/* Actions */}
            <div className="border-border-border flex items-center justify-between border-t pt-4">
              <div className="flex-1">
                {!readOnly && isEditing && onDelete && (
                  <>
                    {isDeletePending ? (
                      <div className="animate-fadeIn flex items-center gap-2">
                        <span className="text-danger text-label-md">
                          Yakin hapus?
                        </span>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleConfirmDelete}
                          disabled={loading}
                          className="bg-danger hover:bg-danger-hover text-danger-fg border-transparent ring-0"
                        >
                          Ya, Hapus
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleCancelDelete}
                          disabled={loading}
                        >
                          Batal
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleDeleteClick}
                        disabled={loading}
                        className="hover:text-danger hover:border-danger hover:bg-danger-subtle transition-colors"
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
                      variant="secondary"
                      onClick={() => onOpenChange(false)}
                      disabled={loading}
                    >
                      <RiCloseLine className="mr-2 h-4 w-4" />
                      {readOnly ? "Tutup" : "Batal"}
                    </Button>
                    {!readOnly && (
                      <Button type="submit" disabled={loading}>
                        <RiSaveLine className="mr-2 h-4 w-4" />
                        {loading ? "Menyimpan..." : "Simpan"}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

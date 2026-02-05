"use client"

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui"
import {
  RiCalendarLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiMapPinLine,
} from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { useState } from "react"
import { CopyEventButton } from "../components/CopyEventButton"
import { GuestList } from "../components/GuestList"
import { MeetingButton } from "../components/MeetingButton"
import { RSVPButtons } from "../components/RSVPButtons"
import type { CalendarEvent } from "../types"

interface MeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent
  onDelete?: (eventId: string) => Promise<void>
  onRSVPChange?: (
    eventId: string,
    status: "yes" | "no" | "maybe",
  ) => Promise<void>
}

export function MeetingDialog({
  open,
  onOpenChange,
  event,
  onDelete,
  onRSVPChange,
}: MeetingDialogProps) {
  const [loading, setLoading] = useState(false)
  const [rsvpStatus, setRsvpStatus] = useState<
    "yes" | "no" | "maybe" | undefined
  >(event.rsvpStatus)

  const [isDeletePending, setIsDeletePending] = useState(false)

  const handleDeleteClick = () => {
    setIsDeletePending(true)
  }

  const handleCancelDelete = () => {
    setIsDeletePending(false)
  }

  const handleConfirmDelete = async () => {
    if (!onDelete) return
    setLoading(true)
    try {
      await onDelete(event.id)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to delete event:", error)
      setIsDeletePending(false)
    } finally {
      setLoading(false)
    }
  }

  const handleRSVPChange = async (status: "yes" | "no" | "maybe") => {
    if (!onRSVPChange) return

    setLoading(true)
    try {
      await onRSVPChange(event.id, status)
      setRsvpStatus(status)
    } catch (error) {
      console.error("Failed to update RSVP:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Meeting Details</DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex-1 space-y-6 overflow-y-auto pr-2">
          {/* Event Title & Type */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-heading-lg text-content break-words">
                {event.title}
              </h3>
              <div className="badge-primary-subtle flex-shrink-0 whitespace-nowrap">
                {event.type || "Meeting"}
              </div>
            </div>
          </div>

          {/* Google Meet Button */}
          {event.meetingUrl && <MeetingButton meetingUrl={event.meetingUrl} />}

          {/* Date & Time */}
          <div className="bg-muted/50 border-border grid grid-cols-2 gap-4 rounded-lg border p-4">
            <div>
              <h4 className="text-label-xs text-content-subtle mb-2">Mulai</h4>
              <p className="text-label-md text-content">
                {format(event.start, "dd MMM yyyy")}
              </p>
              <p className="text-body-sm text-content-subtle mt-0.5">
                {format(event.start, "HH:mm")}
              </p>
            </div>
            <div>
              <h4 className="text-label-xs text-content-subtle mb-2">
                Selesai
              </h4>
              <p className="text-label-md text-content">
                {format(event.end, "dd MMM yyyy")}
              </p>
              <p className="text-body-sm text-content-subtle mt-0.5">
                {format(event.end, "HH:mm")}
              </p>
            </div>
          </div>

          {/* Guest List */}
          {event.guests && event.guests.length > 0 && (
            <div className="border-border border-t pt-4">
              <GuestList guests={event.guests} />
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
              <RiMapPinLine className="text-content-subtle mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <h4 className="text-label-md text-content mb-1">Lokasi</h4>
                <p className="text-label-md text-content-subtle break-words">
                  {event.location}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="border-border space-y-2 border-t pt-4">
              <h4 className="text-label-md text-content">Deskripsi</h4>
              <p className="text-label-md text-content-subtle break-words whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Calendar Info */}
          <div className="text-body-xs text-content-subtle border-border flex items-center gap-2 border-t pt-4">
            <RiCalendarLine className="h-4 w-4" />
            <span>{event.organizer || "Kretya Studio"}</span>
          </div>

          {/* RSVP */}
          {onRSVPChange && (
            <div className="border-border border-t pt-4">
              <RSVPButtons
                value={rsvpStatus}
                onChange={handleRSVPChange}
                disabled={loading}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-border mt-auto flex items-center justify-between border-t pt-4">
          <div className="flex flex-1 gap-2">
            {onDelete && (
              <>
                {isDeletePending ? (
                  <div className="animate-fadeIn flex w-full items-center gap-2">
                    <span className="text-label-md text-danger whitespace-nowrap">
                      Yakin hapus?
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleConfirmDelete}
                      disabled={loading}
                      className="bg-danger hover:bg-danger-600 border-transparent text-white ring-0"
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
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleDeleteClick}
                      disabled={loading}
                      className="hover:text-danger hover:border-danger hover:bg-danger-50 dark:hover:bg-danger-950/30 transition-colors"
                    >
                      <RiDeleteBinLine className="mr-2 h-4 w-4" />
                      Hapus
                    </Button>
                    <CopyEventButton event={event} />
                  </>
                )}
              </>
            )}
            {/* Show Copy button if onDelete is missing */}
            {!onDelete && <CopyEventButton event={event} />}
          </div>

          {!isDeletePending && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <RiCloseLine className="mr-2 h-4 w-4" />
              Tutup
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

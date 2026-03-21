"use client"

import { logError } from "@/shared/lib/utils/logger"
import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui"
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
      logError("Failed to delete event:", error)
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
      logError("Failed to update RSVP:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Meeting Details</DialogTitle>
          <DialogCloseButton onClick={() => onOpenChange(false)} />
        </DialogHeader>

        <DialogBody className="flex-1 space-y-5 overflow-y-auto">
          {/* Event Title & Type */}
          <div className="flex items-start justify-between gap-4">
              <h3 className="text-heading-sm text-foreground-primary break-words">
                {event.title}
              </h3>
            <Badge variant="info" size="sm" className="shrink-0">
              {event.type || "Meeting"}
            </Badge>
          </div>

          {/* Google Meet Button */}
          {event.meetingUrl && <MeetingButton meetingUrl={event.meetingUrl} />}

          {/* Date & Time */}
          <div className="bg-surface-neutral-secondary border-neutral-primary grid grid-cols-2 gap-4 rounded-lg border p-4">
            <div>
              <p className="text-label-sm text-foreground-secondary mb-1">Mulai</p>
              <p className="text-body-sm text-foreground-primary">
                {format(event.start, "dd MMM yyyy")}
              </p>
              <p className="text-body-sm text-foreground-secondary mt-0.5">
                {format(event.start, "HH:mm")}
              </p>
            </div>
            <div>
              <p className="text-label-sm text-foreground-secondary mb-1">Selesai</p>
              <p className="text-body-sm text-foreground-primary">
                {format(event.end, "dd MMM yyyy")}
              </p>
              <p className="text-body-sm text-foreground-secondary mt-0.5">
                {format(event.end, "HH:mm")}
              </p>
            </div>
          </div>

          {/* Guest List */}
          {event.guests && event.guests.length > 0 && (
            <div className="border-neutral-primary border-t pt-4">
              <GuestList guests={event.guests} />
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="space-y-2">
              <p className="text-label-sm text-foreground-secondary flex items-center gap-2">
                <RiMapPinLine className="h-4 w-4" />
                Lokasi
              </p>
              <p className="text-body-sm text-foreground-primary break-words pl-6">
                {event.location}
              </p>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="border-neutral-primary space-y-2 border-t pt-4">
              <p className="text-label-sm text-foreground-secondary">Deskripsi</p>
              <p className="text-body-sm text-foreground-primary break-words whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Calendar Info */}
          <div className="text-body-xs text-foreground-secondary border-neutral-primary flex items-center gap-2 border-t pt-4">
            <RiCalendarLine className="h-4 w-4" />
            <span>{event.organizer || "Kretya Studio"}</span>
          </div>

          {/* RSVP */}
          {onRSVPChange && (
            <div className="border-neutral-primary border-t pt-4">
              <RSVPButtons
                value={rsvpStatus}
                onChange={handleRSVPChange}
                disabled={loading}
              />
            </div>
          )}
        </DialogBody>

        <DialogFooter className="justify-between">
          <div className="flex flex-1 gap-2">
            {onDelete && (
              <>
                {isDeletePending ? (
                  <div className="animate-fadeIn flex w-full items-center gap-2">
                    <span className="text-label-md text-foreground-danger-dark whitespace-nowrap">
                      Yakin hapus?
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleConfirmDelete}
                      disabled={loading}
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
                      className="text-foreground-danger-dark hover:bg-surface-danger-light"
                    >
                      <RiDeleteBinLine className="mr-2 h-4 w-4" />
                      Hapus
                    </Button>
                    <CopyEventButton event={event} />
                  </>
                )}
              </>
            )}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

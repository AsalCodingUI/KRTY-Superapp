"use client"

import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui"
import { cx } from "@/shared/lib/utils"
import {
  RiCalendarLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiFileTextLine,
  RiMapPinLine,
} from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { type ReactNode, useState } from "react"
import type { CalendarEvent } from "../types"

interface BadgeConfig {
  label: string
  color:
    | "emerald"
    | "rose"
    | "orange"
    | "violet"
    | "blue"
    | "amber"
    | "cyan"
    | "neutral"
}

interface BaseReadOnlyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent
  title: string
  badges?: BadgeConfig[]
  showLocation?: boolean
  customContent?: ReactNode
  infoMessage?: string
  onDelete?: (eventId: string) => Promise<void>
}

export function BaseReadOnlyDialog({
  open,
  onOpenChange,
  event,
  title,
  badges = [],
  showLocation = true,
  customContent,
  infoMessage,
  onDelete,
}: BaseReadOnlyDialogProps) {
  const [loading, setLoading] = useState(false)
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogCloseButton onClick={() => onOpenChange(false)} />
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {badges.map((badge, index) => (
                <Badge key={index} color={badge.color} className="text-body-sm">
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}

          {/* Event Title */}
          <div className="space-y-2">
            <h3 className="text-heading-md text-content">{event.title}</h3>
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <div className="text-label-md text-content flex items-center gap-2">
              <RiCalendarLine className="text-content-subtle h-4 w-4" />
              <span>Waktu</span>
            </div>
            <div className="space-y-1 pl-6">
              {event.allDay ? (
                <div className="text-body-md text-content">
                  {format(event.start, "EEEE, d MMMM yyyy")}
                  {event.start.getTime() !== event.end.getTime() && (
                    <> - {format(event.end, "EEEE, d MMMM yyyy")}</>
                  )}
                </div>
              ) : (
                <>
                  <div className="text-content flex items-center gap-2">
                    <span className="text-body-sm text-content-subtle">
                      Mulai:
                    </span>
                    <span className="text-body-md">
                      {format(event.start, "EEEE, d MMMM yyyy • HH:mm")}
                    </span>
                  </div>
                  <div className="text-content flex items-center gap-2">
                    <span className="text-body-sm text-content-subtle">
                      Selesai:
                    </span>
                    <span className="text-body-md">
                      {format(event.end, "EEEE, d MMMM yyyy • HH:mm")}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Location */}
          {showLocation && event.location && (
            <div className="space-y-2">
              <div className="text-label-md text-content flex items-center gap-2">
                <RiMapPinLine className="text-content-subtle h-4 w-4" />
                <span>Lokasi</span>
              </div>
              <div className="text-body-md text-content pl-6">
                {event.location}
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="space-y-2">
              <div className="text-label-md text-content flex items-center gap-2">
                <RiFileTextLine className="text-content-subtle h-4 w-4" />
                <span>Deskripsi</span>
              </div>
              <div
                className={cx(
                  "text-body-md text-content pl-6",
                  "bg-muted/30 border-border rounded-md border p-3",
                )}
              >
                {event.description}
              </div>
            </div>
          )}

          {/* Custom Content */}
          {customContent}

          {/* Info Message */}
          {infoMessage && (
            <div className="alert-info">
              <p className="text-body-sm">ℹ️ {infoMessage}</p>
            </div>
          )}
        </DialogBody>

        {/* Footer */}
        <div className="border-border flex justify-between border-t pt-4">
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
                )}
              </>
            )}
          </div>
          {!isDeletePending && (
            <Button
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

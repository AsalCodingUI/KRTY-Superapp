"use client"

import { cx } from "@/shared/lib/utils"
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
      logError("Failed to delete event:", error)
      setIsDeletePending(false)
    } finally {
      setLoading(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogCloseButton onClick={() => onOpenChange(false)} />
        </DialogHeader>

        <DialogBody className="space-y-5">
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
            <h3 className="text-heading-sm text-foreground-primary">{event.title}</h3>
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <div className="text-label-sm text-foreground-secondary flex items-center gap-2">
              <RiCalendarLine className="text-foreground-secondary h-4 w-4" />
              <span>Waktu</span>
            </div>
            <div className="space-y-1 pl-6">
              {event.allDay ? (
                  <div className="text-body-sm text-foreground-primary">
                    {format(event.start, "EEEE, d MMMM yyyy")}
                  {event.start.getTime() !== event.end.getTime() && (
                    <> - {format(event.end, "EEEE, d MMMM yyyy")}</>
                  )}
                </div>
              ) : (
                <>
                  <div className="text-foreground-primary flex items-center gap-2">
                    <span className="text-body-sm text-foreground-secondary">
                      Mulai:
                    </span>
                    <span className="text-body-sm">
                      {format(event.start, "EEEE, d MMMM yyyy • HH:mm")}
                    </span>
                  </div>
                  <div className="text-foreground-primary flex items-center gap-2">
                    <span className="text-body-sm text-foreground-secondary">
                      Selesai:
                    </span>
                    <span className="text-body-sm">
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
              <div className="text-label-sm text-foreground-secondary flex items-center gap-2">
                <RiMapPinLine className="text-foreground-secondary h-4 w-4" />
                <span>Lokasi</span>
              </div>
              <div className="text-body-sm text-foreground-primary pl-6">
                {event.location}
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="space-y-2">
              <div className="text-label-sm text-foreground-secondary flex items-center gap-2">
                <RiFileTextLine className="text-foreground-secondary h-4 w-4" />
                <span>Deskripsi</span>
              </div>
              <div
                className={cx(
                  "text-body-sm text-foreground-primary pl-6",
                  "bg-surface-neutral-secondary border-neutral-primary rounded-md border p-3",
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
            <div className="bg-primary/10 rounded-lg border border-primary/20 p-3">
              <p className="text-body-xs text-foreground-brand-primary">ℹ️ {infoMessage}</p>
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
                      className=""
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
                    className="text-foreground-danger-dark hover:bg-surface-danger-light"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

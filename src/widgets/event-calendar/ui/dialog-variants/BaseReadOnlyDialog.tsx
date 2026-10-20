"use client"

import { cx } from "@/shared/lib/utils"
import { logError } from "@/shared/lib/utils/logger"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  RiCalendarLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiFileTextLine,
  RiMapPinLine,
} from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { id } from "date-fns/locale"
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
        </DialogHeader>

        <div className="space-y-5">
          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {badges.map((badge, index) => (
                <Badge
                  variant="secondary"
                  key={index}
                  color={badge.color}
                  className="text-sm"
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}

          {/* Event Title */}
          <div className="space-y-2">
            <h3 className="text-foreground text-base font-semibold">
              {event.title}
            </h3>
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <RiCalendarLine className="text-muted-foreground h-4 w-4" />
              <span>Waktu</span>
            </div>
            <div className="space-y-1 pl-6">
              {event.allDay ? (
                <div className="text-foreground text-sm">
                  {format(event.start, "EEEE, d MMMM yyyy", { locale: id })}
                  {event.start.getTime() !== event.end.getTime() && (
                    <>
                      {" "}
                      - {format(event.end, "EEEE, d MMMM yyyy", { locale: id })}
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="text-foreground flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      Mulai:
                    </span>
                    <span className="text-sm">
                      {format(event.start, "EEEE, d MMMM yyyy • HH:mm", {
                        locale: id,
                      })}
                    </span>
                  </div>
                  <div className="text-foreground flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">
                      Selesai:
                    </span>
                    <span className="text-sm">
                      {format(event.end, "EEEE, d MMMM yyyy • HH:mm", {
                        locale: id,
                      })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Location */}
          {showLocation && event.location && (
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <RiMapPinLine className="text-muted-foreground h-4 w-4" />
                <span>Lokasi</span>
              </div>
              <div className="text-foreground pl-6 text-sm">
                {event.location}
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <RiFileTextLine className="text-muted-foreground h-4 w-4" />
                <span>Deskripsi</span>
              </div>
              <div
                className={cx(
                  "text-foreground pl-6 text-sm",
                  "bg-muted border-border rounded-md border p-3",
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
            <div className="bg-primary/10 border-primary/20 bg-foreground/[0.03] rounded-lg p-3">
              <p className="text-primary text-xs">ℹ️ {infoMessage}</p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="flex flex-1 gap-2">
            {onDelete && (
              <>
                {isDeletePending ? (
                  <div className="animate-fadeIn flex w-full items-center gap-2">
                    <span className="text-destructive text-sm font-medium whitespace-nowrap">
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
          {!isDeletePending && (
            <Button
              variant="outline"
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

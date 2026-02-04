"use client"

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui"
import { RiCalendarLine, RiCloseLine } from "@remixicon/react"
import { format } from "date-fns"
import type { CalendarEvent } from "../types"

interface HolidayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent
}

export function HolidayDialog({
  open,
  onOpenChange,
  event,
}: HolidayDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Public Holiday</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Holiday Title */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-heading-lg text-content break-words">
                {event.title}
              </h3>
              <div className="badge-neutral flex-shrink-0 whitespace-nowrap">
                Holiday
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="bg-muted/50 border-border rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <RiCalendarLine className="text-content-subtle h-5 w-5" />
              <div>
                <p className="text-label-md text-content">
                  {format(event.start, "EEEE, dd MMMM yyyy")}
                </p>
                {event.allDay && (
                  <p className="text-body-xs text-content-subtle mt-0.5">
                    All day
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="border-border space-y-2 border-t pt-4">
              <h4 className="text-label-md text-content">About this holiday</h4>
              <p className="text-label-md text-content-subtle break-words whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Info notice */}
          <div className="alert-info">
            <p className="text-body-sm">
              ℹ️ This is a public holiday from the Indonesian calendar. It
              cannot be edited or deleted.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="border-border mt-4 flex justify-end border-t pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            <RiCloseLine className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

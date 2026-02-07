"use client"

import {
  Button,
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui"
import { RiCalendarLine, RiCloseLine } from "@/shared/ui/lucide-icons"
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
          <DialogCloseButton onClick={() => onOpenChange(false)} />
        </DialogHeader>

        <DialogBody className="space-y-6">
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
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            <RiCloseLine className="mr-2 h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

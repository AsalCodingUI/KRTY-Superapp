"use client"

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Public Holiday</DialogTitle>
          <DialogCloseButton onClick={() => onOpenChange(false)} />
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* Holiday Title */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-heading-sm text-foreground-primary break-words">
                {event.title}
              </h3>
              <Badge variant="zinc" size="sm" className="shrink-0">
                Holiday
              </Badge>
            </div>
          </div>

          {/* Date */}
          <div className="bg-surface-neutral-secondary border-neutral-primary rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <RiCalendarLine className="text-foreground-secondary h-5 w-5" />
              <div>
                <p className="text-body-sm text-foreground-primary">
                  {format(event.start, "EEEE, dd MMMM yyyy")}
                </p>
                {event.allDay && (
                  <p className="text-body-xs text-foreground-secondary mt-0.5">
                    All day
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="border-neutral-primary space-y-2 border-t pt-4">
              <h4 className="text-label-sm text-foreground-secondary">About this holiday</h4>
              <p className="text-body-sm text-foreground-primary break-words whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Info notice */}
          <div className="bg-primary/10 rounded-lg border border-primary/20 p-3">
            <p className="text-body-xs text-foreground-brand-primary">
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

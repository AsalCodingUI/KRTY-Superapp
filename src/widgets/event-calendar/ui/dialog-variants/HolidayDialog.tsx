"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { RiCalendarLine } from "@/shared/ui/lucide-icons"
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
  const t = useT("calendar")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[35rem]">
        <DialogHeader>
          <DialogTitle>{t("eventTypePublicHoliday")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Holiday Title */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-foreground text-base font-semibold break-words">
                {event.title}
              </h3>
              <Badge variant="secondary" className="shrink-0">
                {t("holidayBadge")}
              </Badge>
            </div>
          </div>

          {/* Date */}
          <div className="bg-foreground/[0.03] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <RiCalendarLine className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-foreground text-sm">
                  {format(event.start, "EEEE, dd MMMM yyyy", {
                    locale: dateLocale,
                  })}
                </p>
                {event.allDay && (
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {t("holidayAllDay")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="border-border space-y-2 border-t pt-4">
              <h4 className="text-muted-foreground text-sm font-medium">
                {t("holidayAbout")}
              </h4>
              <p className="text-foreground text-sm break-words whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Info notice */}
          <div className="bg-primary/10 border-primary/20 bg-foreground/[0.03] rounded-lg p-3">
            <p className="text-primary text-xs">ℹ️ {t("holidayInfo")}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tc("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

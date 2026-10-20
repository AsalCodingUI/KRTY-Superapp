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
import { RiCalendarLine, RiCloseLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { id } from "date-fns/locale"
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
          <DialogTitle>Hari Libur Nasional</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Holiday Title */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-foreground text-base font-semibold break-words">
                {event.title}
              </h3>
              <Badge variant="secondary" className="shrink-0">
                Libur
              </Badge>
            </div>
          </div>

          {/* Date */}
          <div className="border-border rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <RiCalendarLine className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-foreground text-sm">
                  {format(event.start, "EEEE, dd MMMM yyyy", { locale: id })}
                </p>
                {event.allDay && (
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Sepanjang hari
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="border-border space-y-2 border-t pt-4">
              <h4 className="text-muted-foreground text-sm font-medium">
                Tentang hari libur ini
              </h4>
              <p className="text-foreground text-sm break-words whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Info notice */}
          <div className="bg-primary/10 border-primary/20 rounded-lg border p-3">
            <p className="text-primary text-xs">
              ℹ️ Ini adalah hari libur nasional dari kalender Indonesia. Data
              ini tidak dapat diubah atau dihapus.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            <RiCloseLine className="mr-2 h-4 w-4" />
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

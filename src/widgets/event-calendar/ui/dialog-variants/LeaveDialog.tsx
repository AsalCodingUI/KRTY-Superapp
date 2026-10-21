"use client"

import { cx } from "@/shared/lib/utils"
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
  RiFileTextLine,
  RiUserLine,
} from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import type { CalendarEvent } from "../types"

interface LeaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent
}

// Extract employee name and leave type from title
const parseLeaveTitle = (title: string) => {
  // Format: "Nama Karyawan - Tipe Cuti" atau "Nama Karyawan • Tipe Cuti"
  const parts = title.includes(" • ") ? title.split(" • ") : title.split(" - ")
  return {
    employeeName: parts[0] || "Tidak diketahui",
    leaveType: parts[1] || "Cuti",
  }
}

// Get badge color based on leave type
const getLeaveTypeColor = (
  leaveType: string,
): "rose" | "orange" | "violet" | "neutral" => {
  if (leaveType.includes("Annual")) return "rose"
  if (leaveType.includes("Sick")) return "orange"
  if (leaveType.includes("WFH") || leaveType.includes("Work From Home"))
    return "violet"
  if (leaveType.includes("Cuti") || leaveType.includes("Leave")) return "rose"
  return "neutral"
}

export function LeaveDialog({ open, onOpenChange, event }: LeaveDialogProps) {
  const { employeeName, leaveType } = parseLeaveTitle(event.title)
  const badgeColor = getLeaveTypeColor(leaveType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[35rem]">
        <DialogHeader>
          <DialogTitle>Detail Cuti</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" color="emerald" className="text-sm">
              Disetujui
            </Badge>
            <Badge variant="secondary" color={badgeColor} className="text-sm">
              {leaveType}
            </Badge>
          </div>

          {/* Employee Name */}
          <div className="space-y-2">
            <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <RiUserLine className="text-muted-foreground h-4 w-4" />
              <span>Karyawan</span>
            </div>
            <div className="text-foreground pl-6 text-sm">{employeeName}</div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
              <RiCalendarLine className="text-muted-foreground h-4 w-4" />
              <span>Periode Cuti</span>
            </div>
            <div className="space-y-1 pl-6">
              <div className="text-foreground flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Mulai:</span>
                <span className="text-sm">
                  {format(event.start, "EEEE, d MMMM yyyy", { locale: id })}
                </span>
              </div>
              <div className="text-foreground flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Selesai:</span>
                <span className="text-sm">
                  {format(event.end, "EEEE, d MMMM yyyy", { locale: id })}
                </span>
              </div>
            </div>
          </div>

          {/* Reason/Description */}
          {event.description && (
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <RiFileTextLine className="text-muted-foreground h-4 w-4" />
                <span>Alasan</span>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

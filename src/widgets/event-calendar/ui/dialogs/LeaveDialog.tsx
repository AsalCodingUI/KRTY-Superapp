"use client"

import { Badge } from "@/components/ui"
import { Button } from "@/components/ui"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui"
import { cx } from "@/shared/lib/utils"
import {
  RiCalendarLine,
  RiCloseLine,
  RiFileTextLine,
  RiUserLine,
} from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import type { CalendarEvent } from "../types"

interface LeaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: CalendarEvent
}

// Extract employee name and leave type from title
const parseLeaveTitle = (title: string) => {
  // Format: "Employee Name - Leave Type"
  const parts = title.split(" - ")
  return {
    employeeName: parts[0] || "Unknown",
    leaveType: parts[1] || "Leave",
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detail Cuti</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <RiCloseLine className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge color="emerald" className="text-body-sm">
              Approved
            </Badge>
            <Badge color={badgeColor} className="text-body-sm">
              {leaveType}
            </Badge>
          </div>

          {/* Employee Name */}
          <div className="space-y-2">
            <div className="text-label-md text-content flex items-center gap-2">
              <RiUserLine className="text-content-subtle h-4 w-4" />
              <span>Karyawan</span>
            </div>
            <div className="text-body-md text-content pl-6">{employeeName}</div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <div className="text-label-md text-content flex items-center gap-2">
              <RiCalendarLine className="text-content-subtle h-4 w-4" />
              <span>Periode Cuti</span>
            </div>
            <div className="space-y-1 pl-6">
              <div className="text-content flex items-center gap-2">
                <span className="text-body-sm text-content-subtle">Mulai:</span>
                <span className="text-body-md">
                  {format(event.start, "EEEE, d MMMM yyyy")}
                </span>
              </div>
              <div className="text-content flex items-center gap-2">
                <span className="text-body-sm text-content-subtle">
                  Selesai:
                </span>
                <span className="text-body-md">
                  {format(event.end, "EEEE, d MMMM yyyy")}
                </span>
              </div>
            </div>
          </div>

          {/* Reason/Description */}
          {event.description && (
            <div className="space-y-2">
              <div className="text-label-md text-content flex items-center gap-2">
                <RiFileTextLine className="text-content-subtle h-4 w-4" />
                <span>Alasan</span>
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
        </div>

        {/* Footer */}
        <div className="border-border flex justify-end border-t pt-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

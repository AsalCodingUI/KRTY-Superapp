"use client"

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui"
import {
  RiArrowDownSLine,
  RiCupLine,
  RiLoginBoxLine,
  RiLogoutBoxLine,
} from "@/shared/ui/lucide-icons"
import { useState } from "react"

interface ClockControlsProps {
  activeSession: {
    id: string
    is_break: boolean | null
  } | null
  isOnLeave: boolean
  loading: boolean
  onClockIn: (status: string) => void
  onClockOut: (logId: string) => void
  onToggleBreak: (logId: string, isBreak: boolean) => void
  onConfirmOpen: (action: "CLOCK_IN" | "CLOCK_OUT", status?: string) => void
}

export function ClockControls({
  activeSession,
  isOnLeave,
  loading,
  onToggleBreak,
  onConfirmOpen,
}: ClockControlsProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(
    isOnLeave ? "Cuti Masuk" : "Present",
  )

  const getStatusLabel = (val: string) => {
    if (val === "Present") return "Available"
    return val
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {!activeSession ? (
        <>
          {/* DROPDOWN STATUS */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button asChild size="sm" variant="secondary" type="button">
                <button>
                  {getStatusLabel(selectedStatus)}
                  <RiArrowDownSLine className="text-content-subtle ml-2 size-4 shrink-0" />
                </button>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setSelectedStatus("Present")}>
                Available
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("Lembur")}>
                Lembur
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("Cuti Masuk")}>
                Cuti Masuk
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            size="sm"
            onClick={() => onConfirmOpen("CLOCK_IN", selectedStatus)}
            disabled={loading}
          >
            <RiLoginBoxLine className="mr-2 size-4" /> Clock In
          </Button>
        </>
      ) : (
        <>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onConfirmOpen("CLOCK_OUT")}
            disabled={loading}
          >
            <RiLogoutBoxLine className="mr-2 size-4" /> Clock Out
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              onToggleBreak(activeSession.id, activeSession.is_break || false)
            }
            disabled={loading}
          >
            <RiCupLine className="mr-2 size-4" />
            {activeSession.is_break ? "End Break" : "Break"}
          </Button>
        </>
      )}
    </div>
  )
}

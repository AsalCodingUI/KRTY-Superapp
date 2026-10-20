"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

interface ClockConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: "CLOCK_IN" | "CLOCK_OUT" | null
  status?: string
  loading: boolean
  onConfirm: () => void
}

export function ClockConfirmDialog({
  open,
  onOpenChange,
  action,
  status,
  loading,
  onConfirm,
}: ClockConfirmDialogProps) {
  const getStatusLabel = (val: string) => {
    if (val === "Present") return "Available"
    return val
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {action === "CLOCK_IN" ? "Confirm Clock In" : "Confirm Clock Out"}
          </DialogTitle>
        </DialogHeader>
        <div>
          <p className="text-body-sm text-muted-foreground">
            {action === "CLOCK_IN"
              ? `Anda akan masuk dengan status: ${getStatusLabel(status || "Present")}. Lanjutkan?`
              : "Apakah Anda yakin ingin mengakhiri sesi kerja ini?"}
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button size="sm" variant="outline" className="w-full sm:w-fit">
              Cancel
            </Button>
          </DialogClose>
          <Button
            size="sm"
            disabled={loading}
            onClick={onConfirm}
            className="w-full sm:w-fit"
          >
            {loading && <Spinner data-icon="inline-start" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

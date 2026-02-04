"use client"

import { RiCloseLine } from "@remixicon/react"
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui"

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
        <DialogClose asChild>
          <Button
            className="!text-content-placeholder hover:text-content-subtle dark:!text-content-subtle hover:dark:text-content-subtle absolute top-3 right-3 p-2"
            variant="ghost"
            aria-label="close"
          >
            <RiCloseLine className="size-5 shrink-0" />
          </Button>
        </DialogClose>
        <DialogHeader>
          <DialogTitle>
            {action === "CLOCK_IN" ? "Confirm Clock In" : "Confirm Clock Out"}
          </DialogTitle>
          <DialogDescription className="mt-2">
            {action === "CLOCK_IN"
              ? `Anda akan masuk dengan status: ${getStatusLabel(status || "Present")}. Lanjutkan?`
              : "Apakah Anda yakin ingin mengakhiri sesi kerja ini?"}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="secondary" className="w-full sm:w-fit">
              Cancel
            </Button>
          </DialogClose>
          <Button
            isLoading={loading}
            onClick={onConfirm}
            className="w-full sm:w-fit"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

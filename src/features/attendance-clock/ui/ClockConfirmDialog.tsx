"use client"

import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
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
        <DialogHeader>
          <DialogTitle>
            {action === "CLOCK_IN" ? "Confirm Clock In" : "Confirm Clock Out"}
          </DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <DialogBody>
          <p className="text-body-sm text-foreground-secondary">
            {action === "CLOCK_IN"
              ? `Anda akan masuk dengan status: ${getStatusLabel(status || "Present")}. Lanjutkan?`
              : "Apakah Anda yakin ingin mengakhiri sesi kerja ini?"}
          </p>
        </DialogBody>
        <DialogFooter>
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

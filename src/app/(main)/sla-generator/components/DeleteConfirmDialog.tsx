import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui"
import { RiErrorWarningLine } from "@remixicon/react"

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete SLA",
  description = "Are you sure you want to delete this SLA? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
}: DeleteConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="flex items-start gap-4">
          <div className="rounded-tremor-full bg-danger-subtle flex h-10 w-10 items-center justify-center">
            <RiErrorWarningLine className="text-danger h-5 w-5" />
          </div>
          <div className="flex-1">
            <DialogTitle className="mb-2">{title}</DialogTitle>
            <p className="text-tremor-content-subtle text-body-sm">
              {description}
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

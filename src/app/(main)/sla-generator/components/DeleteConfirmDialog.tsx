import {
  Button,
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui"
import { RiErrorWarningLine } from "@/shared/ui/lucide-icons"

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
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>
        <DialogBody>
          <div className="flex items-start gap-4">
            <div className="bg-surface-danger-light text-foreground-danger flex h-10 w-10 items-center justify-center rounded-full">
              <RiErrorWarningLine className="size-5" />
            </div>
            <p className="text-body-sm text-foreground-secondary">{description}</p>
          </div>
        </DialogBody>
        <DialogFooter>
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

"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useT } from "@/shared/i18n/client"
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
  title,
  description,
  confirmText,
  cancelText,
}: DeleteConfirmDialogProps) {
  const t = useT("sla")
  const tc = useT("common")
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title ?? t("deleteDefaultTitle")}</DialogTitle>
        </DialogHeader>
        <div>
          <div className="flex items-start gap-4">
            <div className="bg-destructive/10 text-destructive flex h-10 w-10 items-center justify-center rounded-full">
              <RiErrorWarningLine className="size-5" />
            </div>
            <p className="text-muted-foreground text-sm">
              {description ?? t("deleteDefaultDescription")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {cancelText ?? tc("cancel")}
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            {confirmText ?? tc("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

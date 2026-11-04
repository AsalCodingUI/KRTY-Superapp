"use client"

import * as React from "react"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useT } from "@/shared/i18n/client"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  const t = useT("shell")
  const tc = useT("common")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const isBusy = isSubmitting || loading

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error("Confirm action failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? t("confirmTitle")}</AlertDialogTitle>
          {/* Only when it adds something (a consequence); no filler default. */}
          {description && (
            <AlertDialogDescription className="text-sm">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* Plain Buttons (not AlertDialogAction/Cancel) so the dialog stays
              open while an async onConfirm is running. */}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
          >
            {cancelText ?? tc("cancel")}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isBusy}
          >
            {isBusy && <Spinner data-icon="inline-start" />}
            {confirmText ?? t("confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

type ConfirmOptions = Omit<ConfirmDialogProps, "open" | "onOpenChange">

// Hook for imperative usage
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<ConfirmOptions | null>(null)
  // The pending promise's resolver: true on confirm, false on cancel / close.
  const settle = React.useRef<((ok: boolean) => void) | null>(null)

  const confirm = (options: ConfirmOptions) => {
    settle.current?.(false)
    return new Promise<boolean>((resolve) => {
      settle.current = (ok) => {
        settle.current = null
        resolve(ok)
      }
      setConfig({
        ...options,
        onConfirm: async () => {
          await options.onConfirm()
          settle.current?.(true)
          setIsOpen(false)
        },
      })
      setIsOpen(true)
    })
  }

  const ConfirmDialogComponent = config ? (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          settle.current?.(false)
          setConfig(null)
        }
      }}
      {...config}
    />
  ) : null

  return { confirm, ConfirmDialog: ConfirmDialogComponent }
}

export type { ConfirmDialogProps }

"use client"

import {
    Button,
    Dialog,
    DialogBody,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui"
import { RiErrorWarningLine } from "@/shared/ui/lucide-icons"
import { useState } from "react"

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
    title = "Confirm Action",
    description = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
    loading = false,
}: ConfirmDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${variant === "destructive"
                                    ? "bg-surface-danger-secondary"
                                    : "bg-surface-warning-secondary"
                                }`}
                        >
                            <RiErrorWarningLine
                                className={`size-5 ${variant === "destructive"
                                        ? "text-foreground-danger"
                                        : "text-foreground-warning"
                                    }`}
                            />
                        </div>
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                </DialogHeader>

                <DialogBody>
                    <p className="text-body-sm text-foreground-secondary">
                        {description}
                    </p>
                </DialogBody>

                <DialogFooter>
                    <Button
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting || loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === "destructive" ? "destructive" : "primary"}
                        onClick={handleConfirm}
                        disabled={isSubmitting || loading}
                        isLoading={isSubmitting || loading}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Hook untuk easier usage
export function useConfirmDialog() {
    const [isOpen, setIsOpen] = useState(false)
    const [config, setConfig] = useState<Omit<
        ConfirmDialogProps,
        "open" | "onOpenChange"
    > | null>(null)

    const confirm = (
        options: Omit<ConfirmDialogProps, "open" | "onOpenChange">,
    ) => {
        return new Promise<boolean>((resolve) => {
            setConfig({
                ...options,
                onConfirm: async () => {
                    await options.onConfirm()
                    resolve(true)
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
                if (!open) setConfig(null)
            }}
            {...config}
        />
    ) : null

    return { confirm, ConfirmDialog: ConfirmDialogComponent }
}

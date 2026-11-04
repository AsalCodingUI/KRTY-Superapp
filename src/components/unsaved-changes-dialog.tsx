"use client"

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

/**
 * Closing an editor with unsaved edits: Cancel / Don't save / Save
 * (overlay.md). Cancel just closes this prompt; `onDiscard` and `onSave`
 * decide what happens to the editor (the caller closes it).
 */
export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onDiscard,
  onSave,
  saving = false,
  saveDisabled = false,
  title,
  description,
  cancelText,
  discardText,
  saveText,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDiscard: () => void
  onSave: () => void | Promise<unknown>
  /** The save is running: Save shows a spinner and is disabled. */
  saving?: boolean
  saveDisabled?: boolean
  title?: string
  description?: string
  cancelText?: string
  discardText?: string
  saveText?: string
}) {
  const tc = useT("common")
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? tc("unsavedTitle")}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelText ?? tc("cancel")}
          </Button>
          <Button variant="outline" onClick={onDiscard}>
            {discardText ?? tc("dontSave")}
          </Button>
          <Button disabled={saving || saveDisabled} onClick={() => onSave()}>
            {saving && <Spinner data-icon="inline-start" />}
            {saveText ?? tc("save")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

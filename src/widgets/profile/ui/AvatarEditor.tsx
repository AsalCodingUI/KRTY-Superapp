"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useT } from "@/shared/i18n/client"
import { cx } from "@/shared/lib/utils"
import { RiDeleteBinLine, RiUploadLine } from "@/shared/ui/lucide-icons"
import { useRef, useState } from "react"
import { toast } from "sonner"
import {
  AVATAR_TYPES,
  avatarFileProblem,
  removeAvatar,
  uploadAvatar,
  useAvatarChanged,
} from "../model/avatar"
import { AvatarCropDialog } from "./AvatarCropDialog"

/**
 * A person's picture with "Change photo" (pick → square crop → upload) and
 * "Remove photo" (back to the initial). Used in My profile and on the Team
 * page's member sheet.
 */
export function AvatarEditor({
  profileId,
  name,
  avatarUrl,
  onChanged,
  compact = false,
  children,
  className,
}: {
  profileId: string
  name: string
  avatarUrl: string | null
  /** The new URL (null when removed), after it's saved. */
  onChanged?: (url: string | null) => void
  /** Only the buttons (the picture is shown elsewhere). */
  compact?: boolean
  /** Shown above the buttons, next to the picture (name, email). */
  children?: React.ReactNode
  className?: string
}) {
  const t = useT("profile")
  const tc = useT("common")
  const changed = useAvatarChanged()
  const input = useRef<HTMLInputElement>(null)
  const [picked, setPicked] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const pick = (file: File | undefined) => {
    if (!file) return
    const problem = avatarFileProblem(file)
    if (problem === "type") return void toast.error(t("photoWrongType"))
    if (problem === "size") return void toast.error(t("photoTooBig"))
    setPicked(file)
  }

  const save = async (picture: Blob) => {
    setSaving(true)
    try {
      const url = await uploadAvatar(profileId, picture)
      onChanged?.(url)
      changed()
      toast.success(t("photoSaved"))
      setPicked(null)
    } catch {
      toast.error(t("photoSaveFailed"))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    try {
      await removeAvatar(profileId)
      onChanged?.(null)
      changed()
      toast.success(t("photoRemoved"))
    } catch (err) {
      toast.error(t("photoRemoveFailed"))
      throw err
    }
  }

  return (
    <div className={cx("flex items-center gap-4", className)}>
      {!compact && (
        <Avatar className="size-20 shrink-0">
          <AvatarImage src={avatarUrl || undefined} alt={name} />
          <AvatarFallback>{name || "?"}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {children}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => input.current?.click()}
          >
            <RiUploadLine data-icon="inline-start" />
            {avatarUrl ? t("changePhoto") : t("uploadPhoto")}
          </Button>
          {avatarUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              disabled={saving}
              onClick={() => setConfirmRemove(true)}
            >
              <RiDeleteBinLine data-icon="inline-start" />
              {t("removePhoto")}
            </Button>
          )}
        </div>
        {!compact && (
          <p className="text-tertiary-foreground text-xs">{t("photoHint")}</p>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={AVATAR_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0])
          // The same file again still fires a change.
          e.target.value = ""
        }}
      />
      <AvatarCropDialog
        file={picked}
        saving={saving}
        onCancel={() => setPicked(null)}
        onConfirm={save}
        onUnreadable={() => {
          setPicked(null)
          toast.error(t("photoUnreadable"))
        }}
      />
      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={t("removePhotoTitle")}
        description={t("removePhotoDescription")}
        confirmText={t("removePhoto")}
        cancelText={tc("cancel")}
        variant="destructive"
        onConfirm={remove}
      />
    </div>
  )
}

"use client"

import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useLatestMacRelease } from "@/shared/hooks/useMacApp"
import { useT } from "@/shared/i18n/client"
import {
  downloadMacRelease,
  invokeApp,
  tauri,
  type MacRelease,
} from "@/shared/lib/desktop-app"
import { Download } from "@/components/icons"
import { useCallback, useState } from "react"
import { toast } from "sonner"

type Mode = "install" | "update"

/**
 * Downloading Kretya Flow: starts the .dmg (or Windows installer) download and shows the three
 * steps that follow (install from the web, update from inside the app).
 * Returns `start` plus the dialog to render once.
 */
export function useMacDownload() {
  const t = useT("desktopApp")
  const { refetch } = useLatestMacRelease(false)
  const [shown, setShown] = useState<{
    release: MacRelease
    mode: Mode
  } | null>(null)
  const [busy, setBusy] = useState(false)

  const start = useCallback(
    async (mode: Mode, release?: MacRelease | null) => {
      setBusy(true)
      const target = release ?? (await refetch()).data ?? null
      if (!target) {
        setBusy(false)
        return void toast(t("noRelease"))
      }
      const ok = await downloadMacRelease(target)
      setBusy(false)
      if (!ok) return void toast.error(t("downloadFailed"))
      setShown({ release: target, mode })
    },
    [refetch, t],
  )

  const dialog = (
    <MacHowToDialog
      shown={shown}
      busy={busy}
      onAgain={() => shown && void start(shown.mode, shown.release)}
      onClose={() => setShown(null)}
    />
  )
  return { start, busy, dialog }
}

function MacHowToDialog({
  shown,
  busy,
  onAgain,
  onClose,
}: {
  shown: { release: MacRelease; mode: Mode } | null
  busy: boolean
  onAgain: () => void
  onClose: () => void
}) {
  const t = useT("desktopApp")
  const update = shown?.mode === "update"
  const version = shown?.release.version ?? ""
  const win = shown?.release.platform === "windows"
  const steps = win
    ? update
      ? [
          t("howUpdateStep1Windows"),
          t("howUpdateStep2Windows"),
          t("howUpdateStep3Windows"),
        ]
      : [
          t("howInstallStep1Windows"),
          t("howInstallStep2Windows"),
          t("howInstallStep3Windows"),
        ]
    : update
      ? [t("howUpdateStep1"), t("howUpdateStep2"), t("howUpdateStep3")]
      : [t("howInstallStep1"), t("howInstallStep2"), t("howInstallStep3")]

  const openNotes = () => {
    if (!shown) return
    // No release post yet: the "Yang baru" guides instead.
    const path = shown.release.slug
      ? `/policies?policy=${encodeURIComponent(shown.release.slug)}`
      : "/whats-new"
    onClose()
    if (tauri()) void invokeApp("open_in_app", { path })
    else window.location.href = path
  }

  return (
    <Dialog open={Boolean(shown)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <AppIcon size={192} className="squircle-mask mb-2 size-12" />
          <DialogTitle>
            {update ? t("howUpdateTitle") : t("howInstallTitle")}
          </DialogTitle>
          <DialogDescription>
            {update
              ? t("howUpdateDescription", { version })
              : t("howInstallDescription", { version })}
          </DialogDescription>
        </DialogHeader>
        <ol className="flex flex-col gap-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="bg-muted text-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <DialogFooter>
          <Button variant="ghost" disabled={busy} onClick={onAgain}>
            {busy ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <Download data-icon="inline-start" />
            )}
            {t("downloadAgain")}
          </Button>
          {update && (
            <Button variant="outline" onClick={openNotes}>
              {t("seeWhatsNew")}
            </Button>
          )}
          <Button onClick={onClose}>{t("gotIt")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

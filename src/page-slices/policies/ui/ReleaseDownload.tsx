"use client"

import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { formatBytes } from "@/page-slices/projects/ui/workspace/data"
import { createClient } from "@/shared/api/supabase/client"
import { useT } from "@/shared/i18n/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Download, Upload } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"

const BUCKET = "app-releases"

/** Where a version's Mac download lives (one universal .dmg per version). */
const folderOf = (version: string) => `kretya-flow/${version}`
const fileOf = (version: string) => `Kretya-Flow-${version}-universal.dmg`

type TauriGlobal = {
  core: {
    invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
  }
}

/**
 * On an app update (Aturan & Update, "Update aplikasi"): the download for
 * the version named in its title, and for admins the upload. Inside
 * Kretya Flow the download opens in the browser (the app's window can't
 * save files).
 */
export function ReleaseDownload({
  title,
  isAdmin,
}: {
  title: string
  isAdmin: boolean
}) {
  const t = useT("policies")
  const queryClient = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<"download" | "upload" | null>(null)
  const version = title.match(/\d+\.\d+\.\d+/)?.[0]

  const key = ["app-release", version] as const
  const { data: file, isPending } = useQuery({
    queryKey: key,
    enabled: Boolean(version),
    queryFn: async () => {
      const { data } = await createClient()
        .storage.from(BUCKET)
        .list(folderOf(version!), { search: fileOf(version!) })
      const found = data?.find(
        (f: { name: string }) => f.name === fileOf(version!),
      ) as { name: string; metadata?: Record<string, unknown> } | undefined
      return found
        ? { size: (found.metadata?.size as number | undefined) ?? null }
        : null
    },
  })

  if (!version)
    return isAdmin ? (
      <p className="text-muted-foreground mt-6 text-sm">
        {t("releaseNoVersion")}
      </p>
    ) : null

  const download = async () => {
    setBusy("download")
    const { data, error } = await createClient()
      .storage.from(BUCKET)
      .createSignedUrl(`${folderOf(version)}/${fileOf(version)}`, 600, {
        download: fileOf(version),
      })
    setBusy(null)
    if (error || !data) return void toast.error(t("releaseDownloadFailed"))
    const tauri = (window as unknown as { __TAURI__?: TauriGlobal }).__TAURI__
    if (tauri) void tauri.core.invoke("open_external", { url: data.signedUrl })
    else window.location.href = data.signedUrl
  }

  const upload = async (picked: File) => {
    setBusy("upload")
    const { error } = await createClient()
      .storage.from(BUCKET)
      .upload(`${folderOf(version)}/${fileOf(version)}`, picked, {
        upsert: true,
        contentType: "application/x-apple-diskimage",
      })
    setBusy(null)
    if (error) return void toast.error(t("releaseUploadFailed"))
    toast.success(t("releaseUploaded"))
    void queryClient.invalidateQueries({ queryKey: key })
  }

  if (!file && !isAdmin && !isPending) return null

  return (
    <div className="border-border mt-8 flex items-center gap-4 rounded-2xl border p-4">
      <AppIcon size={192} className="squircle-mask size-11 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {t("releaseName", { version })}
        </p>
        <p className="text-muted-foreground truncate text-[13px]">
          {isPending
            ? "…"
            : file
              ? [t("releaseFor"), formatBytes(file.size)]
                  .filter(Boolean)
                  .join(" · ")
              : t("releaseNoFile")}
        </p>
      </div>
      {isAdmin && (
        <>
          <input
            ref={input}
            type="file"
            accept=".dmg"
            hidden
            onChange={(e) => {
              const picked = e.target.files?.[0]
              e.target.value = ""
              if (picked) void upload(picked)
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            disabled={busy !== null}
            onClick={() => input.current?.click()}
          >
            {busy === "upload" ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <Upload data-icon="inline-start" />
            )}
            {file ? t("releaseReplace") : t("releaseUpload")}
          </Button>
        </>
      )}
      {file && (
        <Button size="sm" disabled={busy !== null} onClick={download}>
          {busy === "download" ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Download data-icon="inline-start" />
          )}
          {t("releaseDownload")}
        </Button>
      )}
    </div>
  )
}

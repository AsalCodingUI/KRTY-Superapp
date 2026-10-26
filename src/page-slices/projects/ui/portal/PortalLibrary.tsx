"use client"

import type { ViewerItem } from "@/components/file-viewer"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { RiFolderLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import dynamic from "next/dynamic"
import { useMemo, useState } from "react"
import { formatBytes } from "../workspace/data"
import { FilePreview } from "../workspace/FilePreview"
import { FolderIcon, Section } from "../workspace/ProjectLibrary"

const FileViewer = dynamic(
  () => import("@/components/file-viewer").then((m) => m.FileViewer),
  { ssr: false },
)

export type PortalFolder = { id: string; name: string }
export type PortalFile = {
  id: string
  name: string
  mime_type: string | null
  file_size: number | null
  folder_id: string | null
  created_at: string
}

/**
 * The library as the client sees it: the team's folders and file cards,
 * minus internal folders, read-only. Files load through the portal's own
 * file route (it checks the session and the folder).
 */
export function PortalLibrary({
  assetBase,
  folders,
  files,
}: {
  /** The portal's link without the name (/p/<token>): file routes. */
  assetBase: string
  folders: PortalFolder[]
  files: PortalFile[]
}) {
  const t = useT("projects")
  const dateLocale = useDateLocale()
  const [folderId, setFolderId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<number | null>(null)
  const folder = folders.find((f) => f.id === folderId) ?? null
  const shown = files.filter((f) => f.folder_id === (folder?.id ?? null))
  const fileUrl = (id: string) => `${assetBase}/file/${id}`

  const viewerItems: ViewerItem[] = useMemo(
    () =>
      shown.map((f) => ({
        key: f.id,
        name: f.name,
        mime: f.mime_type,
        meta: `${formatBytes(f.file_size)} · ${format(new Date(f.created_at), "d MMM yyyy", { locale: dateLocale })}`,
        getUrl: async () => fileUrl(f.id),
        getDownloadUrl: async () => `${fileUrl(f.id)}?download=1`,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shown.map((f) => f.id).join(), dateLocale],
  )

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        title={folder ? folder.name : t("sectionLibrary")}
        back={
          folder
            ? { onClick: () => setFolderId(null), label: t("sectionLibrary") }
            : undefined
        }
      />
      {shown.length === 0 && (folder || folders.length === 0) ? (
        <EmptyState
          title={t("portalNoFiles")}
          icon={<RiFolderLine className="size-5" />}
          placement="inner"
        />
      ) : (
        <div className="flex flex-col gap-8 pt-2 pb-4">
          {!folder && folders.length > 0 && (
            <Section title={t("libFolders")}>
              <div className="grid grid-cols-1 gap-2 pb-1 sm:grid-cols-2 lg:grid-cols-3">
                {folders.map((f) => {
                  const count = files.filter((x) => x.folder_id === f.id).length
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFolderId(f.id)}
                      className="hover:bg-muted/60 focus-visible:ring-focus-ring nest-rounded-xl nest-p-2 flex items-center gap-3 text-left transition-colors outline-none focus-visible:ring-2"
                    >
                      <FolderIcon className="h-8 w-10 shrink-0" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm" title={f.name}>
                          {f.name}
                        </span>
                        <span className="text-tertiary-foreground text-[13px]">
                          {count
                            ? t("libFileCount", { n: count })
                            : t("libFolderEmptyShort")}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </Section>
          )}

          {shown.length > 0 && (
            <Section title={t("libFiles")}>
              <div className="grid grid-cols-2 gap-x-3 gap-y-5 pb-1 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-3 xl:grid-cols-4">
                {shown.map((file, i) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => setViewing(i)}
                    className="group/row focus-visible:ring-focus-ring flex min-w-0 flex-col gap-2 rounded-xl text-left outline-none focus-visible:ring-2"
                  >
                    <FilePreview
                      file={{ ...file, file_path: file.id }}
                      url={fileUrl(file.id)}
                      className="ring-border/60 w-full rounded-xl ring-1 transition-[filter] duration-150 group-hover/row:brightness-95"
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-tertiary-foreground text-[13px] tabular-nums">
                        {formatBytes(file.file_size)} ·{" "}
                        {format(new Date(file.created_at), "d MMM yyyy", {
                          locale: dateLocale,
                        })}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      <FileViewer
        items={viewerItems}
        index={viewing}
        onIndexChange={setViewing}
        onClose={() => setViewing(null)}
      />
    </div>
  )
}

"use client"

import { EmptyState } from "@/components/empty-state"
import type { ViewerItem } from "@/components/file-viewer"
import { PageHeader } from "@/components/page-header"
import { cn } from "@/lib/utils"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { RiFileTextLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import dynamic from "next/dynamic"
import { useMemo, useState } from "react"
import { formatBytes } from "../workspace/data"
import { Chip, FilePreview } from "../workspace/FilePreview"
import {
  KINDS,
  STATUSES,
  type Kind,
  type Status,
} from "../workspace/ProjectDocuments"
import { Section } from "../workspace/ProjectLibrary"

const FileViewer = dynamic(
  () => import("@/components/file-viewer").then((m) => m.FileViewer),
  { ssr: false },
)

export type PortalDocument = {
  id: string
  kind: string
  title: string
  status: string
  file_name: string | null
  file_size: number | null
  updated_at: string
}

/** The project's documents as the team sees them, grouped by kind, read-only. */
export function PortalDocuments({
  assetBase,
  documents,
}: {
  /** The portal's link without the name (/p/<token>): file routes. */
  assetBase: string
  documents: PortalDocument[]
}) {
  const t = useT("projects")
  const dateLocale = useDateLocale()
  const [viewing, setViewing] = useState<number | null>(null)
  const kindOf = (d: PortalDocument): Kind =>
    d.kind in KINDS ? (d.kind as Kind) : "other"
  // Viewer order follows the grouped grid.
  const ordered = (Object.keys(KINDS) as Kind[]).flatMap((k) =>
    documents.filter((d) => kindOf(d) === k),
  )
  const docUrl = (id: string) => `${assetBase}/doc/${id}`

  const viewerItems: ViewerItem[] = useMemo(
    () =>
      ordered.map((d) => ({
        key: d.id,
        name: d.file_name ?? d.title,
        meta: `${formatBytes(d.file_size)} · ${format(new Date(d.updated_at), "d MMM yyyy", { locale: dateLocale })}`,
        getUrl: async () => docUrl(d.id),
        getDownloadUrl: async () => `${docUrl(d.id)}?download=1`,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [documents, dateLocale],
  )

  return (
    <div className="flex flex-col">
      <PageHeader className="pt-6 pb-4" title={t("sectionDocuments")} />
      {documents.length === 0 ? (
        <EmptyState
          title={t("docsEmptyTitle")}
          icon={<RiFileTextLine className="size-5" />}
          placement="inner"
        />
      ) : (
        <div className="flex flex-col gap-8 pt-2 pb-4">
          {(Object.keys(KINDS) as Kind[]).map((kindKey) => {
            const items = ordered.filter((d) => kindOf(d) === kindKey)
            if (!items.length) return null
            return (
              <Section key={kindKey} title={t(KINDS[kindKey].labelKey)}>
                <div className="grid grid-cols-2 gap-x-3 gap-y-5 pb-1 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((doc) => {
                    const status =
                      STATUSES[doc.status as Status] ?? STATUSES.sent
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setViewing(ordered.indexOf(doc))}
                        className="group/row focus-visible:ring-focus-ring flex min-w-0 flex-col gap-2 rounded-xl text-left outline-none focus-visible:ring-2"
                      >
                        <FilePreview
                          file={{
                            name: doc.file_name ?? doc.title,
                            mime_type: null,
                            file_path: doc.id,
                          }}
                          url={docUrl(doc.id)}
                          badge={
                            <Chip className="static flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "size-1.5 rounded-full",
                                  status.dot,
                                )}
                              />
                              {t(status.labelKey)}
                            </Chip>
                          }
                          className="ring-border/60 w-full rounded-xl ring-1 transition-[filter] duration-150 group-hover/row:brightness-95"
                        />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-sm" title={doc.title}>
                            {doc.title}
                          </span>
                          <span className="text-tertiary-foreground truncate text-[13px] tabular-nums">
                            {doc.file_name
                              ? `${formatBytes(doc.file_size)} · `
                              : ""}
                            {format(new Date(doc.updated_at), "d MMM yyyy", {
                              locale: dateLocale,
                            })}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </Section>
            )
          })}
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

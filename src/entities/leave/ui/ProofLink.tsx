"use client"

import { FileViewer } from "@/components/file-viewer"
import { cn } from "@/lib/utils"
import { createClient } from "@/shared/api/supabase/client"
import { useT } from "@/shared/i18n/client"
import { RiFilePaperLine } from "@/shared/ui/lucide-icons"
import { useState } from "react"

export const PROOF_BUCKET = "leave-proofs"

/**
 * `proof_url` holds either a path in the private leave-proofs bucket (new),
 * an old public-URL to that bucket (never opened: the bucket is private), or
 * an outside link a stakeholder typed (Drive, etc.). Returns the storage
 * path, or null for outside links.
 */
export function proofStoragePath(value: string) {
  const marker = `/storage/v1/object/public/${PROOF_BUCKET}/`
  const at = value.indexOf(marker)
  if (at >= 0) return decodeURIComponent(value.slice(at + marker.length))
  if (/^https?:\/\//i.test(value)) return null
  return value
}

/**
 * "Bukti" link on a leave request: stored files open in the viewer (photo or
 * PDF), outside links in a new tab.
 */
export function ProofLink({
  value,
  iconOnly = false,
  className,
}: {
  value: string
  iconOnly?: boolean
  className?: string
}) {
  const t = useT("leave")
  const [open, setOpen] = useState(false)
  const path = proofStoragePath(value)
  const name = path ? path.slice(path.lastIndexOf("/") + 1) : value

  const signed = async (download?: string) => {
    const { data, error } = await createClient()
      .storage.from(PROOF_BUCKET)
      .createSignedUrl(path!, 60 * 60, download ? { download } : undefined)
    if (error || !data) throw error ?? new Error("no url")
    return data.signedUrl
  }

  const label = (
    <>
      <RiFilePaperLine className="size-3.5" />
      {!iconOnly && t("proof")}
    </>
  )
  const classes = cn(
    "text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 transition-colors",
    className,
  )

  if (!path)
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        title={t("viewProof")}
        aria-label={iconOnly ? t("viewProof") : undefined}
        onClick={(e) => e.stopPropagation()}
        className={classes}
      >
        {label}
      </a>
    )

  return (
    <>
      <button
        type="button"
        title={t("viewProof")}
        aria-label={iconOnly ? t("viewProof") : undefined}
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className={classes}
      >
        {label}
      </button>
      {open && (
        <span onClick={(e) => e.stopPropagation()}>
          <FileViewer
            items={[
              {
                key: path,
                name,
                getUrl: () => signed(),
                getDownloadUrl: () => signed(name),
              },
            ]}
            index={0}
            onIndexChange={() => {}}
            onClose={() => setOpen(false)}
          />
        </span>
      )}
    </>
  )
}

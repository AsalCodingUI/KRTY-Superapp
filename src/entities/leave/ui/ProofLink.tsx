"use client"

import { cn } from "@/lib/utils"
import { createClient } from "@/shared/api/supabase/client"
import { useT } from "@/shared/i18n/client"
import { RiFilePaperLine } from "@/shared/ui/lucide-icons"
import dynamic from "next/dynamic"
import { useCallback, useState } from "react"

// Viewer (PDF / office renderers) only loads when a proof is opened.
const FileViewer = dynamic(
  () => import("@/components/file-viewer").then((m) => m.FileViewer),
  { ssr: false },
)

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

/** The proof's viewer (stored file), rendered while open. */
function ProofViewer({
  value,
  onClose,
}: {
  value: string
  onClose: () => void
}) {
  const path = proofStoragePath(value)
  if (!path) return null
  const name = path.slice(path.lastIndexOf("/") + 1)
  const signed = async (download?: string) => {
    const { data, error } = await createClient()
      .storage.from(PROOF_BUCKET)
      .createSignedUrl(path, 60 * 60, download ? { download } : undefined)
    if (error || !data) throw error ?? new Error("no url")
    return data.signedUrl
  }
  return (
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
        onClose={onClose}
      />
    </span>
  )
}

/**
 * Opens a proof from anywhere (a right-click "Lihat bukti"): stored files
 * in the viewer, outside links in a new tab. Render `viewer` once.
 */
export function useProofViewer() {
  const [value, setValue] = useState<string | null>(null)
  const open = useCallback((proof: string) => {
    if (proofStoragePath(proof)) setValue(proof)
    else window.open(proof, "_blank", "noopener,noreferrer")
  }, [])
  const viewer = value ? (
    <ProofViewer value={value} onClose={() => setValue(null)} />
  ) : null
  return { open, viewer }
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
      {open && <ProofViewer value={value} onClose={() => setOpen(false)} />}
    </>
  )
}

"use client"

import {
  deletePolicy,
  discardPolicyDraft,
  setPolicyArchived,
} from "@/app/(main)/policies/actions/policy-actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { ListChip } from "@/components/grouped-list"
import { Markdown } from "@/components/markdown"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import {
  RiBookOpenLine,
  RiCloseLine,
  RiFileTextLine,
  RiMoreFill,
  RiPencilLine,
} from "@/shared/ui/lucide-icons"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useState } from "react"
import { toast } from "sonner"
import {
  policyKeys,
  splitVersions,
  usePolicy,
  type PolicyVersion,
} from "../model/data"
import { PolicyHistory } from "./PolicyHistory"
import { PublishDialog } from "./PublishDialog"

function day(value: string | null) {
  return value
    ? format(new Date(value), "d MMM yyyy", { locale: idLocale })
    : ""
}

/**
 * A rule opened from the list, as a large reading modal (Attio/Fabric
 * notes): the version in force or an older one, history at the bottom.
 */
export function PolicyDialog({
  id,
  version: requested,
  onVersion,
  onEdit,
  onClose,
}: {
  id: string
  /** version_number, "draft", or null for the version in force */
  version: string | null
  onVersion: (version: string | null) => void
  onEdit: () => void
  onClose: () => void
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        bare
        showCloseButton={false}
        className="flex h-[min(56rem,92svh)] w-full flex-col overflow-hidden p-0 sm:max-w-5xl"
      >
        <PolicyView
          id={id}
          requested={requested}
          onVersion={onVersion}
          onEdit={onEdit}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}

function PolicyView({
  id,
  requested,
  onVersion,
  onEdit,
  onClose,
}: {
  id: string
  requested: string | null
  onVersion: (version: string | null) => void
  onEdit: () => void
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const { profile } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const { data: policy, isLoading } = usePolicy(id)
  const [publishing, setPublishing] = useState(false)
  const [confirm, setConfirm] = useState<"delete" | "discard" | null>(null)

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: policyKeys.all })

  // Employees only read published, live rules (RLS; this also covers "view as").
  const hidden =
    !isAdmin && (!policy?.current_version_id || Boolean(policy?.archived_at))

  const split = splitVersions(policy?.versions ?? [])
  const { published, latest } = split
  const draft = isAdmin ? split.draft : null
  const version: PolicyVersion | null =
    requested === "draft" && draft
      ? draft
      : (published.find((v) => v.version_number === requested) ??
        latest ??
        draft)
  const isOld = Boolean(
    latest && version?.status === "Published" && version.id !== latest.id,
  )
  const isDraft = version?.status === "Draft"
  const title = version?.title ?? policy?.title ?? "Aturan"

  const toggleArchive = async () => {
    if (!policy) return
    const archived = !policy.archived_at
    const result = await setPolicyArchived(id, archived)
    if (!result.success) return toast.error(result.error)
    toast.success(archived ? "Aturan diarsipkan" : "Aturan dipulihkan")
    refresh()
  }

  return (
    <>
      <header className="border-border flex h-14 shrink-0 items-center gap-2 border-b pr-3 pl-5">
        <RiBookOpenLine className="text-muted-foreground size-4 shrink-0" />
        <DialogTitle className="text-muted-foreground min-w-0 truncate text-sm font-normal">
          {policy ? `${policy.category} / ${title}` : "Aturan"}
        </DialogTitle>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {isAdmin && policy && (
            <>
              {draft && (
                <Button size="sm" onClick={() => setPublishing(true)}>
                  Terbitkan
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onEdit}>
                <RiPencilLine data-icon="inline-start" />
                {draft ? "Lanjutkan draf" : "Edit"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Aksi aturan"
                      className="text-muted-foreground"
                    />
                  }
                >
                  <RiMoreFill />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-44">
                  {draft && latest && (
                    <DropdownMenuItem onClick={() => setConfirm("discard")}>
                      Buang draf
                    </DropdownMenuItem>
                  )}
                  {latest && (
                    <DropdownMenuItem onClick={toggleArchive}>
                      {policy.archived_at ? "Pulihkan" : "Arsipkan"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setConfirm("delete")}
                  >
                    Hapus aturan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Tutup"
            className="text-muted-foreground"
            onClick={onClose}
          >
            <RiCloseLine />
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Spinner className="size-6" />
          </div>
        ) : !policy || hidden ? (
          <EmptyState
            placement="inner"
            className="py-24"
            title="Aturan tidak ditemukan"
            description="Mungkin sudah dihapus atau diarsipkan."
            icon={<RiFileTextLine />}
          />
        ) : (
          <article className="mx-auto w-full max-w-3xl px-8 pt-12 pb-16 sm:px-16">
            {(isOld || isDraft) && (
              <div className="border-border mb-8 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  {isDraft
                    ? "Ini draf. Karyawan belum bisa melihatnya sampai diterbitkan."
                    : `Ini versi lama dari ${day(version?.published_at ?? null)}, bukan yang berlaku sekarang.`}
                </span>
                {latest && (
                  <button
                    type="button"
                    onClick={() => onVersion(null)}
                    className="text-primary font-medium hover:underline"
                  >
                    Lihat versi berlaku
                  </button>
                )}
              </div>
            )}

            <h1 className="text-heading text-4xl leading-tight font-semibold tracking-tight">
              {title}
            </h1>
            <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <ListChip>{policy.category}</ListChip>
              {policy.archived_at && <ListChip>Diarsipkan</ListChip>}
              {version && !isDraft && (
                <>
                  <span>Berlaku sejak {day(version.effective_at)}</span>
                  <span>
                    Diperbarui {day(version.published_at)}
                    {version.author?.full_name &&
                      ` oleh ${version.author.full_name}`}
                  </span>
                </>
              )}
              {isDraft && version && (
                <span>
                  Draf disimpan {day(version.updated_at)}
                  {version.author?.full_name &&
                    ` oleh ${version.author.full_name}`}
                </span>
              )}
            </div>
            {version?.summary && (
              <p className="text-muted-foreground mt-3 text-[15px]">
                {version.summary}
              </p>
            )}

            <Separator className="my-8" />

            {version?.body.trim() ? (
              <Markdown>{version.body}</Markdown>
            ) : (
              <p className="text-muted-foreground text-sm">Belum ada isi.</p>
            )}

            <Separator className="mt-12 mb-8" />

            <PolicyHistory
              published={published}
              draft={draft}
              viewingId={version?.id ?? null}
              onSelect={(v) =>
                onVersion(
                  v.status === "Draft"
                    ? "draft"
                    : v.id === latest?.id
                      ? null
                      : v.version_number,
                )
              }
            />
          </article>
        )}
      </div>

      {isAdmin && draft && (
        <PublishDialog
          policyId={id}
          title={draft.title}
          nextVersion={published.length + 1}
          open={publishing}
          onOpenChange={setPublishing}
          onPublished={() => {
            refresh()
            onVersion(null)
          }}
        />
      )}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm === "delete" ? "Hapus aturan ini?" : "Buang draf?"}
        description={
          confirm === "delete"
            ? "Aturan dan semua riwayatnya dihapus permanen. Kalau hanya ingin menyembunyikan, arsipkan saja."
            : "Perubahan yang belum diterbitkan hilang. Isi yang berlaku tidak berubah."
        }
        confirmText={confirm === "delete" ? "Hapus permanen" : "Buang draf"}
        cancelText="Batal"
        variant="destructive"
        onConfirm={async () => {
          const result =
            confirm === "delete"
              ? await deletePolicy(id)
              : await discardPolicyDraft(id)
          if (!result.success) {
            toast.error(result.error)
            return
          }
          refresh()
          if (confirm === "delete") {
            toast.success("Aturan dihapus")
            onClose()
          } else {
            toast.success("Draf dibuang")
            onVersion(null)
          }
        }}
      />
    </>
  )
}

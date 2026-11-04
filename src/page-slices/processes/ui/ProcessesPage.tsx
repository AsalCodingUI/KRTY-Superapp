"use client"

import { linkKey } from "@/shared/lib/url-params"
import {
  deleteProcess,
  setDefaultProcess,
} from "@/app/(main)/processes/actions/process-actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { ContextTarget, type CtxItem } from "@/shared/context-menu"
import { CopyPlus, Pencil, Star, Trash2 } from "@/components/icons"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { accessLevel } from "@/shared/config/access"
import { RiAddLine, RiFlowLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Fragment, useState } from "react"
import {
  countOf,
  useProcesses,
  useRefreshProcesses,
  type ProcessSummary,
} from "../model/data"
import { ProcessFormDialog } from "./ProcessFormDialog"

/** Project templates (DesignerHQ "Processes"): PMs and stakeholders. */
export function ProcessesPage() {
  const t = useT("processes")
  const router = useRouter()
  const { profile, loading } = useUserProfile()
  // PMs and stakeholders (access.ts PM_UP).
  const canManage = accessLevel(profile) !== "employee"
  const { data: processes = [], isLoading } = useProcesses(canManage)
  const [creating, setCreating] = useState(false)
  // From the right-click menu: rename / duplicate one, or delete it.
  const [dialog, setDialog] = useState<{
    kind: "rename" | "duplicate"
    process: ProcessSummary
  } | null>(null)
  const [deleting, setDeleting] = useState<ProcessSummary | null>(null)
  const refresh = useRefreshProcesses()

  const processItems = (p: ProcessSummary): CtxItem[] => [
    {
      id: "default",
      label: t("makeDefault"),
      icon: Star,
      checked: p.is_default,
      role: "checkbox",
      disabled: p.is_default,
      onSelect: async () => {
        const result = await setDefaultProcess(p.id)
        if (!result.success) return void toast.error(result.error)
        toast.success(t("madeDefault", { name: p.name }))
        await refresh()
      },
    },
    {
      id: "rename",
      label: t("rename"),
      icon: Pencil,
      onSelect: () => setDialog({ kind: "rename", process: p }),
    },
    {
      id: "duplicate",
      label: t("duplicate"),
      icon: CopyPlus,
      onSelect: () => setDialog({ kind: "duplicate", process: p }),
    },
    {
      id: "delete",
      label: t("delete"),
      icon: Trash2,
      destructive: true,
      // The default can't go (same rule as the server).
      disabled: p.is_default,
      hint: p.is_default ? t("default") : undefined,
      onSelect: () => setDeleting(p),
    },
  ]

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  if (!canManage)
    return (
      <EmptyState
        className="py-16"
        title={t("noAccessTitle")}
        description={t("noAccessDescription")}
        icon={<RiFlowLine />}
      />
    )

  return (
    <div className="flex flex-col">
      <PageHeader
        title={t("title")}
        actions={
          <Button onClick={() => setCreating(true)}>
            <RiAddLine data-icon="inline-start" />
            {t("newProcess")}
          </Button>
        }
      />

      <div className="pb-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-6" />
          </div>
        ) : processes.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            icon={<RiFlowLine />}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {processes.map((p) => (
              <ContextTarget
                key={p.id}
                type="process"
                id={p.id}
                label={p.name}
                href={`/processes/${linkKey(p.name, p.id)}`}
                items={() => processItems(p)}
              >
                <ProcessCard process={p} />
              </ContextTarget>
            ))}
          </div>
        )}
      </div>

      <ProcessFormDialog
        open={creating}
        onOpenChange={setCreating}
        process={null}
        processes={processes}
        onSaved={(id) => router.push(`/processes/${id}`)}
      />
      <ProcessFormDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        process={dialog?.kind === "rename" ? dialog.process : null}
        copyFrom={dialog?.kind === "duplicate" ? dialog.process : null}
        processes={processes}
        onSaved={(id) => {
          if (dialog?.kind === "duplicate") {
            toast.success(t("duplicated"))
            router.push(`/processes/${id}`)
          }
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteTitle", { name: deleting?.name ?? "" })}
        description={t("deleteDescription")}
        confirmText={t("delete")}
        variant="destructive"
        onConfirm={async () => {
          if (!deleting) return
          const result = await deleteProcess(deleting.id)
          if (!result.success) return void toast.error(result.error)
          toast.success(t("deleted"))
          setDeleting(null)
          await refresh()
        }}
      />
    </div>
  )
}

function ProcessCard({
  process,
  ...rest
}: {
  process: ProcessSummary
  /** data-* from the right-click target. */
  [data: `data-${string}`]: string | undefined
}) {
  const t = useT("processes")
  const n = countOf(process)

  return (
    <Link
      {...rest}
      data-slot="process-card"
      href={`/processes/${linkKey(process.name, process.id)}`}
      prefetch={false}
      className="bg-card border-field-border hover:border-field-border focus-visible:border-primary/50 focus-visible:ring-focus-ring flex flex-col overflow-hidden rounded-xl border transition-[border-color] duration-200 outline-none focus-visible:ring-2"
    >
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <span className="text-foreground min-w-0 truncate font-medium">
            {process.name}
          </span>
          {process.is_default && (
            <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-xs">
              {t("default")}
            </span>
          )}
        </div>
        <p className="text-muted-foreground line-clamp-2 min-h-10 text-sm leading-5">
          {process.description || t("counts", n)}
        </p>
        <div className="flex flex-wrap items-center gap-y-2">
          {process.phases.map((ph, i) => (
            <Fragment key={ph.id}>
              {i > 0 && <span className="bg-border h-px w-3" />}
              <span className="border-border rounded-md border px-2 py-0.5 text-xs">
                {ph.name}
              </span>
            </Fragment>
          ))}
        </div>
      </div>
      <div className="bg-muted dark:bg-muted/40 border-border text-muted-foreground text-meta flex items-center justify-between gap-3 border-t px-5 py-3">
        <span className="truncate">{t("counts", n)}</span>
        <span className="shrink-0">
          {n.projects ? t("usedBy", { n: n.projects }) : t("notUsed")}
        </span>
      </div>
    </Link>
  )
}

"use client"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { canManageByRole } from "@/shared/lib/roles"
import { RiAddLine, RiFlowLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Fragment, useState } from "react"
import { countOf, useProcesses, type ProcessSummary } from "../model/data"
import { ProcessFormDialog } from "./ProcessFormDialog"

/** Stakeholders' project templates (DesignerHQ "Processes"). */
export function ProcessesPage() {
  const t = useT("processes")
  const router = useRouter()
  const { profile, loading } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const { data: processes = [], isLoading } = useProcesses(isAdmin)
  const [creating, setCreating] = useState(false)

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  if (!isAdmin)
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
        className="pt-6 pb-4"
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
              <ProcessCard key={p.id} process={p} />
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
    </div>
  )
}

function ProcessCard({ process }: { process: ProcessSummary }) {
  const t = useT("processes")
  const n = countOf(process)

  return (
    <Link
      data-slot="process-card"
      href={`/processes/${process.id}`}
      prefetch={false}
      className="bg-card border-foreground/10 hover:border-foreground/20 focus-visible:border-primary/50 focus-visible:ring-primary/20 flex flex-col overflow-hidden rounded-xl border transition-[border-color] duration-200 outline-none focus-visible:ring-2"
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
      <div className="bg-muted/40 border-border text-muted-foreground flex items-center justify-between gap-3 border-t px-5 py-3 text-[13px]">
        <span className="truncate">{t("counts", n)}</span>
        <span className="shrink-0">
          {n.projects ? t("usedBy", { n: n.projects }) : t("notUsed")}
        </span>
      </div>
    </Link>
  )
}

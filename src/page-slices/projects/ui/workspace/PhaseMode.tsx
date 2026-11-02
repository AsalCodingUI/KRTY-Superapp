"use client"

import {
  applyProcessToProject,
  stopUsingPhases,
} from "@/app/(main)/processes/actions/process-actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { surfaceClassName } from "@/components/panel"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useProcesses } from "@/page-slices/processes/model/data"
import { useT } from "@/shared/i18n/client"
import { RiAddLine } from "@/shared/ui/lucide-icons"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronDown, Infinity as InfinityIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useInvalidate } from "./data"

/**
 * Projects can run without phases (side work, retainer clients): the
 * properties line says "Berjalan terus" instead of a progress figure, the
 * phase rail is left out, and stakeholders can switch phases off and on.
 */

/** Refreshes everything that shows a project's phases. */
function useRefreshPhases(projectId: string) {
  const invalidate = useInvalidate(projectId)
  const queryClient = useQueryClient()
  return () => {
    void invalidate("workspace", "steps", "tasks")
    void queryClient.invalidateQueries({ queryKey: ["processes"] })
    void queryClient.invalidateQueries({
      queryKey: ["project-summary", projectId],
    })
  }
}

/** The dashboard's stand-in for the phase rail when there are none
 *  (stakeholders; the team sees "Berjalan terus" in the properties line). */
export function PhasesOffCard({
  projectId,
  isAdmin,
  onAddManual,
}: {
  projectId: string
  isAdmin: boolean
  /** Opens the "Tambah fase" dialog. */
  onAddManual: () => void
}) {
  const t = useT("projects")
  const refresh = useRefreshPhases(projectId)
  const { data: processes = [] } = useProcesses(isAdmin)
  const [busy, setBusy] = useState(false)

  const apply = async (id: string, name: string) => {
    setBusy(true)
    const result = await applyProcessToProject(projectId, id)
    setBusy(false)
    if (!result.success) return void toast.error(result.error)
    toast.success(t("phasesStarted", { name }))
    refresh()
  }

  return (
    <section
      data-slot="phases-off"
      className={cn(
        surfaceClassName,
        "flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center",
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full"
        >
          <InfinityIcon className="size-4" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-foreground text-sm font-medium">
            {t("phasesOffTitle")}
          </span>
          <span className="text-muted-foreground text-[13px]">
            {t("phasesOffDescription")}
          </span>
        </span>
      </span>
      {isAdmin && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                className="shrink-0 self-start sm:self-auto"
              />
            }
          >
            {t("usePhases")}
            <ChevronDown data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            {processes.length > 0 && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    {t("usePhasesFromProcess")}
                  </DropdownMenuLabel>
                  {processes.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => void apply(p.id, p.name)}
                    >
                      <span className="min-w-0 truncate">{p.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={onAddManual}>
              <RiAddLine />
              {t("usePhasesManual")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </section>
  )
}

/** "Jangan pakai fase": asks first, says what goes and what stays. */
export function StopPhasesDialog({
  projectId,
  projectName,
  phaseCount,
  stepCount,
  open,
  onOpenChange,
  onDone,
}: {
  projectId: string
  projectName: string
  phaseCount: number
  stepCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone?: () => void
}) {
  const t = useT("projects")
  const refresh = useRefreshPhases(projectId)
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("stopPhasesTitle", { name: projectName })}
      description={t("stopPhasesDescription", {
        phases: phaseCount,
        steps: stepCount,
      })}
      confirmText={t("stopPhasesConfirm")}
      variant="destructive"
      onConfirm={async () => {
        const result = await stopUsingPhases(projectId)
        if (!result.success) return void toast.error(result.error)
        toast.success(t("phasesStopped", { name: projectName }))
        onDone?.()
        refresh()
      }}
    />
  )
}

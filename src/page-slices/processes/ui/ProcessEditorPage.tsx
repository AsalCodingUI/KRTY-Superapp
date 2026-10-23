"use client"

import {
  addItem,
  deleteItem,
  deleteProcess,
  moveItem,
  setDefaultProcess,
  updateItem,
} from "@/app/(main)/processes/actions/process-actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { InlineText } from "@/components/inline-text"
import { useBreadcrumbs } from "@/components/page-breadcrumbs"
import { PageHeader } from "@/components/page-header"
import { surfaceClassName } from "@/components/panel"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { canManageByRole } from "@/shared/lib/roles"
import {
  RiAddLine,
  RiCloseLine,
  RiFlowLine,
  RiMoreFill,
} from "@/shared/ui/lucide-icons"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import {
  useProcesses,
  useRefreshProcesses,
  type ProcessPhase,
  type ProcessStep,
} from "../model/data"
import { ProcessFormDialog } from "./ProcessFormDialog"

type Level = "process_phases" | "process_steps" | "process_tasks"
type Result = { success: boolean; error?: string }

/** Runs a mutation, toasts its error, and refetches the processes. */
function useMutate() {
  const refresh = useRefreshProcesses()
  return async <R extends Result>(promise: Promise<R>) => {
    const result = await promise
    if (!result.success) toast.error(result.error)
    await refresh()
    return result
  }
}

/** One process: phases on the left, the selected phase's steps on the right. */
export function ProcessEditorPage({ id }: { id: string }) {
  const t = useT("processes")
  const router = useRouter()
  const mutate = useMutate()
  const refresh = useRefreshProcesses()
  const { profile, loading } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const { data: processes = [], isLoading } = useProcesses(isAdmin)
  const process = processes.find((p) => p.id === id)
  const [selected, setSelected] = useState<string | null>(null)
  const [dialog, setDialog] = useState<"rename" | "duplicate" | null>(null)
  const [confirm, setConfirm] = useState<
    { kind: "process" } | { kind: "phase"; phase: ProcessPhase } | null
  >(null)
  useBreadcrumbs(process ? [{ label: process.name }] : [])

  const phases = process?.phases ?? []
  const current = phases.find((p) => p.id === selected) ?? phases[0]

  if (loading || (isAdmin && isLoading))
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  if (!isAdmin || !process)
    return (
      <EmptyState
        className="py-16"
        title={isAdmin ? t("notFound") : t("noAccessTitle")}
        description={isAdmin ? "" : t("noAccessDescription")}
        icon={<RiFlowLine />}
      />
    )

  const addPhase = async () => {
    const result = await mutate(
      addItem("process_phases", process.id, t("newPhase")),
    )
    if (result.success && result.data) setSelected(result.data.id)
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        back={{ href: "/processes", label: t("back") }}
        title={process.name}
        actions={
          <>
            {process.is_default ? (
              <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-1 text-xs">
                {t("default")}
              </span>
            ) : (
              <Button
                variant="outline"
                onClick={async () => {
                  const result = await mutate(setDefaultProcess(process.id))
                  if (result.success)
                    toast.success(t("madeDefault", { name: process.name }))
                }}
              >
                {t("makeDefault")}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t("actions")}
                  />
                }
              >
                <RiMoreFill />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem onClick={() => setDialog("rename")}>
                  {t("rename")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDialog("duplicate")}>
                  {t("duplicate")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() =>
                    process.is_default
                      ? toast.error(t("errDeleteDefault"))
                      : setConfirm({ kind: "process" })
                  }
                >
                  {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <div className="grid items-start gap-4 pb-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <nav className="flex flex-col">
          {phases.map((phase, i) => {
            const steps = phase.steps.length
            const tasks = phase.steps.reduce((n, s) => n + s.tasks.length, 0)
            const active = current?.id === phase.id
            return (
              <div key={phase.id} className="flex flex-col">
                {i > 0 && <span className="bg-border mx-auto my-1 h-3 w-px" />}
                <div
                  data-slot="process-phase"
                  className={cn(
                    surfaceClassName,
                    "group/phase relative flex items-center gap-3 px-3 py-2.5 transition-colors",
                    active
                      ? "border-foreground/25 dark:border-foreground/25"
                      : "hover:border-foreground/15 dark:hover:border-foreground/15",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelected(phase.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none after:absolute after:inset-0"
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full text-xs tabular-nums",
                        active
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">
                        {phase.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {t("phaseCounts", { steps, tasks })}
                      </span>
                    </span>
                  </button>
                  <ItemMenu
                    className="relative opacity-0 group-hover/phase:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100"
                    first={i === 0}
                    last={i === phases.length - 1}
                    onMove={(d) =>
                      mutate(moveItem("process_phases", phase.id, d))
                    }
                    deleteLabel={t("deletePhase")}
                    onDelete={() => setConfirm({ kind: "phase", phase })}
                  />
                </div>
              </div>
            )
          })}
          <Button
            variant="ghost"
            className="text-muted-foreground mt-2 self-start"
            onClick={addPhase}
          >
            <RiAddLine data-icon="inline-start" />
            {t("addPhase")}
          </Button>
        </nav>

        {current ? (
          <PhasePanel
            key={current.id}
            phase={current}
            index={phases.indexOf(current)}
          />
        ) : (
          <div
            className={cn(
              surfaceClassName,
              "text-muted-foreground px-6 py-16 text-center text-sm",
            )}
          >
            {t("noPhases")}
          </div>
        )}
      </div>

      <ProcessFormDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        process={dialog === "rename" ? process : null}
        copyFrom={dialog === "duplicate" ? process : null}
        processes={processes}
        onSaved={(newId) => {
          if (dialog === "duplicate") {
            toast.success(t("duplicated"))
            router.push(`/processes/${newId}`)
          }
        }}
      />
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm?.kind === "phase"
            ? t("deletePhaseTitle", { name: confirm.phase.name })
            : t("deleteTitle", { name: process.name })
        }
        description={
          confirm?.kind === "phase"
            ? t("deletePhaseDescription")
            : t("deleteDescription")
        }
        confirmText={confirm?.kind === "phase" ? t("deletePhase") : t("delete")}
        variant="destructive"
        onConfirm={async () => {
          if (confirm?.kind === "phase") {
            await mutate(deleteItem("process_phases", confirm.phase.id))
            return
          }
          const result = await deleteProcess(process.id)
          if (!result.success) return void toast.error(result.error)
          toast.success(t("deleted"))
          await refresh()
          router.push("/processes")
        }}
      />
    </div>
  )
}

function PhasePanel({ phase, index }: { phase: ProcessPhase; index: number }) {
  const t = useT("processes")
  const mutate = useMutate()
  const save = (
    level: Level,
    id: string,
    patch: { text?: string; description?: string },
  ) => mutate(updateItem(level, id, patch))

  return (
    <section className={cn(surfaceClassName, "flex flex-col")}>
      <header className="flex flex-col gap-1 border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="bg-foreground text-background flex size-6 shrink-0 items-center justify-center rounded-full text-xs tabular-nums">
            {index + 1}
          </span>
          <InlineText
            value={phase.name}
            aria-label={t("phaseName")}
            required
            className="text-base font-medium"
            onSave={(text) => save("process_phases", phase.id, { text })}
          />
        </div>
        <InlineText
          value={phase.description ?? ""}
          placeholder={t("phaseDescriptionPlaceholder")}
          className="text-muted-foreground ml-7.5 text-sm"
          onSave={(description) =>
            save("process_phases", phase.id, { description })
          }
        />
      </header>

      <div className="text-muted-foreground hidden grid-cols-2 gap-4 border-b px-5 py-2 text-xs md:grid">
        <span>{t("clientSees")}</span>
        <span>{t("teamDoes")}</span>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {phase.steps.length === 0 && (
          <p className="text-muted-foreground py-6 text-center text-sm">
            {t("noSteps")}
          </p>
        )}
        {phase.steps.map((step, i) => (
          <StepRow
            key={step.id}
            step={step}
            first={i === 0}
            last={i === phase.steps.length - 1}
          />
        ))}
        <Button
          variant="ghost"
          className="text-muted-foreground self-start"
          onClick={() =>
            mutate(addItem("process_steps", phase.id, t("newStep")))
          }
        >
          <RiAddLine data-icon="inline-start" />
          {t("addStep")}
        </Button>
      </div>
    </section>
  )
}

function StepRow({
  step,
  first,
  last,
}: {
  step: ProcessStep
  first: boolean
  last: boolean
}) {
  const t = useT("processes")
  const mutate = useMutate()

  return (
    <div
      data-slot="process-step"
      className="border-border grid gap-3 rounded-lg border p-3 md:grid-cols-2 md:gap-4"
    >
      <div className="group/step flex min-w-0 items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <InlineText
            value={step.title}
            required
            className="text-sm font-medium"
            onSave={(text) =>
              mutate(updateItem("process_steps", step.id, { text }))
            }
          />
          <InlineText
            value={step.description ?? ""}
            placeholder={t("stepDescriptionPlaceholder")}
            className="text-muted-foreground text-[13px]"
            onSave={(description) =>
              mutate(updateItem("process_steps", step.id, { description }))
            }
          />
        </div>
        <ItemMenu
          className="opacity-0 group-hover/step:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100"
          first={first}
          last={last}
          onMove={(d) => mutate(moveItem("process_steps", step.id, d))}
          deleteLabel={t("deleteStep")}
          onDelete={() => mutate(deleteItem("process_steps", step.id))}
        />
      </div>

      <ul className="flex min-w-0 flex-col md:border-l md:pl-4">
        {step.tasks.map((task) => (
          <li
            key={task.id}
            className="group/task flex items-center gap-2 text-sm"
          >
            <span className="border-muted-foreground/50 size-3 shrink-0 rounded-full border" />
            <InlineText
              value={task.title}
              required
              className="text-sm"
              onSave={(text) =>
                mutate(updateItem("process_tasks", task.id, { text }))
              }
            />
            <button
              type="button"
              aria-label={t("deleteTask")}
              onClick={() => mutate(deleteItem("process_tasks", task.id))}
              className="text-muted-foreground hover:text-destructive opacity-0 group-hover/task:opacity-100 focus-visible:opacity-100"
            >
              <RiCloseLine className="size-3.5" />
            </button>
          </li>
        ))}
        <li>
          <AddTask stepId={step.id} />
        </li>
      </ul>
    </div>
  )
}

/** "+ Add a task" that turns into an input; Enter adds and stays open. */
function AddTask({ stepId }: { stepId: string }) {
  const t = useT("processes")
  const mutate = useMutate()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-foreground flex items-center gap-2 py-1 text-sm"
      >
        <RiAddLine className="size-3.5" />
        {t("addTask")}
      </button>
    )

  const submit = async () => {
    const text = value.trim()
    if (!text) return setOpen(false)
    setValue("")
    await mutate(addItem("process_tasks", stepId, text))
  }

  return (
    <input
      autoFocus
      value={value}
      maxLength={200}
      placeholder={t("taskPlaceholder")}
      aria-label={t("addTask")}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value.trim()) void submit()
        setOpen(false)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          void submit()
        }
        if (e.key === "Escape") {
          setValue("")
          setOpen(false)
        }
      }}
      className="placeholder:text-muted-foreground w-full rounded-md border-0 bg-transparent p-0 py-1 text-sm shadow-none outline-hidden focus:shadow-none focus:ring-0 focus:outline-hidden"
    />
  )
}

/** ⋯ menu for a phase or step: move up/down and delete. */
function ItemMenu({
  first,
  last,
  onMove,
  deleteLabel,
  onDelete,
  className,
}: {
  first: boolean
  last: boolean
  onMove: (direction: -1 | 1) => void
  deleteLabel: string
  onDelete: () => void
  className?: string
}) {
  const t = useT("processes")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("actions")}
            className={cn("text-muted-foreground shrink-0", className)}
          />
        }
      >
        <RiMoreFill />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem disabled={first} onClick={() => onMove(-1)}>
          {t("moveUp")}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={last} onClick={() => onMove(1)}>
          {t("moveDown")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          {deleteLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

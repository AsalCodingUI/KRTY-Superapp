"use client"

import { BriefShortcut } from "@/page-slices/briefs/ui/BriefShortcut"
import { useProjectHref } from "@/shared/hooks/useProjectHref"
import { surfaceClassName } from "@/components/panel"
import {
  asStage,
  OPEN_STATUSES,
  STATUS_LABEL_KEYS,
  type ProjectStatus,
} from "@/page-slices/projects/lib/status"
import { PageHeader } from "@/components/page-header"
import {
  DashboardReportDialog,
  LatestReports,
  UpcomingTasks,
} from "./DashboardHome"
import { DesignLinks } from "./DesignLinks"
import { CategoryPicker, useProjectCategories } from "../CategoryPicker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import dynamic from "next/dynamic"
import { clip, PHASE_NAME_MAX, PhaseRail } from "./PhaseRail"
import { setProjectStatus } from "@/app/(main)/projects/actions/project-actions"
import { accessLevel, canRunProjects } from "@/shared/config/access"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { ProjectStatusButton } from "../ProjectMenu"
import { registerProjectStatusUndo } from "../project-undo"
import { registerUndo, rowsUndo, UndoStale } from "@/shared/undo"
import { ProjectProperties } from "./ProjectProperties"
import { ProjectLineageLinks } from "../ProjectLineage"
import { ProjectStageButton, useSetProjectStage } from "../ProjectStage"
import { PhasesOffCard, StopPhasesDialog } from "./PhaseMode"
import type { ReportSummary } from "./reports-data"
import { ProjectAvatar } from "@/components/project-avatar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DateField } from "@/components/date-field"
import { DatePicker } from "@/components/date-picker"
import { EmptyValue } from "@/components/empty-value"
import { InlineText } from "@/components/inline-text"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  RiAddLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiMoreFill,
} from "@/shared/ui/lucide-icons"
import {
  jakartaDay,
  phaseWeights,
  todayJakarta,
} from "@/entities/performance/lib/kpi-phases"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { format, parseISO, type Locale } from "date-fns"
import {
  AtSign,
  Building2,
  CalendarDays,
  CalendarRange,
  CircleDashed,
  Phone,
  UserRound,
  UsersRound,
  ArrowDown,
  ArrowUp,
  Pencil,
  Tag,
  Trash2,
  type LucideIcon,
} from "@/components/icons"
import { ContextTarget, type CtxItem } from "@/shared/context-menu"
import { useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  supabase,
  useInvalidate,
  useSteps,
  useTasks,
  useCanManageProject,
  useViewer,
  useWorkspace,
  type PhaseRow,
  type StepRow,
} from "./data"
import { initials } from "@/shared/lib/initials"

const ProjectForm = dynamic(
  () => import("../ProjectForm").then((m) => m.ProjectForm),
  { loading: () => null },
)

const day = (date: string | null, locale: Locale) =>
  date ? format(new Date(date), "d MMM yyyy", { locale }) : "—"

/**
 * Project home (DesignerHQ-style): phases = the SLA milestones
 * (copied from the project's process), the process steps of a phase, and
 * the project facts on the right.
 */
export function ProjectDashboard({ projectId }: { projectId: string }) {
  const t = useT("projects")
  const tu = useT("undo")
  const dateLocale = useDateLocale()
  const { data, isLoading } = useWorkspace(projectId)
  const base = useProjectHref(projectId)
  const { data: steps = [] } = useSteps(projectId)
  const { data: tasks = [] } = useTasks(projectId)
  const viewer = useViewer()
  // Phases, the about text and facts: stakeholders and the project's PMs.
  const canManage = useCanManageProject(projectId)
  const invalidate = useInvalidate(projectId)
  const queryClient = useQueryClient()
  // "Pindahkan ke" in the header: PMs and stakeholders.
  const { profile } = useUserProfile()
  const canMove = canRunProjects(accessLevel(profile))
  const setStage = useSetProjectStage()
  // The team's edit shortcut opens the project form here.
  const [editOpen, setEditOpen] = useState(false)
  const [editMounted, setEditMounted] = useState(false)
  useEffect(() => {
    if (editOpen) setEditMounted(true)
  }, [editOpen])
  const { data: categories = [] } = useProjectCategories()
  const [selected, setSelected] = useState<string | null>(null)
  // Adding or renaming a phase (one small dialog), and deleting one.
  const [phaseDialog, setPhaseDialog] = useState<PhaseRow | "new" | null>(null)
  const [deletingPhase, setDeletingPhase] = useState<PhaseRow | null>(null)
  const [completing, setCompleting] = useState(false)
  // "Jangan pakai fase" (asks first).
  const [stoppingPhases, setStoppingPhases] = useState(false)
  // Due dates, SLA weights and completion days (one dialog for all phases;
  // the id is the phase it was opened from, highlighted there).
  const [settingsFor, setSettingsFor] = useState<string | true | null>(null)
  // The report window: a new report, or one opened from the list.
  const [reportOpen, setReportOpen] = useState<{
    report: ReportSummary | null
  } | null>(null)

  const phases = useMemo(() => data?.phases ?? [], [data?.phases])
  const activePhase = phases.find((p) => p.status === "active") ?? null
  useEffect(() => {
    if (!selected && phases.length) {
      setSelected((activePhase ?? phases[phases.length - 1]).id)
    }
  }, [phases, activePhase, selected])

  if (isLoading || !data?.project) {
    return (
      <div className="flex justify-center py-16">
        {isLoading ? (
          <Spinner className="size-6" />
        ) : (
          <p className="text-muted-foreground text-sm">{t("notFound")}</p>
        )}
      </div>
    )
  }
  const { project, team, client } = data
  const current = phases.find((p) => p.id === selected) ?? phases[0]

  const moveProject = async (status: ProjectStatus) => {
    const from = project.status as ProjectStatus
    const result = await setProjectStatus(projectId, status)
    if (!result.success) return void toast.error(result.error)
    toast.success(`${project.name} → ${t(STATUS_LABEL_KEYS[status])}`)
    const refresh = () =>
      Promise.all([
        invalidate("workspace"),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
      ])
    void refresh()
    if (from !== status)
      registerProjectStatusUndo({
        projectId,
        label: tu("projectStatus", {
          name: project.name,
          status: t(STATUS_LABEL_KEYS[status]),
        }),
        from,
        to: status,
        refresh,
      })
  }
  const openTasks = tasks.filter((task) => !task.done && !task.parent_id).length

  /** Make `phase` the active one: earlier phases done, later ones to do. */
  const activate = async (phase: PhaseRow, completeIt = false) => {
    const db = supabase()
    const now = new Date().toISOString()
    const newStatus: string[] = []
    const updates = phases.map((p) => {
      const status = completeIt
        ? p.position <= phase.position
          ? "done"
          : p.position === phase.position + 1
            ? "active"
            : "todo"
        : p.position < phase.position
          ? "done"
          : p.position === phase.position
            ? "active"
            : "todo"
      newStatus.push(status)
      return db
        .from("project_phases")
        .update({
          status,
          completed_at: status === "done" ? (p.completed_at ?? now) : null,
        })
        .eq("id", p.id)
    })
    const results = await Promise.all(updates)
    if (results.some((r) => r.error)) {
      toast.error(t("errUpdatePhase"))
      return
    }
    toast.success(
      completeIt
        ? t("phaseCompleted", { name: clip(phase.name) })
        : t("phaseActivated", { name: clip(phase.name) }),
    )
    invalidate("workspace")
    // ⌘Z puts every phase's status back (shared/undo).
    const changed = phases
      .map((p, i) => ({ p, next: newStatus[i] }))
      .filter(({ p, next }) => p.status !== next)
    if (changed.length)
      registerUndo(
        rowsUndo({
          label: tu("phaseStatus", { name: clip(phase.name) }),
          table: "project_phases",
          rows: changed.map(({ p, next }) => ({
            id: p.id,
            before: { status: p.status, completed_at: p.completed_at },
            after: {
              status: next,
              completed_at: next === "done" ? (p.completed_at ?? now) : null,
            },
          })),
          check: (k) => k === "status",
          done: () => invalidate("workspace"),
        }),
      )
  }

  /* Running projects can reshape their phases, not only the process. */
  const savePhaseName = async (name: string) => {
    const db = supabase()
    if (phaseDialog === "new") {
      const { data: row, error } = await db
        .from("project_phases")
        .insert({
          project_id: projectId,
          name,
          position: Math.max(0, ...phases.map((p) => p.position)) + 1,
          status: phases.length === 0 ? "active" : "todo",
        })
        .select("id")
        .single()
      if (error || !row) return void toast.error(t("errSavePhase"))
      setSelected(row.id)
    } else if (phaseDialog) {
      const { error } = await db
        .from("project_phases")
        .update({ name })
        .eq("id", phaseDialog.id)
      if (error) return void toast.error(t("errSavePhase"))
      if (phaseDialog.name !== name)
        registerUndo(
          rowsUndo({
            label: tu("phaseRename", { name: clip(name) }),
            table: "project_phases",
            rows: [
              {
                id: phaseDialog.id,
                before: { name: phaseDialog.name },
                after: { name },
              },
            ],
            done: () => invalidate("workspace"),
          }),
        )
    }
    setPhaseDialog(null)
    invalidate("workspace")
  }

  const movePhase = async (phase: PhaseRow, direction: -1 | 1) => {
    const ids = phases.map((p) => p.id)
    const from = ids.indexOf(phase.id)
    const to = from + direction
    if (to < 0 || to >= ids.length) return
    const original = phases.map((p) => p.id)
    ;[ids[from], ids[to]] = [ids[to], ids[from]]
    const { error } = await supabase().rpc("reorder_project_phases", {
      p_project_id: projectId,
      p_ids: ids,
    })
    if (error) toast.error(t("errSavePhase"))
    invalidate("workspace")
    if (!error) registerPhaseOrderUndo(original, ids)
  }

  /** ⌘Z for a phase reorder: the old order, if it's still the new one. */
  const registerPhaseOrderUndo = (before: string[], after: string[]) => {
    const go = async (expected: string[], next: string[]) => {
      const { data, error } = await supabase()
        .from("project_phases")
        .select("id")
        .eq("project_id", projectId)
        .order("position")
      if (error) throw error
      if (
        (data ?? []).map((r: { id: string }) => r.id).join() !== expected.join()
      )
        throw new UndoStale()
      const { error: saveError } = await supabase().rpc(
        "reorder_project_phases",
        { p_project_id: projectId, p_ids: next },
      )
      if (saveError) throw saveError
      await invalidate("workspace")
    }
    registerUndo({
      label: tu("phaseOrder"),
      undo: () => go(after, before),
      redo: () => go(before, after),
    })
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title={
          <span className="flex min-w-0 items-center gap-3">
            <ProjectAvatar
              id={project.id}
              name={project.name}
              className="text-micro size-7"
            />
            <span className="min-w-0 truncate">{project.name}</span>
            <ProjectStageButton
              stage={asStage(project.stage)}
              onPick={
                canMove ? (stage) => void setStage(project, stage) : undefined
              }
            />
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <BriefShortcut projectId={project.id} variant="button" />
            {canMove && project.status && (
              <ProjectStatusButton
                status={project.status}
                onMove={(status) => void moveProject(status)}
              />
            )}
            <Button onClick={() => setReportOpen({ report: null })}>
              <RiAddLine data-icon="inline-start" />
              {t("reportNew")}
            </Button>
          </div>
        }
      />
      <ProjectProperties
        phases={phases}
        steps={steps}
        status={project.status ? t(STATUS_LABEL_KEYS[project.status]) : null}
        statusTone={project.status}
        start={project.start_date ? day(project.start_date, dateLocale) : null}
        end={project.end_date ? day(project.end_date, dateLocale) : null}
        openTasks={openTasks}
        extra={(item) => (
          <ProjectLineageLinks
            projectId={project.id}
            previousId={project.previous_id}
            className={item}
          />
        )}
      />
      <div className="flex flex-col gap-4 pt-6 pb-4">
        {phases.length === 0 ? (
          // An ongoing project (side work, a retainer): no rail, and for
          // stakeholders and the project's PMs the way back to phases.
          canManage && (
            <PhasesOffCard
              projectId={projectId}
              isAdmin={canManage}
              onAddManual={() => setPhaseDialog("new")}
            />
          )
        ) : (
          <PhaseRail
            phases={phases}
            steps={steps}
            selectedId={current?.id ?? null}
            onSelect={setSelected}
            isAdmin={canManage}
            onAdd={() => setPhaseDialog("new")}
            onActivate={activate}
            onRename={(phase) => setPhaseDialog(phase)}
            onMove={movePhase}
            onDelete={(phase) => setDeletingPhase(phase)}
            onSettings={(phase) => setSettingsFor(phase?.id ?? true)}
            onComplete={() => setCompleting(true)}
            onCompleteUpTo={(phase) => void activate(phase, true)}
            onStopPhases={() => setStoppingPhases(true)}
            // Only running projects still need due dates for the KPI.
            showMissingDue={
              project.status !== null && OPEN_STATUSES.includes(project.status)
            }
          />
        )}

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-4">
            {current && (
              <ProcessPanel
                projectId={projectId}
                phase={current}
                steps={steps.filter((s) => s.phase_id === current.id)}
                viewerId={viewer.id}
              />
            )}
            <div className="grid gap-4 xl:grid-cols-2">
              <UpcomingTasks
                projectId={projectId}
                base={base}
                tasks={tasks}
                team={team}
              />
              <LatestReports
                projectId={projectId}
                base={base}
                onOpen={(report) => setReportOpen({ report })}
              />
            </div>
          </div>

          <aside
            className={cn(surfaceClassName, "flex flex-col gap-5 p-4 text-sm")}
          >
            <ProjectAbout
              projectId={projectId}
              description={project.description}
              canEdit={canManage}
            />
            {/* Property list (Attio style): icon + label, then the value;
                empty values read as a quiet placeholder. */}
            <Facts
              projectId={projectId}
              canEdit={canManage}
              rows={[
                {
                  icon: CalendarDays,
                  label: t("colStart"),
                  field: "start_date",
                  kind: "date",
                  value: project.start_date,
                  display: project.start_date
                    ? day(project.start_date, dateLocale)
                    : null,
                },
                {
                  icon: CalendarRange,
                  label: t("colQuarter"),
                  field: "quarter_id",
                  kind: "quarter",
                  value: project.quarter_id,
                },
                {
                  icon: Tag,
                  label: t("colCategory"),
                  field: "category_id",
                  kind: "category",
                  value: project.category_id ?? null,
                  display:
                    categories.find((c) => c.id === project.category_id)
                      ?.name ?? null,
                },
                {
                  icon: Building2,
                  label: t("factsClient"),
                  field: "client_name",
                  value: client?.name ?? null,
                  readOnly: true,
                  // Contact, email and phone on hover, not as rows.
                  render: client && (
                    <ClientContact
                      name={client.name}
                      contact={client.contact_name}
                      email={client.email}
                      phone={client.phone}
                    />
                  ),
                },
              ]}
            />
            <DesignLinks projectId={projectId} />
            <section className="border-border flex flex-col gap-2 border-t pt-4">
              <h3 className="text-muted-foreground flex min-h-7 items-center gap-2 [&_svg]:size-4">
                <UsersRound aria-hidden="true" />
                <span className="flex-1">{t("colTeam")}</span>
                {canMove && (
                  // Straight to the team (the project form), without the
                  // trip to Pengaturan.
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("editProjectAndTeam")}
                    title={t("editProjectAndTeam")}
                    className="text-muted-foreground -my-1"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil />
                  </Button>
                )}
              </h3>
              {team.length === 0 ? (
                <p className="text-muted-foreground">{t("noMembersYet")}</p>
              ) : (
                team.map((m) => (
                  <div key={m.assignmentId} className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarImage src={m.avatar_url || undefined} alt="" />
                      <AvatarFallback className="text-[10px]">
                        {initials(m.full_name, "U")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate">
                      {m.full_name}
                    </span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {m.isLead ? t("lead") : m.role}
                    </span>
                  </div>
                ))
              )}
            </section>
          </aside>
        </div>
      </div>

      {canMove && editMounted && (
        <ProjectForm
          projectId={projectId}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={() => {
            invalidate("workspace")
            queryClient.invalidateQueries({
              queryKey: ["project-summary", projectId],
            })
          }}
        />
      )}

      <DashboardReportDialog
        projectId={projectId}
        viewer={viewer}
        open={reportOpen}
        onClose={() => setReportOpen(null)}
      />

      {canManage && (
        <>
          <PhaseSettingsDialog
            projectId={projectId}
            phases={phases}
            open={settingsFor !== null}
            focusId={typeof settingsFor === "string" ? settingsFor : null}
            onOpenChange={(open) => !open && setSettingsFor(null)}
          />
          <PhaseNameDialog
            open={phaseDialog !== null}
            onOpenChange={(open) => !open && setPhaseDialog(null)}
            initial={
              phaseDialog && phaseDialog !== "new" ? phaseDialog.name : ""
            }
            title={phaseDialog === "new" ? t("addPhase") : t("renamePhase")}
            onSave={savePhaseName}
          />
          {activePhase && (
            <ConfirmDialog
              open={completing}
              onOpenChange={setCompleting}
              title={t("completePhaseTitle", {
                name: clip(activePhase.name),
              })}
              description={t("completePhaseDescription")}
              confirmText={t("completePhase", { name: clip(activePhase.name) })}
              onConfirm={() => activate(activePhase, true)}
            />
          )}
          <StopPhasesDialog
            projectId={projectId}
            projectName={project.name}
            phaseCount={phases.length}
            stepCount={steps.length}
            open={stoppingPhases}
            onOpenChange={setStoppingPhases}
            onDone={() => setSelected(null)}
          />
          <ConfirmDialog
            open={deletingPhase !== null}
            onOpenChange={(open) => !open && setDeletingPhase(null)}
            title={t("deletePhaseTitle", {
              name: clip(deletingPhase?.name ?? ""),
            })}
            description={t("deletePhaseDescription")}
            confirmText={t("deletePhase")}
            variant="destructive"
            onConfirm={async () => {
              if (!deletingPhase) return
              const { error } = await supabase().rpc("delete_project_phase", {
                p_phase_id: deletingPhase.id,
              })
              if (error) return void toast.error(t("errSavePhase"))
              if (selected === deletingPhase.id) setSelected(null)
              invalidate("workspace", "steps", "tasks")
            }}
          />
        </>
      )}
    </div>
  )
}

/** Name for a new phase or a renamed one. */
/** Phase names inside a sentence (button, stat, title): long ones end in
 *  "…"; the full name stays in the tooltip. */

type PhaseDraft = { due: string; weight: string; doneAt: string }

/** "" → no weight (shares the rest); otherwise a number 0–100. */
function parseWeight(value: string): number | null | "invalid" {
  const raw = value.trim().replace(",", ".")
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : "invalid"
}

const pct = (n: number) => `${Math.round(n * 10) / 10}`

/**
 * Due date, SLA weight and (for done phases) the completion day of every
 * phase, in one list so the weights read against each other. Saving writes
 * only what changed.
 */
function PhaseSettingsDialog({
  projectId,
  phases,
  open,
  focusId,
  onOpenChange,
}: {
  projectId: string
  phases: PhaseRow[]
  open: boolean
  focusId: string | null
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("projects")
  const tc = useT("common")
  const invalidate = useInvalidate(projectId)
  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState<Record<string, PhaseDraft>>({})
  const [saving, setSaving] = useState(false)
  const today = todayJakarta()

  // Fresh from the rows each time it opens.
  useEffect(() => {
    if (!open) return
    setDrafts(
      Object.fromEntries(
        phases.map((p) => [
          p.id,
          {
            due: p.due_date ?? "",
            weight: p.sla_weight === null ? "" : String(p.sla_weight),
            doneAt: p.completed_at ? jakartaDay(p.completed_at) : "",
          },
        ]),
      ),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on open
  }, [open])

  const draftOf = (p: PhaseRow): PhaseDraft =>
    drafts[p.id] ?? { due: "", weight: "", doneAt: "" }
  const patch = (id: string, next: Partial<PhaseDraft>) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...next } }))

  // The split as the KPI will see it, live while typing.
  const parsed = phases.map((p) => parseWeight(draftOf(p).weight))
  const invalid = parsed.some((w) => w === "invalid")
  const effective = phaseWeights(
    phases.map((p, i) => ({
      ...p,
      sla_weight: typeof parsed[i] === "number" ? parsed[i] : null,
    })),
  )
  const setWeights = parsed.filter((w): w is number => typeof w === "number")
  const setTotal = setWeights.reduce((a, b) => a + b, 0)
  const free = phases.length - setWeights.length
  const scaled =
    setWeights.length > 0 &&
    (setTotal > 100 || (free === 0 && Math.abs(setTotal - 100) > 0.01))
  const total = [...effective.values()].reduce((a, b) => a + b, 0)
  const freeEach =
    free > 0
      ? (effective.get(phases.find((_, i) => parsed[i] === null)?.id ?? "") ??
        0)
      : 0

  const save = async () => {
    if (invalid) return
    setSaving(true)
    const db = supabase()
    const updates = phases.flatMap((p, i) => {
      const d = draftOf(p)
      const row: {
        due_date?: string | null
        sla_weight?: number | null
        completed_at?: string
      } = {}
      if ((d.due || null) !== p.due_date) row.due_date = d.due || null
      const w = parsed[i] as number | null
      if (w !== (p.sla_weight === null ? null : Number(p.sla_weight)))
        row.sla_weight = w
      // A corrected day lands at noon Jakarta, so it reads back as that day.
      if (p.completed_at && d.doneAt && d.doneAt !== jakartaDay(p.completed_at))
        row.completed_at = `${d.doneAt}T12:00:00+07:00`
      return Object.keys(row).length
        ? [db.from("project_phases").update(row).eq("id", p.id)]
        : []
    })
    const results = await Promise.all(updates)
    setSaving(false)
    if (results.some((r) => r.error)) {
      toast.error(t("errSavePhase"))
    } else {
      if (updates.length) toast.success(t("phasesSaved"))
      onOpenChange(false)
    }
    if (updates.length) {
      invalidate("workspace")
      // Scores are computed from these dates.
      queryClient.invalidateQueries({ queryKey: ["kpi"] })
      queryClient.invalidateQueries({ queryKey: ["kpi-team"] })
    }
  }

  const cols =
    "sm:grid-cols-[minmax(0,1fr)_9.5rem_6rem_9.5rem] sm:items-center sm:gap-x-2"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("phaseSettings")}</DialogTitle>
          <DialogDescription>{t("phaseSettingsDescription")}</DialogDescription>
        </DialogHeader>
        <div className="text-meta flex flex-col">
          <div
            className={cn(
              "text-muted-foreground scroll-gutter-match hidden px-2 pb-1.5 text-xs sm:grid",
              cols,
            )}
          >
            <span>{t("phaseColPhase")}</span>
            <span>{t("phaseColDue")}</span>
            <span>{t("phaseColWeight")}</span>
            <span>{t("phaseColDoneAt")}</span>
          </div>
          <ol className="scroll-pane flex max-h-[min(24rem,55vh)] flex-col">
            {phases.map((p, i) => {
              const d = draftOf(p)
              const bad = parsed[i] === "invalid"
              return (
                <li
                  key={p.id}
                  data-focused={p.id === focusId || undefined}
                  className={cn(
                    "data-focused:bg-muted/50 grid grid-cols-2 gap-x-2 gap-y-1.5 rounded-2xl px-2 py-1.5",
                    cols,
                  )}
                >
                  <span
                    className="col-span-2 flex min-w-0 items-center gap-1.5 sm:col-span-1"
                    title={p.name}
                  >
                    <span className="text-tertiary-foreground w-4 shrink-0 tabular-nums">
                      {i + 1}
                    </span>
                    {p.status === "done" && (
                      <RiCheckLine className="text-muted-foreground size-3.5 shrink-0" />
                    )}
                    <span className="truncate">{p.name}</span>
                  </span>
                  <DateField
                    aria-label={t("phaseDueLabel", { name: p.name })}
                    value={d.due}
                    onChange={(due) => patch(p.id, { due })}
                    className="h-7 w-full"
                  />
                  <InputGroup className="h-7">
                    <InputGroupInput
                      inputMode="decimal"
                      aria-label={t("phaseWeightLabel", { name: p.name })}
                      aria-invalid={bad || undefined}
                      // The share it gets now, as a hint while it's unset.
                      placeholder={pct(effective.get(p.id) ?? 0)}
                      value={d.weight}
                      onChange={(e) => patch(p.id, { weight: e.target.value })}
                      className="tabular-nums"
                    />
                    <InputGroupAddon align="inline-end">%</InputGroupAddon>
                  </InputGroup>
                  {p.completed_at ? (
                    <DateField
                      aria-label={t("phaseDoneAtLabel", { name: p.name })}
                      value={d.doneAt}
                      max={today}
                      onChange={(doneAt) =>
                        // A done phase always has a day; clearing keeps it.
                        doneAt && patch(p.id, { doneAt })
                      }
                      className="h-7 w-full"
                    />
                  ) : (
                    <span className="hidden px-3 sm:block">
                      <EmptyValue />
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
          <div className="text-muted-foreground mt-3 flex flex-col gap-0.5 px-2">
            <p>{t("phaseWeightNote")}</p>
            <p
              className={cn(
                "tabular-nums",
                (invalid || scaled) && "text-warning-ink",
              )}
              aria-live="polite"
            >
              {invalid
                ? t("phaseWeightInvalid")
                : [
                    free > 0 &&
                      t("phaseWeightSplit", { free, each: pct(freeEach) }),
                    scaled && t("phaseWeightScaled", { set: pct(setTotal) }),
                    t("phaseWeightTotal", { total: pct(total) }),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button disabled={saving || invalid} onClick={save}>
            {saving ? tc("saving") : tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PhaseNameDialog({
  open,
  onOpenChange,
  initial,
  title,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: string
  title: string
  onSave: (name: string) => Promise<void>
}) {
  const t = useT("projects")
  const tc = useT("common")
  const [name, setName] = useState(initial)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (open) setName(initial)
  }, [open, initial])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          id="phase-name-form"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!name.trim()) return
            setSaving(true)
            await onSave(name.trim().slice(0, PHASE_NAME_MAX))
            setSaving(false)
          }}
        >
          <Input
            autoFocus
            required
            maxLength={PHASE_NAME_MAX}
            aria-label={t("phaseName")}
            placeholder={t("phaseName")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button type="submit" form="phase-name-form" disabled={saving}>
            {saving ? tc("saving") : tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type Fact = {
  icon: LucideIcon
  label: string
  /** Column on `projects` this row edits. */
  field:
    | "start_date"
    | "quarter_id"
    | "category_id"
    | "client_name"
    | "client_contact"
    | "client_email"
    | "client_phone"
  kind?: "text" | "date" | "quarter" | "category"
  value: string | null
  /** Shown only; client details are edited on the client (Pengaturan). */
  readOnly?: boolean
  /** Formatted value to show (defaults to `value`). */
  display?: string | null
  /** Shown instead of the plain value (read-only rows). */
  render?: React.ReactNode
}

const NO_QUARTER = "__none"

/** An editable property value: plain text until hovered. */
const inlineValueClass =
  "hover:bg-accent aria-expanded:bg-muted/60 data-popup-open:bg-muted/60 -mx-1.5 h-7 w-auto min-w-0 flex-1 justify-between rounded-md border-0 bg-transparent px-1.5 font-normal shadow-none [&_svg]:opacity-0 hover:[&_svg]:opacity-100"

/** Quarters to pick from: last year to next year, plus the current value
 *  if it lies outside that. */
function quarterOptions(current: string | null) {
  const year = new Date().getFullYear()
  const list: string[] = []
  for (let y = year + 1; y >= year - 1; y--)
    for (let q = 4; q >= 1; q--) list.push(`${y}-Q${q}`)
  if (current && !list.includes(current)) list.push(current)
  return list
}

/**
 * Project properties (Attio style): icon + label, then the value, which
 * admins edit in place (Enter / blur saves, Escape reverts). Empty values
 * read as a quiet placeholder.
 */
function Facts({
  projectId,
  canEdit,
  rows,
}: {
  projectId: string
  canEdit: boolean
  rows: Fact[]
}) {
  const t = useT("projects")
  const invalidate = useInvalidate(projectId)

  const save = async (field: Fact["field"], next: string) => {
    const { error } = await supabase()
      .from("projects")
      .update({ [field]: next || null })
      .eq("id", projectId)
    if (error) toast.error(t("errSaveProject"))
    invalidate("workspace")
  }

  return (
    <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3">
      {rows.map(
        ({
          icon: Icon,
          label,
          field,
          kind,
          value,
          display,
          readOnly,
          render,
        }) => (
          <div key={field} className="contents">
            <dt className="text-muted-foreground flex min-h-8 items-center gap-2 [&_svg]:size-4 [&_svg]:shrink-0">
              <Icon aria-hidden="true" />
              <span className="truncate">{label}</span>
            </dt>
            <dd className="flex min-h-8 min-w-0 items-center">
              {canEdit && !readOnly && kind === "quarter" ? (
                <Select
                  value={value ?? NO_QUARTER}
                  onValueChange={(v) => {
                    const next = !v || v === NO_QUARTER ? "" : String(v)
                    if (next !== (value ?? "")) void save(field, next)
                  }}
                >
                  <SelectTrigger
                    aria-label={label}
                    className={cn(
                      inlineValueClass,
                      value ? "text-foreground" : "text-tertiary-foreground",
                    )}
                  >
                    <SelectValue>
                      {(v: string) =>
                        !v || v === NO_QUARTER ? t("factsNotSet") : v
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent align="end" className="max-h-72">
                    <SelectItem value={NO_QUARTER}>
                      {t("factsNotSet")}
                    </SelectItem>
                    {quarterOptions(value).map((q) => (
                      <SelectItem key={q} value={q}>
                        {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : canEdit && !readOnly && kind === "category" ? (
                <CategoryPicker
                  value={value}
                  onChange={(id) => {
                    if ((id ?? "") !== (value ?? "")) void save(field, id ?? "")
                  }}
                  className={inlineValueClass}
                />
              ) : canEdit && !readOnly && kind === "date" ? (
                // The app's date picker, dressed as an inline value.
                <DatePicker
                  aria-label={label}
                  placeholder={t("factsNotSet")}
                  value={value ? parseISO(value) : undefined}
                  onChange={(date) => {
                    const next = date ? format(date, "yyyy-MM-dd") : ""
                    if (next !== (value ?? "")) void save(field, next)
                  }}
                  className="text-foreground hover:bg-accent aria-expanded:bg-muted/60 -mx-1.5 h-7 w-auto min-w-0 flex-1 border-0 bg-transparent px-1.5 font-normal shadow-none has-data-[icon=inline-start]:pl-1.5 [&_[data-icon=inline-start]]:hidden"
                  align="end"
                />
              ) : canEdit && !readOnly ? (
                <InlineText
                  value={value ?? ""}
                  aria-label={label}
                  placeholder={t("factsNotSet")}
                  onSave={(next) => save(field, next)}
                  className="h-7 text-sm font-normal"
                />
              ) : render ? (
                render
              ) : (
                <span
                  className={cn(
                    "truncate px-0 text-sm font-normal",
                    !value && "text-tertiary-foreground",
                  )}
                  title={value ?? undefined}
                >
                  {display ?? value ?? t("factsNotSet")}
                </span>
              )}
            </dd>
          </div>
        ),
      )}
    </dl>
  )
}

/** The client's name; its contact, email and phone in a card on hover. */
function ClientContact({
  name,
  contact,
  email,
  phone,
}: {
  name: string
  contact: string | null
  email: string | null
  phone: string | null
}) {
  const rows = [
    { icon: UserRound, value: contact, href: null },
    { icon: AtSign, value: email, href: email && `mailto:${email}` },
    {
      icon: Phone,
      value: phone,
      href: phone && `tel:${phone.replace(/\s/g, "")}`,
    },
  ].filter((r) => r.value)
  if (rows.length === 0) return <span className="truncate text-sm">{name}</span>
  return (
    // Opens on hover with a mouse, on tap / Enter elsewhere.
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={150}
        className="decoration-muted-foreground/40 focus-visible:ring-focus-ring min-w-0 truncate rounded-sm text-left text-sm underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-2"
      >
        {name}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="flex w-64 flex-col gap-2 p-3 text-sm"
      >
        {rows.map(({ icon: Icon, value, href }) => (
          <span key={value} className="flex min-w-0 items-center gap-2">
            <Icon className="text-muted-foreground size-4 shrink-0" />
            {href ? (
              <a href={href} className="hover:text-primary truncate">
                {value}
              </a>
            ) : (
              <span className="truncate">{value}</span>
            )}
          </span>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function ProjectAbout({
  projectId,
  description,
  canEdit,
}: {
  projectId: string
  description: string | null
  canEdit: boolean
}) {
  const t = useT("projects")
  const invalidate = useInvalidate(projectId)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(description ?? "")

  const save = async () => {
    setEditing(false)
    if ((description ?? "") === value.trim()) return
    const { error } = await supabase()
      .from("projects")
      .update({ description: value.trim() || null })
      .eq("id", projectId)
    if (error) toast.error(t("errSaveDescription"))
    invalidate("workspace")
  }

  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="font-medium">{t("colProject")}</h3>
      {editing ? (
        <Textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          placeholder={t("aboutPlaceholder")}
          className="min-h-16"
        />
      ) : (
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => setEditing(true)}
          className={cn(
            "text-left whitespace-pre-line",
            description ? "text-foreground/90" : "text-muted-foreground",
            canEdit && "hover:text-foreground",
          )}
        >
          {description || (canEdit ? t("aboutAdd") : t("aboutEmpty"))}
        </button>
      )}
    </section>
  )
}

function ProcessPanel({
  projectId,
  phase,
  steps,
  viewerId,
}: {
  projectId: string
  phase: PhaseRow
  steps: StepRow[]
  viewerId: string | null
}) {
  const t = useT("projects")
  const tu = useT("undo")
  const invalidate = useInvalidate(projectId)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState("")

  const add = async () => {
    const value = title.trim()
    if (!value) {
      setAdding(false)
      return
    }
    const { error } = await supabase().from("project_steps").insert({
      project_id: projectId,
      phase_id: phase.id,
      title: value,
      position: steps.length,
      created_by: viewerId,
    })
    if (error) {
      toast.error(t("errAddStep"))
      return
    }
    setTitle("")
    invalidate("steps")
  }

  const toggle = async (id: string, done: boolean) => {
    const step = steps.find((s) => s.id === id)
    const status = done ? "done" : "draft"
    const { error } = await supabase()
      .from("project_steps")
      .update({ status })
      .eq("id", id)
    invalidate("steps")
    if (!error && step && step.status !== status)
      registerUndo(
        rowsUndo({
          label: tu("stepStatus", { name: clip(step.title) }),
          table: "project_steps",
          rows: [{ id, before: { status: step.status }, after: { status } }],
          done: () => invalidate("steps"),
        }),
      )
  }

  const remove = async (id: string) => {
    await supabase().from("project_steps").delete().eq("id", id)
    invalidate("steps")
  }

  const update = async (id: string, patch: { title?: string }) => {
    const step = steps.find((s) => s.id === id)
    const { error } = await supabase()
      .from("project_steps")
      .update(patch)
      .eq("id", id)
    if (error) toast.error(t("errSaveStep"))
    invalidate("steps")
    if (
      !error &&
      step &&
      patch.title !== undefined &&
      patch.title !== step.title
    )
      registerUndo(
        rowsUndo({
          label: tu("stepRename", { name: clip(patch.title) }),
          table: "project_steps",
          rows: [
            {
              id,
              before: { title: step.title },
              after: { title: patch.title },
            },
          ],
          done: () => invalidate("steps"),
        }),
      )
  }

  /** Swap with the neighbor, then number the phase's steps 0..n. */
  const move = async (id: string, direction: -1 | 1) => {
    const ids = steps.map((s) => s.id)
    const from = ids.indexOf(id)
    const to = from + direction
    if (to < 0 || to >= ids.length) return
    ;[ids[from], ids[to]] = [ids[to], ids[from]]
    const db = supabase()
    const results = await Promise.all(
      ids.map((stepId, position) =>
        db.from("project_steps").update({ position }).eq("id", stepId),
      ),
    )
    invalidate("steps")
    // ⌘Z: every step of the phase back at its old position.
    if (!results.some((r) => r.error))
      registerUndo(
        rowsUndo({
          label: tu("stepOrder"),
          table: "project_steps",
          rows: ids.map((stepId, position) => ({
            id: stepId,
            before: {
              position: steps.find((s) => s.id === stepId)?.position ?? null,
            },
            after: { position },
          })),
          done: () => invalidate("steps"),
        }),
      )
  }

  return (
    <section className={cn(surfaceClassName, "flex flex-col")}>
      <header className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <h2 className="min-w-0 truncate text-sm font-medium" title={phase.name}>
          {t("processTitle", { name: clip(phase.name) })}
        </h2>
        <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>
          <RiAddLine data-icon="inline-start" />
          {t("step")}
        </Button>
      </header>
      <div className="flex flex-col">
        {steps.map((step, i) => {
          const done = step.status === "done"
          return (
            <ContextTarget
              key={step.id}
              type="project-step"
              id={step.id}
              label={step.title}
              suppress={["button"]}
              items={(ctx): CtxItem[] => [
                {
                  id: "toggle",
                  label: done ? t("markUndone") : t("markDone"),
                  icon: done ? CircleDashed : RiCheckLine,
                  onSelect: () => toggle(step.id, !done),
                },
                {
                  id: "rename",
                  label: t("libRename"),
                  icon: Pencil,
                  // Its title is an inline field: put the cursor in it.
                  onSelect: () => {
                    const field = ctx.el.querySelector("input")
                    field?.focus()
                    field?.select()
                  },
                },
                {
                  id: "up",
                  label: t("moveUp"),
                  icon: ArrowUp,
                  disabled: i === 0,
                  onSelect: () => move(step.id, -1),
                },
                {
                  id: "down",
                  label: t("moveDown"),
                  icon: ArrowDown,
                  disabled: i === steps.length - 1,
                  onSelect: () => move(step.id, 1),
                },
                {
                  id: "delete",
                  label: t("deleteStep"),
                  icon: Trash2,
                  destructive: true,
                  confirm: true,
                  onSelect: () => remove(step.id),
                },
              ]}
            >
              <div
                data-slot="project-step"
                className="group/step border-border flex h-11 items-center gap-3 border-b pr-2 pl-4 text-sm last:border-b-0"
              >
                <button
                  type="button"
                  aria-label={done ? t("markUndone") : t("markDone")}
                  onClick={() => toggle(step.id, !done)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {done ? (
                    <span className="bg-success text-background flex size-4 items-center justify-center rounded-full">
                      <RiCheckLine className="size-3" />
                    </span>
                  ) : (
                    <CircleDashed className="size-4" />
                  )}
                </button>
                {/* One line per step: title, status, actions (no note). */}
                <InlineText
                  value={step.title}
                  required
                  aria-label={step.title}
                  className={cn(
                    "min-w-0 flex-1",
                    done && "text-muted-foreground line-through",
                  )}
                  onSave={(title) => update(step.id, { title })}
                />
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs",
                    done
                      ? "bg-success-subtle text-success-ink"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? t("statusCompleted") : t("stepDraft")}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("stepActions")}
                        className="text-muted-foreground shrink-0 opacity-0 group-hover/step:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100"
                      />
                    }
                  >
                    <RiMoreFill />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-40">
                    <DropdownMenuItem
                      disabled={i === 0}
                      onClick={() => move(step.id, -1)}
                    >
                      {t("moveUp")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={i === steps.length - 1}
                      onClick={() => move(step.id, 1)}
                    >
                      {t("moveDown")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => remove(step.id)}
                    >
                      <RiDeleteBinLine />
                      {t("deleteStep")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </ContextTarget>
          )
        })}
        {adding ? (
          <div className="flex items-center gap-2 px-4 py-2">
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") add()
                if (e.key === "Escape") {
                  setAdding(false)
                  setTitle("")
                }
              }}
              onBlur={add}
              placeholder={t("stepPlaceholder", { name: clip(phase.name) })}
              className="h-8"
            />
          </div>
        ) : (
          steps.length === 0 && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="text-muted-foreground hover:text-foreground px-4 py-8 text-center text-sm"
            >
              {t("stepsEmpty", { name: clip(phase.name) })}
            </button>
          )
        )}
      </div>
    </section>
  )
}

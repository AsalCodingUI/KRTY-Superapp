"use client"

import { useProjectHref } from "@/shared/hooks/useProjectHref"
import { surfaceClassName } from "@/components/panel"
import {
  OPEN_STATUSES,
  STATUS_LABEL_KEYS,
} from "@/page-slices/projects/lib/status"
import { PageHeader } from "@/components/page-header"
import {
  DashboardReportDialog,
  LatestReports,
  UpcomingTasks,
} from "./DashboardHome"
import { DesignLinks } from "./DesignLinks"
import { ProjectProperties } from "./ProjectProperties"
import type { Report } from "./reports-data"
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
  RiCalendarScheduleLine,
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiMoreFill,
} from "@/shared/ui/lucide-icons"
import {
  daysBetween,
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
  type LucideIcon,
} from "lucide-react"
import { AnimatePresence, m, useReducedMotion } from "motion/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  supabase,
  useInvalidate,
  useSteps,
  useTasks,
  useViewer,
  useWorkspace,
  type PhaseRow,
  type StepRow,
} from "./data"

const day = (date: string | null, locale: Locale) =>
  date ? format(new Date(date), "d MMM yyyy", { locale }) : "—"

/**
 * Project home (DesignerHQ-style): phases = the SLA milestones
 * (copied from the project's process), the process steps of a phase, and
 * the project facts on the right.
 */
export function ProjectDashboard({ projectId }: { projectId: string }) {
  const t = useT("projects")
  const dateLocale = useDateLocale()
  const { data, isLoading } = useWorkspace(projectId)
  const base = useProjectHref(projectId)
  const { data: steps = [] } = useSteps(projectId)
  const { data: tasks = [] } = useTasks(projectId)
  const viewer = useViewer()
  const invalidate = useInvalidate(projectId)
  const [selected, setSelected] = useState<string | null>(null)
  // Adding or renaming a phase (one small dialog), and deleting one.
  const [phaseDialog, setPhaseDialog] = useState<PhaseRow | "new" | null>(null)
  const [deletingPhase, setDeletingPhase] = useState<PhaseRow | null>(null)
  const [completing, setCompleting] = useState(false)
  // Due dates, SLA weights and completion days (one dialog for all phases;
  // the id is the phase it was opened from, highlighted there).
  const [settingsFor, setSettingsFor] = useState<string | true | null>(null)
  // The report window: a new report, or one opened from the list.
  const [reportOpen, setReportOpen] = useState<{
    report: Report | null
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
  const openTasks = tasks.filter((task) => !task.done && !task.parent_id).length

  /** Make `phase` the active one: earlier phases done, later ones to do. */
  const activate = async (phase: PhaseRow, completeIt = false) => {
    const db = supabase()
    const now = new Date().toISOString()
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
    }
    setPhaseDialog(null)
    invalidate("workspace")
  }

  const movePhase = async (phase: PhaseRow, direction: -1 | 1) => {
    const ids = phases.map((p) => p.id)
    const from = ids.indexOf(phase.id)
    const to = from + direction
    if (to < 0 || to >= ids.length) return
    ;[ids[from], ids[to]] = [ids[to], ids[from]]
    const { error } = await supabase().rpc("reorder_project_phases", {
      p_project_id: projectId,
      p_ids: ids,
    })
    if (error) toast.error(t("errSavePhase"))
    invalidate("workspace")
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        title={
          <span className="flex min-w-0 items-center gap-3">
            <ProjectAvatar
              id={project.id}
              name={project.name}
              className="size-7 rounded-[5px] text-[11px]"
            />
            <span className="min-w-0 truncate">{project.name}</span>
          </span>
        }
        actions={
          <Button onClick={() => setReportOpen({ report: null })}>
            <RiAddLine data-icon="inline-start" />
            {t("reportNew")}
          </Button>
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
      />
      <div className="flex flex-col gap-4 pt-6 pb-4">
        <PhaseRail
          phases={phases}
          steps={steps}
          selectedId={current?.id ?? null}
          onSelect={setSelected}
          isAdmin={viewer.isAdmin}
          onAdd={() => setPhaseDialog("new")}
          onActivate={activate}
          onRename={(phase) => setPhaseDialog(phase)}
          onMove={movePhase}
          onDelete={(phase) => setDeletingPhase(phase)}
          onSettings={(phase) => setSettingsFor(phase?.id ?? true)}
          onComplete={() => setCompleting(true)}
          // Only running projects still need due dates for the KPI.
          showMissingDue={
            project.status !== null && OPEN_STATUSES.includes(project.status)
          }
        />

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
              canEdit={viewer.isAdmin}
            />
            {/* Property list (Attio style): icon + label, then the value;
                empty values read as a quiet placeholder. */}
            <Facts
              projectId={projectId}
              canEdit={viewer.isAdmin}
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
                  value: project.quarter_id,
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
              <h3 className="text-muted-foreground flex items-center gap-2 [&_svg]:size-4">
                <UsersRound aria-hidden="true" />
                {t("colTeam")}
              </h3>
              {team.length === 0 ? (
                <p className="text-muted-foreground">{t("noMembersYet")}</p>
              ) : (
                team.map((m) => (
                  <div key={m.assignmentId} className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarImage src={m.avatar_url || undefined} alt="" />
                      <AvatarFallback className="text-[10px]">
                        {(m.full_name || "U").slice(0, 2).toUpperCase()}
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

      <DashboardReportDialog
        projectId={projectId}
        viewer={viewer}
        open={reportOpen}
        onClose={() => setReportOpen(null)}
      />

      {viewer.isAdmin && (
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
const PHASE_NAME_MAX = 40
function clip(name: string, max = 28) {
  return name.length > max ? `${name.slice(0, max - 1).trimEnd()}…` : name
}

/**
 * The project's phases as one thin progress rail (left to right): a filled
 * segment per finished phase, the active one filled by its finished steps.
 * Long names truncate (full name on hover); with many phases each keeps a
 * minimum width and the rail scrolls sideways, fading at the edges, with the
 * selected phase kept in view.
 */
export function PhaseRail({
  phases,
  steps,
  selectedId,
  onSelect,
  isAdmin,
  onAdd,
  onActivate,
  onRename,
  onMove,
  onDelete,
  onSettings,
  onComplete,
  showMissingDue,
}: {
  phases: PhaseRow[]
  steps: { phase_id: string | null; status: string }[]
  selectedId: string | null
  onSelect: (id: string) => void
  isAdmin: boolean
  onAdd: () => void
  onActivate: (phase: PhaseRow) => void
  onRename: (phase: PhaseRow) => void
  onMove: (phase: PhaseRow, delta: -1 | 1) => void
  onDelete: (phase: PhaseRow) => void
  /** Opens the phase settings (due dates, weights), on a phase or all. */
  onSettings: (phase?: PhaseRow) => void
  /** Finishes the running phase (its ⋯ menu); admins only. */
  onComplete?: () => void
  showMissingDue: boolean
}) {
  const t = useT("projects")
  const dateLocale = useDateLocale()
  const reduce = useReducedMotion()
  const scroller = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })
  // Days are Jakarta days, the same ones the KPI scores by.
  const today = todayJakarta()
  const shortDay = (d: string) =>
    format(parseISO(d), "d MMM", { locale: dateLocale })
  const missingDue = phases.filter((p) => !p.due_date).length

  // Fade only the side(s) that have more phases to scroll to.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const update = () =>
      setEdges({
        start: el.scrollLeft > 1,
        end: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      })
    update()
    el.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      el.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [phases.length])

  // Keep the selected phase in view when the rail scrolls.
  useEffect(() => {
    scroller.current
      ?.querySelector<HTMLElement>("[data-selected]")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [selectedId])

  const fade = 24
  const mask =
    edges.start || edges.end
      ? `linear-gradient(to right, ${edges.start ? "transparent" : "#000"}, #000 ${fade}px, #000 calc(100% - ${fade}px), ${edges.end ? "transparent" : "#000"})`
      : undefined

  return (
    <section className="flex flex-col gap-3">
      <div className="flex min-h-7 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="text-foreground shrink-0 font-medium">
            {t("phasesTitle")}
          </span>
          {/* Without due dates the KPI can't judge a phase; say so here. */}
          <AnimatePresence initial={false}>
            {isAdmin && showMissingDue && missingDue > 0 && (
              <m.div
                initial={reduce ? false : { opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: -4 }}
                transition={{ duration: 0.2, ease: EASE }}
                className="bg-warning-subtle ml-1 flex min-w-0 items-center gap-1.5 rounded-full py-0.5 pr-0.5 pl-2 text-xs"
              >
                <RiErrorWarningLine className="text-warning size-3.5 shrink-0" />
                <span className="text-foreground/80 min-w-0 truncate">
                  {t("phasesMissingDue", { n: missingDue })}
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-foreground h-5 shrink-0 rounded-full px-2 font-medium"
                  onClick={() => onSettings()}
                >
                  {t("phaseSetDue")}
                </Button>
              </m.div>
            )}
          </AnimatePresence>
        </div>
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("phaseActions")}
                  className="text-muted-foreground"
                />
              }
            >
              <RiMoreFill />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {phases.length > 0 && (
                <DropdownMenuItem onClick={() => onSettings()}>
                  <RiCalendarScheduleLine />
                  {t("phaseSettings")}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onAdd}>
                <RiAddLine />
                {t("addPhase")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div
        ref={scroller}
        className="-m-1 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        <ol
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${phases.length || 1}, minmax(12rem, 1fr))`,
          }}
        >
          {phases.map((phase, i) => {
            const phaseSteps = steps.filter((s) => s.phase_id === phase.id)
            const doneSteps = phaseSteps.filter(
              (s) => s.status === "done",
            ).length
            const selected = phase.id === selectedId
            const isDone = phase.status === "done"
            const isActive = phase.status === "active"
            const fill = isDone
              ? 100
              : phaseSteps.length
                ? (doneSteps / phaseSteps.length) * 100
                : 0
            const doneDay = phase.completed_at
              ? jakartaDay(phase.completed_at)
              : null
            const status = isDone
              ? t("phaseDoneOn", { date: doneDay ? shortDay(doneDay) : "" })
              : isActive
                ? t("phaseInProgress")
                : t("phaseNotStarted")
            // Late is late either way: still open past the due date
            // (automatic Delay), or finished after it.
            const due = phase.due_date
            const overdueDays =
              due && !isDone && today > due ? daysBetween(due, today) : 0
            const overdue = overdueDays > 0
            const lateBy =
              due && isDone && doneDay && doneDay > due
                ? daysBetween(due, doneDay)
                : 0
            const dueTitle = overdue
              ? t("phaseOverdueTitle", { days: overdueDays })
              : lateBy
                ? t("phaseDoneLateTitle", { days: lateBy })
                : undefined
            return (
              <li
                key={phase.id}
                data-slot="project-phase"
                data-selected={selected || undefined}
                className={cn(
                  surfaceClassName,
                  "group/phase relative flex min-w-0 flex-col gap-3 p-3.5 transition-colors",
                  // The picked phase: a faint grey fill, the usual border.
                  selected ? "bg-muted/60" : "hover:bg-muted/30",
                )}
              >
                <button
                  type="button"
                  aria-label={phase.name}
                  aria-current={selected ? "step" : undefined}
                  onClick={() => onSelect(phase.id)}
                  className="focus-visible:ring-focus-ring absolute inset-0 rounded-xl outline-none focus-visible:ring-2"
                />
                {/* 1. Marker and name; ⋯ keeps its place on the right. */}
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium tabular-nums",
                      isDone
                        ? "bg-success text-white"
                        : isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {isDone ? <RiCheckLine className="size-3" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm font-medium",
                      isDone || isActive || selected
                        ? "text-foreground"
                        : "text-muted-foreground group-hover/phase:text-foreground",
                    )}
                    title={phase.name}
                  >
                    {phase.name}
                  </span>
                  {isAdmin && <span className="size-6 shrink-0" />}
                </span>
                {/* 2. Status, and the due date (red when overdue). */}
                <span className="flex min-w-0 items-center justify-between gap-2 text-[13px]">
                  <span
                    className={cn(
                      "text-muted-foreground truncate",
                      isActive && "text-primary",
                      lateBy > 0 && "text-warning",
                    )}
                    title={dueTitle ?? status}
                  >
                    {status}
                  </span>
                  {due && !isDone && (
                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-1 tabular-nums",
                        overdue
                          ? "text-destructive font-medium"
                          : "text-tertiary-foreground",
                      )}
                      title={dueTitle ?? t("phaseDue", { date: shortDay(due) })}
                    >
                      <RiCalendarScheduleLine className="size-3.5" />
                      {shortDay(due)}
                    </span>
                  )}
                </span>
                {/* 3. Its steps: the bar and the count. */}
                <span className="flex items-center gap-2.5">
                  <span className="bg-muted relative h-1.5 flex-1 overflow-hidden rounded-full">
                    <span
                      className={cn(
                        "bar-grow absolute inset-y-0 left-0 rounded-full",
                        isDone ? "bg-success" : "bg-primary",
                      )}
                      style={{ "--bar": `${fill}%` } as React.CSSProperties}
                    />
                  </span>
                  <span className="text-tertiary-foreground shrink-0 text-xs tabular-nums">
                    {phaseSteps.length
                      ? t("phaseStepsDone", {
                          done: doneSteps,
                          total: phaseSteps.length,
                        })
                      : t("phaseNoSteps")}
                  </span>
                </span>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={t("phaseActions")}
                          className="text-muted-foreground absolute top-3.5 right-3 opacity-0 group-hover/phase:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100 pointer-coarse:opacity-100"
                        />
                      }
                    >
                      <RiMoreFill />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-44">
                      {isActive && onComplete && (
                        <>
                          <DropdownMenuItem onClick={onComplete}>
                            <RiCheckLine />
                            {t("completePhase", { name: clip(phase.name) })}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {phase.status !== "active" && (
                        <DropdownMenuItem onClick={() => onActivate(phase)}>
                          {t("makeActive")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onRename(phase)}>
                        {t("renamePhase")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSettings(phase)}>
                        {t("phaseSettings")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={i === 0}
                        onClick={() => onMove(phase, -1)}
                      >
                        {t("movePhaseLeft")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={i === phases.length - 1}
                        onClick={() => onMove(phase, 1)}
                      >
                        {t("movePhaseRight")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDelete(phase)}
                      >
                        {t("deletePhase")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

const EASE = [0.23, 1, 0.32, 1] as const

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
        <div className="flex flex-col text-[13px]">
          <div
            className={cn(
              "text-muted-foreground hidden px-2 pb-1.5 text-xs sm:grid",
              cols,
            )}
          >
            <span>{t("phaseColPhase")}</span>
            <span>{t("phaseColDue")}</span>
            <span>{t("phaseColWeight")}</span>
            <span>{t("phaseColDoneAt")}</span>
          </div>
          <ol className="flex max-h-[min(24rem,55vh)] flex-col overflow-y-auto">
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
                (invalid || scaled) && "text-warning",
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
    | "client_name"
    | "client_contact"
    | "client_email"
    | "client_phone"
  kind?: "text" | "date"
  value: string | null
  /** Shown only; client details are edited on the client (Pengaturan). */
  readOnly?: boolean
  /** Formatted value to show (defaults to `value`). */
  display?: string | null
  /** Shown instead of the plain value (read-only rows). */
  render?: React.ReactNode
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
              {canEdit && !readOnly && kind === "date" ? (
                // The app's date picker, dressed as an inline value.
                <DatePicker
                  aria-label={label}
                  placeholder={t("factsNotSet")}
                  value={value ? parseISO(value) : undefined}
                  onChange={(date) => {
                    const next = date ? format(date, "yyyy-MM-dd") : ""
                    if (next !== (value ?? "")) void save(field, next)
                  }}
                  className="text-foreground hover:bg-muted/60 aria-expanded:bg-muted/60 -mx-1.5 h-7 w-auto min-w-0 flex-1 border-0 bg-transparent px-1.5 font-normal shadow-none has-data-[icon=inline-start]:pl-1.5 [&_[data-icon=inline-start]]:hidden"
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
    await supabase()
      .from("project_steps")
      .update({ status: done ? "done" : "draft" })
      .eq("id", id)
    invalidate("steps")
  }

  const remove = async (id: string) => {
    await supabase().from("project_steps").delete().eq("id", id)
    invalidate("steps")
  }

  const update = async (id: string, patch: { title?: string }) => {
    const { error } = await supabase()
      .from("project_steps")
      .update(patch)
      .eq("id", id)
    if (error) toast.error(t("errSaveStep"))
    invalidate("steps")
  }

  /** Swap with the neighbor, then number the phase's steps 0..n. */
  const move = async (id: string, direction: -1 | 1) => {
    const ids = steps.map((s) => s.id)
    const from = ids.indexOf(id)
    const to = from + direction
    if (to < 0 || to >= ids.length) return
    ;[ids[from], ids[to]] = [ids[to], ids[from]]
    const db = supabase()
    await Promise.all(
      ids.map((stepId, position) =>
        db.from("project_steps").update({ position }).eq("id", stepId),
      ),
    )
    invalidate("steps")
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
            <div
              key={step.id}
              data-slot="project-step"
              className="group/step border-border/50 flex h-11 items-center gap-3 border-b pr-2 pl-4 text-sm last:border-b-0"
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
                    ? "bg-success/15 text-success"
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

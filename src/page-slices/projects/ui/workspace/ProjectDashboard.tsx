"use client"

import { surfaceClassName } from "@/components/panel"
import { STATUS_LABEL_KEYS } from "@/page-slices/projects/lib/status"
import { PageHeader } from "@/components/page-header"
import { StatStrip } from "@/components/stat-strip"
import { ProjectAvatar } from "@/components/project-avatar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DatePicker } from "@/components/date-picker"
import { InlineText } from "@/components/inline-text"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  RiAddLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiMoreFill,
} from "@/shared/ui/lucide-icons"
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
import { useEffect, useMemo, useRef, useState } from "react"
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
  const { data: steps = [] } = useSteps(projectId)
  const { data: tasks = [] } = useTasks(projectId)
  const viewer = useViewer()
  const invalidate = useInvalidate(projectId)
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Adding or renaming a phase (one small dialog), and deleting one.
  const [phaseDialog, setPhaseDialog] = useState<PhaseRow | "new" | null>(null)
  const [deletingPhase, setDeletingPhase] = useState<PhaseRow | null>(null)

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
    setBusy(true)
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
    setBusy(false)
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
          viewer.isAdmin && (
            <>
              {activePhase && (
                <Button
                  variant="outline"
                  disabled={busy}
                  title={activePhase.name}
                  onClick={() => activate(activePhase, true)}
                >
                  {t("completePhase", { name: clip(activePhase.name) })}
                </Button>
              )}
            </>
          )
        }
      />
      <StatStrip
        items={[
          {
            key: "status",
            label: t("colStatus"),
            value: project.status ? t(STATUS_LABEL_KEYS[project.status]) : "—",
          },
          {
            key: "phase",
            label: t("factsPhase"),
            value: activePhase
              ? t("factsPhaseValue", {
                  name: clip(activePhase.name),
                  n: activePhase.position,
                  total: phases.length,
                })
              : t("statusCompleted"),
          },
          {
            key: "tasks",
            label: t("factsOpenTasks"),
            value: openTasks,
          },
          {
            key: "deadline",
            label: t("factsDeadline"),
            value: day(project.end_date, dateLocale),
          },
        ]}
      />
      <div className="flex flex-col gap-6 pt-6 pb-4">
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
        />

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {current && (
            <ProcessPanel
              projectId={projectId}
              phase={current}
              steps={steps.filter((s) => s.phase_id === current.id)}
              viewerId={viewer.id}
            />
          )}

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
                },
                {
                  icon: UserRound,
                  label: t("factsContact"),
                  field: "client_contact",
                  value: client?.contact_name ?? null,
                  readOnly: true,
                },
                {
                  icon: AtSign,
                  label: t("factsEmail"),
                  field: "client_email",
                  value: client?.email ?? null,
                  readOnly: true,
                },
                {
                  icon: Phone,
                  label: t("factsPhone"),
                  field: "client_phone",
                  value: client?.phone ?? null,
                  readOnly: true,
                },
              ]}
            />
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

      {viewer.isAdmin && (
        <>
          <PhaseNameDialog
            open={phaseDialog !== null}
            onOpenChange={(open) => !open && setPhaseDialog(null)}
            initial={
              phaseDialog && phaseDialog !== "new" ? phaseDialog.name : ""
            }
            title={phaseDialog === "new" ? t("addPhase") : t("renamePhase")}
            onSave={savePhaseName}
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
function PhaseRail({
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
}) {
  const t = useT("projects")
  const dateLocale = useDateLocale()
  const scroller = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })
  const active = phases.find((p) => p.status === "active") ?? null

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
    <section className="flex flex-col gap-3 pb-4">
      <div className="flex min-h-7 items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm">
          {active ? (
            <>
              {t("phaseOfTotal", {
                n: phases.indexOf(active) + 1,
                total: phases.length,
              })}
              <span className="text-muted-foreground" title={active.name}>
                {" "}
                · {clip(active.name)}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">
              {t("phaseCount", { total: phases.length })}
            </span>
          )}
        </p>
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground shrink-0"
            onClick={onAdd}
          >
            <RiAddLine data-icon="inline-start" />
            {t("addPhase")}
          </Button>
        )}
      </div>

      <div
        ref={scroller}
        className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      >
        <ol
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${phases.length || 1}, minmax(8.5rem, 1fr))`,
          }}
        >
          {phases.map((phase, i) => {
            const phaseSteps = steps.filter((s) => s.phase_id === phase.id)
            const doneSteps = phaseSteps.filter(
              (s) => s.status === "done",
            ).length
            const open = phaseSteps.length - doneSteps
            const selected = phase.id === selectedId
            const fill =
              phase.status === "done"
                ? 100
                : phase.status === "active"
                  ? Math.max(
                      6,
                      phaseSteps.length
                        ? (doneSteps / phaseSteps.length) * 100
                        : 0,
                    )
                  : 0
            const meta =
              phase.status === "done"
                ? t("phaseDoneOn", {
                    date: phase.completed_at
                      ? format(new Date(phase.completed_at), "d MMM", {
                          locale: dateLocale,
                        })
                      : "",
                  })
                : phaseSteps.length
                  ? t("phaseStepsOpen", { open, total: phaseSteps.length })
                  : phase.status === "active"
                    ? t("phaseInProgress")
                    : t("phaseNotStarted")
            return (
              <li
                key={phase.id}
                data-slot="project-phase"
                data-selected={selected || undefined}
                className="group/phase relative flex min-w-0 flex-col gap-2"
              >
                <button
                  type="button"
                  aria-label={phase.name}
                  aria-current={selected ? "step" : undefined}
                  onClick={() => onSelect(phase.id)}
                  className="focus-visible:ring-focus-ring absolute -inset-1 rounded-md outline-none focus-visible:ring-2"
                />
                {/* The rail segment: thin, filled by progress. */}
                <span className="bg-muted relative h-[3px] overflow-hidden rounded-full">
                  <span
                    className={cn(
                      "bar-grow absolute inset-y-0 left-0 rounded-full",
                      phase.status === "done"
                        ? "bg-foreground/25"
                        : "bg-primary",
                    )}
                    style={{ "--bar": `${fill}%` } as React.CSSProperties}
                  />
                </span>
                <span className="flex min-w-0 items-center gap-1.5 pr-7">
                  {phase.status === "done" && (
                    <RiCheckLine className="text-muted-foreground size-3.5 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "truncate text-sm transition-colors",
                      selected
                        ? "text-foreground font-medium"
                        : phase.status === "todo"
                          ? "text-muted-foreground group-hover/phase:text-foreground"
                          : "text-foreground/80 group-hover/phase:text-foreground",
                    )}
                    title={phase.name}
                  >
                    {phase.name}
                  </span>
                </span>
                <span
                  className="text-tertiary-foreground -mt-1.5 truncate text-[13px]"
                  title={meta}
                >
                  {meta}
                </span>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("phaseActions")}
                          className="text-muted-foreground absolute top-2.5 right-0 opacity-0 group-hover/phase:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100"
                        />
                      }
                    >
                      <RiMoreFill />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-44">
                      {phase.status !== "active" && (
                        <DropdownMenuItem onClick={() => onActivate(phase)}>
                          {t("makeActive")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onRename(phase)}>
                        {t("renamePhase")}
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
        ({ icon: Icon, label, field, kind, value, display, readOnly }) => (
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

  const update = async (
    id: string,
    patch: { title?: string; description?: string | null },
  ) => {
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
              className="group/step border-border/50 flex min-h-11 items-center gap-3 border-b px-4 text-sm last:border-b-0"
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
              <span className="flex min-w-0 flex-1 flex-col py-1.5">
                <InlineText
                  value={step.title}
                  required
                  aria-label={step.title}
                  className={cn(done && "text-muted-foreground line-through")}
                  onSave={(title) => update(step.id, { title })}
                />
                <InlineText
                  value={step.description ?? ""}
                  placeholder={t("stepNotePlaceholder")}
                  className={cn(
                    "text-muted-foreground text-xs",
                    !step.description &&
                      "hidden group-focus-within/step:block group-hover/step:block",
                  )}
                  onSave={(description) =>
                    update(step.id, { description: description || null })
                  }
                />
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("stepActions")}
                      className="text-muted-foreground opacity-0 group-hover/step:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100"
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
              <span
                className={cn(
                  "rounded-sm px-1.5 py-0.5 text-xs",
                  done
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {done ? t("statusCompleted") : t("stepDraft")}
              </span>
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

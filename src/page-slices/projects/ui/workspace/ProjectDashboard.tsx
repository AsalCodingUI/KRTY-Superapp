"use client"

import { ProjectAvatar } from "@/components/project-avatar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  RiAddLine,
  RiCheckLine,
  RiDeleteBinLine,
} from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { CircleDashed } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
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

const STATUS_LABELS = {
  Active: "Aktif",
  Completed: "Selesai",
  Archived: "Diarsipkan",
} as const

const day = (date: string | null) =>
  date ? format(new Date(date), "d MMM yyyy", { locale: idLocale }) : "—"

/**
 * Project home (DesignerHQ-style): phases = the SLA milestones
 * (Wireframe → High Fidelity → Handover), the process steps of a phase, and
 * the project facts on the right.
 */
export function ProjectDashboard({ projectId }: { projectId: string }) {
  const { data, isLoading } = useWorkspace(projectId)
  const { data: steps = [] } = useSteps(projectId)
  const { data: tasks = [] } = useTasks(projectId)
  const viewer = useViewer()
  const invalidate = useInvalidate(projectId)
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
          <p className="text-muted-foreground text-sm">
            Project tidak ditemukan.
          </p>
        )}
      </div>
    )
  }
  const { project, team } = data
  const current = phases.find((p) => p.id === selected) ?? phases[0]
  const openTasks = tasks.filter((t) => !t.done && !t.parent_id).length

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
      toast.error("Gagal memperbarui phase.")
      return
    }
    toast.success(
      completeIt ? `${phase.name} selesai` : `${phase.name} jadi phase aktif`,
    )
    invalidate("workspace")
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ProjectAvatar
            id={project.id}
            name={project.name}
            className="size-12 rounded-xl text-lg"
          />
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <p className="text-muted-foreground text-sm">
              {project.client_name ?? "Tanpa klien"}
              {activePhase
                ? ` · ${activePhase.name}`
                : " · Semua phase selesai"}
            </p>
          </div>
        </div>
        {viewer.isAdmin && activePhase && (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => activate(activePhase, true)}
          >
            Selesaikan {activePhase.name}
          </Button>
        )}
      </header>

      <div className="ring-foreground/10 grid overflow-hidden rounded-xl ring-1 sm:grid-cols-3">
        {phases.map((phase) => {
          const phaseSteps = steps.filter((s) => s.phase_id === phase.id)
          const open = phaseSteps.filter((s) => s.status !== "done").length
          return (
            <button
              key={phase.id}
              type="button"
              onClick={() => setSelected(phase.id)}
              className={cn(
                "group/phase not-last:border-r-border relative flex items-center gap-3 border-b-2 border-transparent px-5 py-4 text-left transition-colors sm:not-last:border-r",
                current?.id === phase.id
                  ? "bg-muted/40 border-b-foreground"
                  : "hover:bg-muted/20",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                  phase.status === "done"
                    ? "bg-muted text-foreground"
                    : phase.status === "active"
                      ? "ring-primary text-primary ring-2"
                      : "ring-border text-muted-foreground ring-1",
                )}
              >
                {phase.status === "done" ? (
                  <RiCheckLine className="size-4" />
                ) : (
                  phase.position
                )}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-muted-foreground text-xs">
                  Phase {phase.position}
                </span>
                <span
                  className={cn(
                    "truncate text-base font-medium",
                    phase.status === "todo" && "text-muted-foreground",
                  )}
                >
                  {phase.name}
                </span>
                <span className="text-muted-foreground text-xs">
                  {phase.status === "done"
                    ? `Selesai ${phase.completed_at ? format(new Date(phase.completed_at), "d MMM", { locale: idLocale }) : ""}`
                    : phaseSteps.length
                      ? `${open} dari ${phaseSteps.length} langkah belum selesai`
                      : phase.status === "active"
                        ? "Sedang berjalan"
                        : "Belum mulai"}
                </span>
              </span>
              {viewer.isAdmin && phase.status !== "active" && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    activate(phase)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation()
                      activate(phase)
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground absolute top-2 right-3 hidden text-xs group-hover/phase:block"
                >
                  Jadikan aktif
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {current && (
          <ProcessPanel
            projectId={projectId}
            phase={current}
            steps={steps.filter((s) => s.phase_id === current.id)}
            viewerId={viewer.id}
          />
        )}

        <aside className="ring-foreground/10 flex flex-col gap-5 rounded-xl p-4 text-sm ring-1">
          <ProjectAbout
            projectId={projectId}
            description={project.description}
            canEdit={viewer.isAdmin}
          />
          <Facts
            title="Progress"
            rows={[
              ["Status", project.status ? STATUS_LABELS[project.status] : "—"],
              [
                "Phase",
                activePhase
                  ? `${activePhase.name} · ${activePhase.position} dari ${phases.length}`
                  : "Selesai",
              ],
              ["Tugas terbuka", String(openTasks)],
            ]}
          />
          <Facts
            title="Tanggal"
            rows={[
              ["Mulai", day(project.start_date)],
              ["Deadline", day(project.end_date)],
              ["Kuartal", project.quarter_id ?? "—"],
            ]}
          />
          {(project.client_name || project.client_contact) && (
            <Facts
              title="Klien"
              rows={[
                ["Nama", project.client_name ?? "—"],
                ["Kontak", project.client_contact ?? "—"],
                ["Email", project.client_email ?? "—"],
              ]}
            />
          )}
          <section className="flex flex-col gap-2">
            <h3 className="font-medium">Tim</h3>
            {team.length === 0 ? (
              <p className="text-muted-foreground">Belum ada anggota.</p>
            ) : (
              team.map((m) => (
                <div key={m.assignmentId} className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarImage src={m.avatar_url || undefined} alt="" />
                    <AvatarFallback className="text-[10px]">
                      {(m.full_name || "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate">{m.full_name}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {m.isLead ? "Lead" : m.role}
                  </span>
                </div>
              ))
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}

function Facts({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-medium">{title}</h3>
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">{label}</span>
          <span className="truncate text-right">{value}</span>
        </div>
      ))}
    </section>
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
    if (error) toast.error("Gagal menyimpan deskripsi.")
    invalidate("workspace")
  }

  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="font-medium">Project</h3>
      {editing ? (
        <Textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          placeholder="Tulis satu kalimat tentang project ini"
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
          {description ||
            (canEdit ? "Tambahkan deskripsi project" : "Belum ada deskripsi.")}
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
      toast.error("Gagal menambah langkah.")
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

  return (
    <section className="ring-foreground/10 flex flex-col rounded-xl ring-1">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <h2 className="text-sm font-medium">Proses · {phase.name}</h2>
        <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>
          <RiAddLine data-icon="inline-start" />
          Langkah
        </Button>
      </header>
      <div className="flex flex-col">
        {steps.map((step) => {
          const done = step.status === "done"
          return (
            <div
              key={step.id}
              className="group/step border-border/50 flex min-h-11 items-center gap-3 border-b px-4 text-sm last:border-b-0"
            >
              <button
                type="button"
                aria-label={done ? "Tandai belum selesai" : "Tandai selesai"}
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
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  done && "text-muted-foreground line-through",
                )}
              >
                {step.title}
              </span>
              <button
                type="button"
                aria-label="Hapus langkah"
                onClick={() => remove(step.id)}
                className="text-muted-foreground hover:text-destructive hidden group-hover/step:block"
              >
                <RiDeleteBinLine className="size-4" />
              </button>
              <span
                className={cn(
                  "rounded-sm px-1.5 py-0.5 text-xs",
                  done
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {done ? "Selesai" : "Draft"}
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
              placeholder={`Langkah di ${phase.name}, mis. "Presentasi konsep"`}
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
              Belum ada langkah di {phase.name}. Tambah langkah pertama.
            </button>
          )
        )}
      </div>
    </section>
  )
}

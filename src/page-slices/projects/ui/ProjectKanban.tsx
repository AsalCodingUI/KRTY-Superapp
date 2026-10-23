"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { format, isBefore, parseISO, startOfDay } from "date-fns"
import { GripHorizontal, TriangleAlert } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  BOARD_STATUSES,
  STATUS_LABEL_KEYS,
  type ProjectStatus,
} from "../lib/status"
import type { ProjectListRow } from "./ProjectList"
import { ProjectStatusIcon } from "./ProjectStatusIcon"

type BoardStatus = (typeof BOARD_STATUSES)[number]

function initials(name: string | null | undefined) {
  return (name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/** Compact card (Linear/hilos style): meta line, title, team initials. */
function ProjectCard({
  project,
  dragging,
  canDrag,
}: {
  project: ProjectListRow
  dragging?: boolean
  canDrag?: boolean
}) {
  const t = useT("projects")
  const dateLocale = useDateLocale()
  const team = project.project_assignments ?? []
  const overdue =
    project.status !== "Completed" &&
    project.status !== "Archived" &&
    isBefore(parseISO(project.end_date), startOfDay(new Date()))
  const meta = [
    project.quarter_id,
    format(parseISO(project.end_date), "d MMM", { locale: dateLocale }),
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div
      className={cn(
        "bg-card border-border group-hover/card:border-foreground/20 relative flex flex-col gap-1.5 rounded-2xl border px-3.5 py-3 text-sm transition-[border-color,box-shadow] duration-200",
        dragging && "border-transparent shadow-(--shadow-lift)",
      )}
    >
      {/* Hover hint that the card can be picked up. */}
      {canDrag && !dragging && (
        <GripHorizontal
          aria-hidden="true"
          className="text-muted-foreground/70 absolute top-0.5 left-1/2 size-3.5 -translate-x-1/2 opacity-0 transition-opacity group-hover/card:opacity-100"
        />
      )}
      <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs tabular-nums">
        <span className="truncate">{meta}</span>
        {overdue && (
          <TriangleAlert
            aria-label={t("kanbanOverdue")}
            className="text-warning size-3.5 shrink-0"
          />
        )}
      </div>
      <p className="text-foreground truncate">{project.name}</p>
      {(project.client_name || team.length > 0) && (
        <div className="flex items-center gap-1.5 pt-0.5">
          {team.slice(0, 4).map((a) => (
            <Avatar
              key={a.id}
              className="size-5"
              title={a.profiles?.full_name ?? ""}
            >
              <AvatarImage src={a.profiles?.avatar_url || undefined} alt="" />
              <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-medium">
                {initials(a.profiles?.full_name)}
              </AvatarFallback>
            </Avatar>
          ))}
          {team.length > 4 && (
            <span className="text-muted-foreground text-[11px] tabular-nums">
              +{team.length - 4}
            </span>
          )}
          {project.client_name && (
            <span className="text-muted-foreground ml-auto truncate text-xs">
              {project.client_name}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function DraggableCard({
  project,
  canDrag,
}: {
  project: ProjectListRow
  canDrag: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: project.id,
    disabled: !canDrag,
  })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "group/card relative rounded-2xl transition-opacity duration-200 outline-none",
        canDrag && "cursor-grab active:cursor-grabbing",
        // The spot it left, until it's dropped.
        isDragging && "opacity-40",
      )}
    >
      {/* Click opens the project; a drag (6px+) moves it instead. */}
      <Link
        href={`/projects/${project.id}`}
        prefetch={false}
        draggable={false}
        className="focus-visible:ring-primary/40 block rounded-2xl focus-visible:ring-2"
      >
        <ProjectCard project={project} canDrag={canDrag} />
      </Link>
    </div>
  )
}

function Column({
  status,
  projects,
  canDrag,
}: {
  status: BoardStatus
  projects: ProjectListRow[]
  canDrag: boolean
}) {
  const t = useT("projects")
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <section
      ref={setNodeRef}
      className={cn(
        // Border sits inside the box so the scroll container never clips it.
        "flex min-h-64 min-w-60 flex-1 flex-col gap-2 rounded-2xl border border-dashed border-transparent p-1 transition-colors",
        isOver && "border-foreground/20 bg-foreground/[0.02]",
      )}
    >
      <header className="flex items-center gap-2 px-1.5 pt-0.5 pb-1 text-sm">
        <ProjectStatusIcon status={status} />
        <span className="text-foreground/90">
          {t(STATUS_LABEL_KEYS[status])}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {projects.length}
        </span>
      </header>
      <div className="flex flex-col gap-2">
        {projects.map((p) => (
          <DraggableCard key={p.id} project={p} canDrag={canDrag} />
        ))}
        {projects.length === 0 && (
          <p className="text-muted-foreground px-1.5 py-4 text-center text-sm">
            {canDrag ? t("kanbanDropHere") : t("kanbanEmpty")}
          </p>
        )}
      </div>
    </section>
  )
}

/** Degrees the lifted card leans per px/ms of sideways speed, and the cap. */
const TILT_PER_SPEED = 6
const TILT_MAX = 8

/**
 * The card under the pointer: it lifts (a little bigger, paper shadow) and
 * leans into a sideways move like a real card, settling when you stop.
 */
function LiftedCard({
  project,
  tilt,
}: {
  project: ProjectListRow
  tilt: number
}) {
  const [lifted, setLifted] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLifted(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  return (
    <div
      className="cursor-grabbing transition-transform duration-200 ease-out will-change-transform motion-reduce:transition-none"
      style={{
        transform: `rotate(${tilt}deg) scale(${lifted ? 1.03 : 1})`,
      }}
    >
      <ProjectCard project={project} dragging />
    </div>
  )
}

const DROP_ANIMATION: DropAnimation = {
  duration: 220,
  easing: "cubic-bezier(0.2, 0, 0, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
}

/**
 * Projects as a 4-step board (Belum mulai → Berjalan → Review → Selesai).
 * Stakeholders drag a card to change its status; archived projects stay out
 * of the board (list view shows them).
 */
export function ProjectKanban({
  projects,
  onMove,
}: {
  projects: ProjectListRow[]
  /** Present for stakeholders; resolves once the status is saved. */
  onMove?: (project: ProjectListRow, status: ProjectStatus) => Promise<boolean>
}) {
  const t = useT("projects")
  const [overrides, setOverrides] = useState<Record<string, ProjectStatus>>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  // Lean of the lifted card, from how fast it moves sideways.
  const [tilt, setTilt] = useState(0)
  const lastMove = useRef<{ x: number; t: number } | null>(null)
  const settle = useRef<number | undefined>(undefined)
  const onDragMove = ({ delta }: DragMoveEvent) => {
    const now = performance.now()
    const last = lastMove.current
    lastMove.current = { x: delta.x, t: now }
    if (!last || now === last.t) return
    const speed = (delta.x - last.x) / (now - last.t)
    setTilt(Math.max(-TILT_MAX, Math.min(TILT_MAX, speed * TILT_PER_SPEED)))
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => setTilt(0), 90)
  }
  const resetTilt = () => {
    window.clearTimeout(settle.current)
    lastMove.current = null
    setTilt(0)
  }

  const statusOf = (p: ProjectListRow) => overrides[p.id] ?? p.status
  const active = projects.find((p) => p.id === activeId) ?? null
  const archived = projects.filter((p) => statusOf(p) === "Archived").length

  const onDragStart = (event: DragStartEvent) => {
    resetTilt()
    setActiveId(String(event.active.id))
  }

  const onDragEnd = async (event: DragEndEvent) => {
    resetTilt()
    setActiveId(null)
    const project = projects.find((p) => p.id === event.active.id)
    const target = event.over?.id as BoardStatus | undefined
    if (!project || !target || !onMove || statusOf(project) === target) return
    // Move right away; put it back if saving fails.
    setOverrides((o) => ({ ...o, [project.id]: target }))
    const ok = await onMove(project, target)
    // On success the override stays until the refetched list agrees.
    if (!ok) setOverrides((o) => ({ ...o, [project.id]: project.status }))
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        resetTilt()
        setActiveId(null)
      }}
    >
      <div className="bleed gutter-x flex gap-3 overflow-x-auto pb-2">
        {BOARD_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            canDrag={Boolean(onMove)}
            projects={projects.filter((p) => statusOf(p) === status)}
          />
        ))}
      </div>
      {archived > 0 && (
        <p className="text-muted-foreground flex items-center gap-2 pt-2 text-sm">
          <ProjectStatusIcon status="Archived" />
          {t("kanbanArchived", { n: archived })} · {t("kanbanArchivedHint")}
        </p>
      )}
      <DragOverlay dropAnimation={DROP_ANIMATION}>
        {active ? <LiftedCard project={active} tilt={tilt} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

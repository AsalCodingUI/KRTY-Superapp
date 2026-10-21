"use client"

import { AvatarGroup, AvatarOverflow } from "@/components/avatar-group"
import { ListChip } from "@/components/grouped-list"
import { ProjectAvatar } from "@/components/project-avatar"
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
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { CircleCheck, CircleDot, Archive } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import type { ProjectListRow } from "./ProjectList"

type Status = ProjectListRow["status"]

const COLUMNS: {
  status: Status
  label: string
  icon: typeof CircleDot
  tone: string
}[] = [
  { status: "Active", label: "Aktif", icon: CircleDot, tone: "text-primary" },
  {
    status: "Completed",
    label: "Selesai",
    icon: CircleCheck,
    tone: "text-success",
  },
  {
    status: "Archived",
    label: "Diarsipkan",
    icon: Archive,
    tone: "text-muted-foreground",
  },
]

function dateRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const sameYear = s.getFullYear() === e.getFullYear()
  return `${format(s, sameYear ? "d MMM" : "d MMM yyyy", { locale: idLocale })} – ${format(e, "d MMM yyyy", { locale: idLocale })}`
}

function ProjectCard({
  project,
  dragging,
}: {
  project: ProjectListRow
  dragging?: boolean
}) {
  const team = project.project_assignments ?? []
  return (
    <div
      className={cn(
        "bg-card ring-foreground/10 flex flex-col gap-3 rounded-lg p-3 text-sm ring-1",
        dragging && "ring-primary/50 rotate-1 shadow-xl",
      )}
    >
      <div className="flex items-center gap-2">
        <ProjectAvatar id={project.id} name={project.name} />
        <span className="min-w-0 flex-1 truncate font-medium">
          {project.name}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground truncate text-xs">
          {dateRange(project.start_date, project.end_date)}
        </span>
        {project.quarter_id && <ListChip>{project.quarter_id}</ListChip>}
      </div>
      {team.length > 0 && (
        <AvatarGroup>
          {team.slice(0, 4).map((a) => (
            <Avatar key={a.id} className="size-6">
              <AvatarImage src={a.profiles?.avatar_url || undefined} alt="" />
              <AvatarFallback className="text-[10px]">
                {(a.profiles?.full_name || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {team.length > 4 && (
            <AvatarOverflow count={team.length - 4} size="xs" />
          )}
        </AvatarGroup>
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
        "relative rounded-lg outline-none",
        canDrag && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-30",
      )}
    >
      {/* Click opens the project; a drag (6px+) moves it instead. */}
      <Link
        href={`/projects/${project.id}`}
        prefetch={false}
        draggable={false}
        className="focus-visible:ring-primary/40 block rounded-lg focus-visible:ring-2"
      >
        <ProjectCard project={project} />
      </Link>
    </div>
  )
}

function Column({
  status,
  label,
  icon: Icon,
  tone,
  projects,
  canDrag,
}: (typeof COLUMNS)[number] & {
  projects: ProjectListRow[]
  canDrag: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "bg-muted/30 flex min-h-64 min-w-72 flex-1 flex-col gap-2 rounded-xl p-2 transition-colors",
        isOver && "bg-primary/10 ring-primary/30 ring-1",
      )}
    >
      <header className="flex items-center gap-2 px-1.5 py-1 text-sm">
        <Icon aria-hidden className={cn("size-4", tone)} />
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {projects.length}
        </span>
      </header>
      <div className="flex flex-col gap-2">
        {projects.map((p) => (
          <DraggableCard key={p.id} project={p} canDrag={canDrag} />
        ))}
        {projects.length === 0 && (
          <p className="text-muted-foreground/70 px-1.5 py-6 text-center text-xs">
            {canDrag ? "Geser project ke sini" : "Belum ada project"}
          </p>
        )}
      </div>
    </section>
  )
}

/**
 * Projects as a board by status. Stakeholders drag a card to another column
 * to change its status; everyone can click a card to open the project.
 */
export function ProjectKanban({
  projects,
  onMove,
}: {
  projects: ProjectListRow[]
  /** Present for stakeholders; resolves once the status is saved. */
  onMove?: (project: ProjectListRow, status: Status) => Promise<boolean>
}) {
  const [overrides, setOverrides] = useState<Record<string, Status>>({})
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const statusOf = (p: ProjectListRow) => overrides[p.id] ?? p.status
  const active = projects.find((p) => p.id === activeId) ?? null

  const onDragStart = (event: DragStartEvent) =>
    setActiveId(String(event.active.id))

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const project = projects.find((p) => p.id === event.active.id)
    const target = event.over?.id as Status | undefined
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
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {COLUMNS.map((col) => (
          <Column
            key={col.status}
            {...col}
            canDrag={Boolean(onMove)}
            projects={projects.filter((p) => statusOf(p) === col.status)}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {active ? <ProjectCard project={active} dragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}

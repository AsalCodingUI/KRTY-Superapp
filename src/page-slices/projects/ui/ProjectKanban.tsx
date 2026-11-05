"use client"

import { projectHref } from "@/shared/lib/url-params"
import { EASE_OUT_CSS } from "@/shared/lib/motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  defaultDropAnimationSideEffects,
  type DropAnimation,
} from "@dnd-kit/core"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { format, isBefore, parseISO, startOfDay } from "date-fns"
import { GripHorizontal, TriangleAlert } from "@/components/icons"
import Link from "next/link"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import {
  asStage,
  BOARD_STATUSES,
  STATUS_LABEL_KEYS,
  type ProjectStatus,
} from "../lib/status"
import type { ProjectListRow } from "./ProjectList"
import {
  ProjectContextMenu,
  ProjectMenuButton,
  type ProjectActions,
} from "./ProjectMenu"
import { BriefShortcut } from "@/page-slices/briefs/ui/BriefShortcut"
import { ProjectStageLabel } from "./ProjectStage"
import { ProjectStatusIcon } from "./ProjectStatusIcon"
import { useDragTilt } from "./useDragTilt"
import { useStatusMove, type MoveProject } from "./useStatusMove"
import { initials } from "@/shared/lib/initials"

type BoardStatus = (typeof BOARD_STATUSES)[number]

/** Compact card (Linear/hilos style): meta line, title, team initials. */
const ProjectCard = memo(function ProjectCard({
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
    project.status !== "Paused" &&
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
        "bg-card border-border group-hover/card:border-field-border rounded-nested relative flex flex-col gap-1.5 border px-3.5 py-3 text-sm transition-[border-color,box-shadow] duration-200",
        dragging && "shadow-popover border-transparent",
      )}
    >
      {/* Hover hint that the card can be picked up. */}
      {canDrag && !dragging && (
        <GripHorizontal
          aria-hidden="true"
          className="text-muted-foreground absolute top-0.5 left-1/2 size-3.5 -translate-x-1/2 opacity-0 transition-opacity group-hover/card:opacity-100"
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
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 empty:hidden">
        {asStage(project.stage) && (
          <ProjectStageLabel
            stage={asStage(project.stage)!}
            className="text-xs"
          />
        )}
        <BriefShortcut projectId={project.id} className="-ml-2" />
      </div>
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
            <span className="text-muted-foreground text-micro tabular-nums">
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
})

const DraggableCard = memo(function DraggableCard({
  project,
  status,
  canDrag,
  actions,
}: {
  project: ProjectListRow
  status: ProjectStatus
  canDrag: boolean
  actions?: ProjectActions
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: project.id,
    disabled: !canDrag,
  })
  return (
    <ProjectContextMenu project={project} status={status} actions={actions}>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={cn(
          "group/card rounded-nested relative transition-opacity duration-200 outline-none",
          canDrag && "cursor-grab active:cursor-grabbing",
          // The spot it left, until it's dropped.
          isDragging && "opacity-40",
        )}
      >
        {/* Click opens the project; a drag (6px+) moves it instead. */}
        <Link
          href={projectHref(project)}
          prefetch={false}
          draggable={false}
          className="focus-visible:ring-focus-ring rounded-nested block focus-visible:ring-2"
        >
          <ProjectCard project={project} canDrag={canDrag} />
        </Link>
        {actions && (
          <ProjectMenuButton
            project={project}
            status={status}
            actions={actions}
            className="bg-card absolute top-1.5 right-1.5 size-6 opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100 pointer-coarse:opacity-100"
          />
        )}
      </div>
    </ProjectContextMenu>
  )
})

const Column = memo(function Column({
  status,
  projects,
  canDrag,
  actions,
}: {
  status: BoardStatus
  projects: ProjectListRow[]
  canDrag: boolean
  actions?: ProjectActions
}) {
  const t = useT("projects")
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <section
      ref={setNodeRef}
      className={cn(
        // Border sits inside the box so the scroll container never clips it.
        "nest-rounded-2xl nest-p-2 flex min-h-64 min-w-60 flex-1 flex-col gap-2 border border-dashed border-transparent transition-colors",
        isOver && "border-field-border bg-foreground/[0.02]",
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
          <DraggableCard
            key={p.id}
            project={p}
            status={status}
            canDrag={canDrag}
            actions={actions}
          />
        ))}
        {projects.length === 0 && (
          <p className="text-muted-foreground px-1.5 py-4 text-center text-sm">
            {canDrag ? t("kanbanDropHere") : t("kanbanEmpty")}
          </p>
        )}
      </div>
    </section>
  )
})

/**
 * The card under the pointer: it lifts (a little bigger, paper shadow) and
 * leans into a sideways move like a real card, settling when you stop.
 */
function LiftedCard({ project }: { project: ProjectListRow }) {
  const tilt = useDragTilt()
  const [lifted, setLifted] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLifted(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  return (
    <div
      // Outside the column: same corners as there (column radius − padding).
      className="cursor-grabbing transition-transform duration-200 ease-out will-change-transform [--nest-p:calc(var(--spacing)*2)] [--nest-r:var(--radius-2xl)] motion-reduce:transition-none"
      style={{
        transform: `rotate(${tilt}deg) scale(${lifted ? 1.03 : 1})`,
      }}
    >
      <ProjectCard project={project} dragging />
    </div>
  )
}

const DROP_ANIMATION: DropAnimation = {
  duration: 200,
  easing: EASE_OUT_CSS,
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
}

/**
 * Projects as a 4-step board (Belum mulai → Berjalan → Review → Selesai).
 * PMs and stakeholders drag a card to change its status (or use the card's
 * "Pindahkan ke"); archived projects stay out of the board (list view shows
 * them).
 */
export function ProjectKanban({
  projects,
  onMove,
  actions,
}: {
  projects: ProjectListRow[]
  /** PMs and stakeholders; resolves once the status is saved. */
  onMove?: MoveProject
  /** Stakeholders: edit / delete from the card menu. */
  actions?: Omit<ProjectActions, "onMove">
}) {
  const t = useT("projects")
  const drag = useStatusMove(projects, onMove)
  // Stable across renders, so the memoized cards skip a board re-render.
  const moveRef = useRef(drag.move)
  moveRef.current = drag.move
  const cardActions = useMemo<ProjectActions | undefined>(
    () =>
      onMove || actions
        ? {
            ...actions,
            onMove: onMove
              ? (p, status) => void moveRef.current(p, status)
              : undefined,
          }
        : undefined,
    [onMove, actions],
  )

  const { statusOf, active } = drag
  const archived = projects.filter((p) => statusOf(p) === "Archived").length

  // The lifted card's lean lives in the overlay (useDragTilt), so moving
  // the pointer doesn't re-render the board.
  return (
    <DndContext
      sensors={drag.sensors}
      onDragStart={drag.onDragStart}
      onDragEnd={drag.onDragEnd}
      onDragCancel={drag.onDragCancel}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {BOARD_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            canDrag={Boolean(onMove)}
            actions={cardActions}
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
        {active ? <LiftedCard project={active} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

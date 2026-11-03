"use client"

import { projectHref } from "@/shared/lib/url-params"
import { AnimatePresence } from "motion/react"
import { AvatarGroup, AvatarOverflow } from "@/components/avatar-group"
import {
  ALL_STATUSES,
  STATUS_LABEL_KEYS,
  type ProjectStatus,
} from "@/page-slices/projects/lib/status"
import { ProjectStatusIcon } from "./ProjectStatusIcon"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListGroup, ListRow } from "@/components/grouped-list"
import { ProjectAvatar } from "@/components/project-avatar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { RiFolderLine } from "@/shared/ui/lucide-icons"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  closestCenter,
  DndContext,
  DragOverlay,
  pointerWithin,
  useDroppable,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format, type Locale } from "date-fns"
import Link from "next/link"
import { useState, type ReactNode } from "react"
import { asStage } from "../lib/status"
import { BriefShortcut } from "@/page-slices/briefs/ui/BriefShortcut"
import { ProjectStageLabel } from "./ProjectStage"
import {
  ProjectContextMenu,
  ProjectMenuButton,
  hasProjectActions,
  type ProjectActions,
} from "./ProjectMenu"
import { useStatusMove, type MoveProject } from "./useStatusMove"

export type { ProjectActions } from "./ProjectMenu"

export type ProjectListRow = {
  id: string
  name: string
  status: ProjectStatus
  stage?: string | null
  position?: number | null
  start_date: string
  end_date: string
  quarter_id: string | null
  client_name?: string | null
  updated_at?: string | null
  process?: { id: string; name: string } | null
  category?: { id: string; name: string } | null
  project_assignments:
    | {
        id: string
        user_id?: string
        profiles: { full_name: string | null; avatar_url: string | null } | null
      }[]
    | null
}

/** Shared column template so rows line up across every status group. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_7rem_6.5rem] lg:grid-cols-[minmax(0,1fr)_7rem_6.5rem_6.5rem]"
/** Same, plus a column for the row's "…" menu. */
const ROW_GRID_ACTIONS =
  "grid grid-cols-[minmax(0,1fr)_6.5rem_1.75rem] items-center gap-x-3 md:gap-x-4 md:grid-cols-[minmax(0,1fr)_7rem_6.5rem_1.75rem] lg:grid-cols-[minmax(0,1fr)_7rem_6.5rem_6.5rem_1.75rem]"

function shortDate(value: string, locale: Locale) {
  return format(new Date(value), "d MMM yyyy", { locale })
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/** Open at first: the work in hand. The rest start folded; each group
 *  then stays the way it was left (per device). */
const DEFAULT_OPEN: ProjectStatus[] = ["Active", "Review", "Paused"]

const isStatus = (id: unknown) =>
  (ALL_STATUSES as readonly unknown[]).includes(id)

/** Rows under the pointer win over their group; else the nearest. */
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  const rows = hits.filter((hit) => !isStatus(hit.id))
  if (rows.length) return rows
  return hits.length ? hits : closestCenter(args)
}

/**
 * Daftar Project grouped by status (the kanban workflow); groups remember
 * whether they're open (DEFAULT_OPEN at first). With `onMove`, rows drag onto another group to change status
 * (same as the board) and the "…" menu has "Pindahkan ke"; with
 * `onReorder`, they also drag up and down within their group.
 */
export function ProjectList({
  projects,
  actions,
  onMove,
  onReorder,
}: {
  projects: ProjectListRow[]
  /** Stakeholders: edit / delete from the row menu. */
  actions?: Omit<ProjectActions, "onMove">
  /** PMs and stakeholders; resolves once the status is saved. */
  onMove?: MoveProject
  /** A group's ids in their new order, top to bottom. */
  onReorder?: (ids: string[]) => void
}) {
  const t = useT("projects")
  const drag = useStatusMove(projects, onMove)
  // The group the dragged row would land in (outlined).
  const [overStatus, setOverStatus] = useState<ProjectStatus | null>(null)
  if (projects.length === 0) {
    return (
      <EmptyState
        title={t("emptyTitle")}
        icon={<RiFolderLine className="size-5" />}
        placement="inner"
      />
    )
  }

  const rowActions: ProjectActions = {
    ...actions,
    onMove: onMove ? (p, status) => void drag.move(p, status) : undefined,
  }
  const withMenu = hasProjectActions(rowActions)
  const grid = withMenu ? ROW_GRID_ACTIONS : ROW_GRID
  const dragging = Boolean(drag.active)
  const itemsOf = (status: ProjectStatus) =>
    projects.filter((p) => drag.statusOf(p) === status)
  const statusAt = (id: unknown): ProjectStatus | null => {
    if (isStatus(id)) return id as ProjectStatus
    const row = projects.find((p) => p.id === id)
    return row ? drag.statusOf(row) : null
  }

  const onDragOver = (event: DragOverEvent) =>
    setOverStatus(event.over ? statusAt(event.over.id) : null)

  const onDragEnd = (event: DragEndEvent) => {
    setOverStatus(null)
    const { active, over } = event
    const project = projects.find((p) => p.id === active.id)
    const target = over ? statusAt(over.id) : null
    if (!project || !over || !target) return drag.onDragCancel()
    if (target !== drag.statusOf(project)) {
      // Another group: a status change (same as the board).
      return drag.onDragEnd({ ...event, over: { ...over, id: target } })
    }
    drag.onDragCancel()
    if (!onReorder || isStatus(over.id) || over.id === active.id) return
    const ids = itemsOf(target).map((p) => p.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    onReorder(arrayMove(ids, from, to))
  }

  return (
    <DndContext
      sensors={drag.sensors}
      collisionDetection={collision}
      onDragStart={drag.onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setOverStatus(null)
        drag.onDragCancel()
      }}
    >
      <GroupedList hover={!dragging}>
        {ALL_STATUSES.map((status) => {
          const items = itemsOf(status)
          // Empty groups only show while dragging, as places to drop.
          if (items.length === 0 && !dragging) return null
          return (
            <StatusGroup
              key={status}
              status={status}
              droppable={Boolean(onMove)}
              highlight={
                overStatus === status &&
                drag.active !== null &&
                drag.statusOf(drag.active) !== status
              }
            >
              <ListGroup
                icon={<ProjectStatusIcon status={status} />}
                label={t(STATUS_LABEL_KEYS[status])}
                count={items.length}
                defaultOpen={DEFAULT_OPEN.includes(status)}
                storageKey={`projects:list-group:${status}`}
              >
                <SortableContext
                  items={items.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <AnimatePresence initial={false}>
                    {items.map((project) => (
                      <ProjectRow
                        key={project.id}
                        project={project}
                        status={drag.statusOf(project)}
                        grid={grid}
                        actions={withMenu ? rowActions : undefined}
                        canDrag={Boolean(onMove || onReorder)}
                      />
                    ))}
                  </AnimatePresence>
                </SortableContext>
                {items.length === 0 && (
                  <p className="text-muted-foreground gutter-x py-3 text-sm">
                    {t("kanbanDropHere")}
                  </p>
                )}
              </ListGroup>
            </StatusGroup>
          )
        })}
      </GroupedList>
      <DragOverlay dropAnimation={null}>
        {drag.active ? <DraggedRow project={drag.active} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

/** A status group as a drop target (outlined while a row from another
 *  group is over it). */
function StatusGroup({
  status,
  droppable,
  highlight,
  children,
}: {
  status: ProjectStatus
  droppable: boolean
  highlight: boolean
  children: ReactNode
}) {
  const { setNodeRef } = useDroppable({
    id: status,
    disabled: !droppable,
  })
  const isOver = highlight
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mt-1 rounded-lg outline outline-1 -outline-offset-1 outline-transparent transition-[outline-color,background-color]",
        isOver && "bg-foreground/[0.02] outline-foreground/20",
      )}
    >
      {children}
    </div>
  )
}

/** What follows the pointer while a row is dragged. */
function DraggedRow({ project }: { project: ProjectListRow }) {
  return (
    <div className="bg-card border-border flex h-12 max-w-sm cursor-grabbing items-center gap-3 rounded-lg border px-3 text-sm shadow-(--elev-4)">
      <ProjectAvatar
        id={project.id}
        name={project.name}
        className="size-7 rounded-md text-[11px]"
      />
      <span className="truncate">{project.name}</span>
    </div>
  )
}

function ProjectRow({
  project,
  status,
  grid,
  actions,
  canDrag,
}: {
  project: ProjectListRow
  status: ProjectStatus
  grid: string
  actions?: ProjectActions
  canDrag: boolean
}) {
  const t = useT("projects")
  const dateLocale = useDateLocale()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id, disabled: !canDrag })
  const team = (project.project_assignments ?? []).map((a) => ({
    id: a.id,
    name: a.profiles?.full_name || t("unknownMember"),
    image: a.profiles?.avatar_url || undefined,
  }))
  const meta = [
    project.category?.name,
    project.client_name,
    project.quarter_id,
  ].filter(Boolean)
  const stage = asStage(project.stage)

  // The sortable shift lives on a wrapper: the row's own transform is
  // motion's (enter / exit).
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10")}
      {...(canDrag ? { ...attributes, ...listeners } : {})}
    >
      <ProjectContextMenu project={project} status={status} actions={actions}>
        <ListRow
          className={cn(
            grid,
            "min-h-14 border-b-0 transition-opacity",
            canDrag && "cursor-grab active:cursor-grabbing",
            // The spot it left, until it's dropped.
            isDragging && "*:opacity-40",
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <ProjectAvatar
              id={project.id}
              name={project.name}
              className="size-7 rounded-md text-[11px]"
            />
            <div className="flex min-w-0 flex-col">
              <div className="flex min-w-0 items-center gap-2.5">
                {/* The link covers the whole row; the menu sits above it. */}
                <Link
                  href={projectHref(project)}
                  prefetch={false}
                  draggable={false}
                  className="text-foreground truncate outline-none after:absolute after:inset-0 focus-visible:underline"
                >
                  {project.name}
                </Link>
                {stage && <ProjectStageLabel stage={stage} />}
              </div>
              {meta.length > 0 && (
                <span className="text-tertiary-foreground truncate text-[13px]">
                  {meta.join(" · ")}
                </span>
              )}
            </div>
            {/* Its brief, in the free space before the team. */}
            <div className="ml-auto flex shrink-0 items-center gap-1 pl-2">
              <BriefShortcut projectId={project.id} />
            </div>
          </div>

          <div className="hidden md:block">
            {team.length > 0 ? (
              <AvatarGroup>
                {team.slice(0, 3).map((m) => (
                  <Avatar key={m.id} className="size-6">
                    <AvatarImage src={m.image} alt={m.name} />
                    <AvatarFallback className="text-[10px]">
                      {initials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {team.length > 3 && (
                  <AvatarOverflow count={team.length - 3} size="xs" />
                )}
              </AvatarGroup>
            ) : (
              <span className="text-tertiary-foreground text-[13px]">
                {t("noTeamYet")}
              </span>
            )}
          </div>
          <span className="text-muted-foreground hidden text-right tabular-nums lg:block">
            {shortDate(project.start_date, dateLocale)}
          </span>
          <span className="text-foreground text-right tabular-nums">
            {shortDate(project.end_date, dateLocale)}
          </span>

          {actions && (
            <div className="flex justify-end">
              <ProjectMenuButton
                project={project}
                status={status}
                actions={actions}
                className="md:opacity-0 md:group-hover/row:opacity-100 md:focus-visible:opacity-100 md:data-popup-open:opacity-100"
              />
            </div>
          )}
        </ListRow>
      </ProjectContextMenu>
    </div>
  )
}

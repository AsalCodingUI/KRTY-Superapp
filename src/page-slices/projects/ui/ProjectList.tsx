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
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core"
import { format, type Locale } from "date-fns"
import Link from "next/link"
import type { ReactNode } from "react"
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

/**
 * Daftar Project grouped by status (the kanban workflow); archived starts
 * collapsed. With `onMove`, rows drag onto another group to change status
 * (same as the board) and the "…" menu has "Pindahkan ke".
 */
export function ProjectList({
  projects,
  actions,
  onMove,
}: {
  projects: ProjectListRow[]
  /** Stakeholders: edit / delete from the row menu. */
  actions?: Omit<ProjectActions, "onMove">
  /** PMs and stakeholders; resolves once the status is saved. */
  onMove?: MoveProject
}) {
  const t = useT("projects")
  const drag = useStatusMove(projects, onMove)
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

  return (
    <DndContext
      sensors={drag.sensors}
      onDragStart={drag.onDragStart}
      onDragEnd={drag.onDragEnd}
      onDragCancel={drag.onDragCancel}
    >
      <GroupedList hover={!dragging}>
        <div
          className={cn(
            grid,
            "gutter-x text-muted-foreground border-border h-9 border-b text-[13px]",
          )}
        >
          <span>{t("colProject")}</span>
          <span className="hidden md:block">{t("colTeam")}</span>
          <span className="hidden text-right lg:block">{t("colStart")}</span>
          <span className="text-right">{t("colDue")}</span>
          {withMenu && <span />}
        </div>
        {ALL_STATUSES.map((status) => {
          const items = projects.filter((p) => drag.statusOf(p) === status)
          // Empty groups only show while dragging, as places to drop.
          if (items.length === 0 && !dragging) return null
          return (
            <StatusGroup
              key={status}
              status={status}
              droppable={Boolean(onMove)}
            >
              <ListGroup
                icon={<ProjectStatusIcon status={status} />}
                label={t(STATUS_LABEL_KEYS[status])}
                count={items.length}
                defaultOpen={status !== "Archived"}
              >
                <AnimatePresence initial={false}>
                  {items.map((project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      status={drag.statusOf(project)}
                      grid={grid}
                      actions={withMenu ? rowActions : undefined}
                      canDrag={Boolean(onMove)}
                    />
                  ))}
                </AnimatePresence>
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

/** A status group as a drop target (outlined while a row is over it). */
function StatusGroup({
  status,
  droppable,
  children,
}: {
  status: ProjectStatus
  droppable: boolean
  children: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    disabled: !droppable,
  })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg outline outline-1 -outline-offset-1 outline-transparent transition-[outline-color,background-color]",
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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: project.id,
    disabled: !canDrag,
  })
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

  return (
    <ProjectContextMenu project={project} status={status} actions={actions}>
      <ListRow
        ref={setNodeRef}
        {...(canDrag ? { ...attributes, ...listeners } : {})}
        className={cn(
          grid,
          "min-h-14 transition-opacity",
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
            {/* The link covers the whole row; the menu sits above it. */}
            <Link
              href={projectHref(project)}
              prefetch={false}
              draggable={false}
              className="text-foreground truncate outline-none after:absolute after:inset-0 focus-visible:underline"
            >
              {project.name}
            </Link>
            {meta.length > 0 && (
              <span className="text-tertiary-foreground truncate text-[13px]">
                {meta.join(" · ")}
              </span>
            )}
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
  )
}

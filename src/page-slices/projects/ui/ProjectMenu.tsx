"use client"

import { ContextMenu } from "@base-ui/react/context-menu"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePortalContainer } from "@/components/ui/portal-container"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { RiDeleteBinLine, RiMoreFill } from "@/shared/ui/lucide-icons"
import { Pencil } from "lucide-react"
import type * as React from "react"
import {
  ALL_STATUSES,
  STATUS_LABEL_KEYS,
  type ProjectStatus,
} from "../lib/status"
import type { ProjectListRow } from "./ProjectList"
import { ProjectStatusIcon } from "./ProjectStatusIcon"

/** What a viewer may do to a project from its menu (absent = not allowed). */
export type ProjectActions = {
  /** PMs and stakeholders. */
  onMove?: (project: ProjectListRow, status: ProjectStatus) => void
  /** Stakeholders. */
  onEdit?: (project: ProjectListRow) => void
  onDelete?: (project: ProjectListRow) => void
}

export const hasProjectActions = (actions?: ProjectActions) =>
  Boolean(actions && (actions.onMove || actions.onEdit || actions.onDelete))

/** The statuses as a pick-one list under a label; the current one is checked. */
export function MoveToStatusItems({
  label,
  current,
  onMove,
}: {
  label: string
  current: ProjectStatus
  onMove: (status: ProjectStatus) => void
}) {
  const t = useT("projects")
  return (
    // A group label needs its group (base-ui).
    <DropdownMenuGroup>
      <DropdownMenuLabel>{label}</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={current}
        onValueChange={(value) => {
          if (value !== current) onMove(value as ProjectStatus)
        }}
      >
        {ALL_STATUSES.map((status) => (
          <DropdownMenuRadioItem key={status} value={status} closeOnClick>
            <ProjectStatusIcon status={status} />
            {t(STATUS_LABEL_KEYS[status])}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuGroup>
  )
}

/** "Pindahkan ke" (the statuses, right there), then edit / delete. */
function ProjectMenuItems({
  project,
  status,
  actions,
}: {
  project: ProjectListRow
  status: ProjectStatus
  actions: ProjectActions
}) {
  const t = useT("projects")
  const tc = useT("common")
  const { onMove, onEdit, onDelete } = actions
  return (
    <>
      {onMove && (
        <MoveToStatusItems
          label={t("moveTo")}
          current={status}
          onMove={(next) => onMove(project, next)}
        />
      )}
      {onMove && (onEdit || onDelete) && <DropdownMenuSeparator />}
      {onEdit && (
        <DropdownMenuItem onClick={() => onEdit(project)}>
          <Pencil />
          {t("actionEdit")}
        </DropdownMenuItem>
      )}
      {onDelete && (
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(project)}
        >
          <RiDeleteBinLine />
          {tc("delete")}
        </DropdownMenuItem>
      )}
    </>
  )
}

/** "…" button with the project's menu. Sits above row/card links. */
export function ProjectMenuButton({
  project,
  status = project.status,
  actions,
  className,
}: {
  project: ProjectListRow
  status?: ProjectStatus
  actions: ProjectActions
  className?: string
}) {
  const t = useT("projects")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("projectActions", { name: project.name })}
            className={cn("text-muted-foreground relative z-10", className)}
            // Keep the press from starting a drag or following the link.
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          />
        }
      >
        <RiMoreFill />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <ProjectMenuItems project={project} status={status} actions={actions} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Right-click on a row or card opens the same menu at the pointer. */
export function ProjectContextMenu({
  project,
  status = project.status,
  actions,
  children,
}: {
  project: ProjectListRow
  status?: ProjectStatus
  actions?: ProjectActions
  children: React.ReactElement
}) {
  const container = usePortalContainer()
  if (!actions || !hasProjectActions(actions)) return children
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger render={children} />
      <ContextMenu.Portal container={container}>
        <ContextMenu.Positioner className="isolate z-50 outline-none">
          <ContextMenu.Popup
            data-slot="dropdown-menu-content"
            className="bg-popover text-popover-foreground data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 nest-rounded-2xl nest-p-2 z-50 max-h-(--available-height) w-max min-w-44 origin-(--transform-origin) overflow-x-hidden overflow-y-auto shadow-(--elev-4) duration-150 ease-out outline-none"
          >
            <ProjectMenuItems
              project={project}
              status={status}
              actions={actions}
            />
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

/**
 * Project header: the status as a button; opening it is "Pindahkan ke"
 * (PMs and stakeholders).
 */
export function ProjectStatusButton({
  status,
  onMove,
}: {
  status: ProjectStatus
  onMove: (status: ProjectStatus) => void
}) {
  const t = useT("projects")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            aria-label={`${t("moveTo")}: ${t(STATUS_LABEL_KEYS[status])}`}
          />
        }
      >
        <ProjectStatusIcon status={status} />
        <span className="hidden sm:inline">{t(STATUS_LABEL_KEYS[status])}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <MoveToStatusItems
          label={t("moveTo")}
          current={status}
          onMove={onMove}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

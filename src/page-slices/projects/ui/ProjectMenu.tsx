"use client"

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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { RiDeleteBinLine, RiMoreFill } from "@/shared/ui/lucide-icons"
import {
  ContextTarget,
  copyText,
  registerContextType,
  type CtxItem,
} from "@/shared/context-menu"
import { projectHref } from "@/shared/lib/url-params"
import { CircleDashed, Copy, Pencil } from "lucide-react"
import { cloneElement } from "react"
import type * as React from "react"
import {
  ALL_STATUSES,
  asStage,
  PROJECT_STAGES,
  STAGE_LABEL_KEYS,
  STATUS_LABEL_KEYS,
  type ProjectStage,
  type ProjectStatus,
} from "../lib/status"
import type { ProjectListRow } from "./ProjectList"
import { StageMenuItems } from "./ProjectStage"
import { ProjectStageIcon } from "./ProjectStageIcon"
import { ProjectStatusIcon } from "./ProjectStatusIcon"

/** What a viewer may do to a project from its menu (absent = not allowed). */
export type ProjectActions = {
  /** PMs and stakeholders. */
  onMove?: (project: ProjectListRow, status: ProjectStatus) => void
  /** PMs and stakeholders: what the team is working on now. */
  onStage?: (project: ProjectListRow, stage: ProjectStage | null) => void
  /** Stakeholders. */
  onEdit?: (project: ProjectListRow) => void
  onDelete?: (project: ProjectListRow) => void
}

export const hasProjectActions = (actions?: ProjectActions) =>
  Boolean(
    actions &&
    (actions.onMove || actions.onStage || actions.onEdit || actions.onDelete),
  )

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
  const { onMove, onStage, onEdit, onDelete } = actions
  return (
    <>
      {onMove && (
        <MoveToStatusItems
          label={t("moveTo")}
          current={status}
          onMove={(next) => onMove(project, next)}
        />
      )}
      {onMove && onStage && <DropdownMenuSeparator />}
      {onStage && (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {asStage(project.stage) ? (
              <ProjectStageIcon stage={asStage(project.stage)!} />
            ) : (
              <CircleDashed />
            )}
            {t("setStage")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-44">
            <StageMenuItems
              current={asStage(project.stage)}
              onPick={(next) => onStage(project, next)}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )}
      {(onMove || onStage) && (onEdit || onDelete) && <DropdownMenuSeparator />}
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

/**
 * Anyone can copy a project's name from wherever it is marked
 * (`data-ctx="project"`); rows with actions add theirs (below).
 */
registerContextType("project", (el) => {
  const name = el.dataset.ctxLabel
  if (!name) return null
  return {
    label: name,
    items: [
      {
        id: "copy-name",
        label: el.dataset.ctxCopyLabel ?? "Salin nama",
        icon: Copy,
        onSelect: () => copyText(name),
      },
    ],
  }
})

/** The status icon as a menu icon. */
const statusIcon = (status: ProjectStatus) =>
  function StatusIcon({ className }: { className?: string }) {
    return <ProjectStatusIcon status={status} className={className} />
  }

/** The stage glyph as a menu icon. */
const stageIcon = (stage: ProjectStage) =>
  function StageIcon({ className }: { className?: string }) {
    return <ProjectStageIcon stage={stage} className={className} />
  }

/**
 * Right-click on a row or card (the app-wide menu, shared/context-menu):
 * Buka / Buka di tab baru / Salin link, then "Pindahkan ke", Ubah, Hapus —
 * the same actions as the "…" menu.
 */
export function ProjectContextMenu({
  project,
  status = project.status,
  actions,
  children,
}: {
  project: ProjectListRow
  status?: ProjectStatus
  actions?: ProjectActions
  children: React.ReactElement<Record<string, unknown>>
}) {
  const t = useT("projects")
  const tc = useT("common")
  const tm = useT("ctxmenu")
  return (
    <ContextTarget
      type="project"
      id={project.id}
      label={project.name}
      href={projectHref(project)}
      items={(): CtxItem[] => {
        const { onMove, onStage, onEdit, onDelete } = actions ?? {}
        const stage = asStage(project.stage)
        return [
          {
            id: "move",
            label: t("moveTo"),
            icon: statusIcon(status),
            hint: t(STATUS_LABEL_KEYS[status]),
            hidden: !onMove,
            submenu: ALL_STATUSES.map((s) => ({
              id: s,
              label: t(STATUS_LABEL_KEYS[s]),
              icon: statusIcon(s),
              role: "radio" as const,
              checked: s === status,
              onSelect: () => {
                if (s !== status) onMove?.(project, s)
              },
            })),
          },
          {
            id: "stage",
            label: t("setStage"),
            icon: stage ? stageIcon(stage) : CircleDashed,
            hint: stage ? t(STAGE_LABEL_KEYS[stage]) : t("stageNone"),
            hidden: !onStage,
            submenu: [...PROJECT_STAGES, null].map((s) => ({
              id: s ?? "none",
              label: s ? t(STAGE_LABEL_KEYS[s]) : t("stageNone"),
              icon: s ? stageIcon(s) : CircleDashed,
              role: "radio" as const,
              checked: s === stage,
              onSelect: () => {
                if (s !== stage) onStage?.(project, s)
              },
            })),
          },
          {
            id: "edit",
            label: t("actionEdit"),
            icon: Pencil,
            hidden: !onEdit,
            onSelect: () => onEdit?.(project),
          },
          {
            id: "delete",
            label: tc("delete"),
            icon: RiDeleteBinLine,
            destructive: true,
            hidden: !onDelete,
            // The delete dialog asks first.
            onSelect: () => onDelete?.(project),
          },
        ].filter((item) => !item.hidden)
      }}
    >
      {cloneElement(children, {
        "data-ctx-label": project.name,
        "data-ctx-copy-label": tm("copyName"),
      })}
    </ContextTarget>
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

"use client"

import { AnimatePresence } from "motion/react"
import { AvatarGroup, AvatarOverflow } from "@/components/avatar-group"
import type { ProjectStatus } from "@/page-slices/projects/lib/status"
import { ProjectStatusIcon } from "./ProjectStatusIcon"
import { EmptyState } from "@/components/empty-state"
import {
  GroupedList,
  ListGroup,
  ListRow,
  ListRowActions,
} from "@/components/grouped-list"
import { ProjectAvatar } from "@/components/project-avatar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { RiFolderLine } from "@/shared/ui/lucide-icons"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { format, type Locale } from "date-fns"
import Link from "next/link"

export type ProjectListRow = {
  id: string
  name: string
  status: ProjectStatus
  start_date: string
  end_date: string
  quarter_id: string | null
  client_name?: string | null
  project_assignments:
    | {
        id: string
        profiles: { full_name: string | null; avatar_url: string | null } | null
      }[]
    | null
}

const GROUPS = [
  { status: "Planned", labelKey: "statusPlanned" },
  { status: "Active", labelKey: "statusActive" },
  { status: "Review", labelKey: "statusReview" },
  { status: "Completed", labelKey: "statusCompleted" },
  { status: "Archived", labelKey: "statusArchived" },
] as const

/** Shared column template so rows line up across every status group. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_7rem_6.5rem] lg:grid-cols-[minmax(0,1fr)_7rem_6.5rem_6.5rem]"
/** Same, plus a column for the stakeholder's hover actions. */
const ROW_GRID_ACTIONS =
  "grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-x-4 md:grid-cols-[minmax(0,1fr)_7rem_6.5rem_13rem] lg:grid-cols-[minmax(0,1fr)_7rem_6.5rem_6.5rem_13rem]"

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

export type ProjectActions = {
  onEdit: (project: ProjectListRow) => void
  onToggleArchive: (project: ProjectListRow) => void
  onDelete: (project: ProjectListRow) => void
}

/** Daftar Project grouped by status (the kanban workflow); archived starts collapsed. */
export function ProjectList({
  projects,
  actions,
}: {
  projects: ProjectListRow[]
  /** Stakeholders manage projects from the list. */
  actions?: ProjectActions
}) {
  const t = useT("projects")
  if (projects.length === 0) {
    return (
      <EmptyState
        title={t("emptyTitle")}
        description={t("emptyDescription")}
        icon={<RiFolderLine className="size-5" />}
        placement="inner"
      />
    )
  }

  const grid = actions ? ROW_GRID_ACTIONS : ROW_GRID

  return (
    <GroupedList>
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
        {actions && <span className="hidden md:block" />}
      </div>
      {GROUPS.map(({ status, labelKey }) => {
        const items = projects.filter((p) => p.status === status)
        if (items.length === 0) return null
        return (
          <ListGroup
            key={status}
            icon={<ProjectStatusIcon status={status} />}
            label={t(labelKey)}
            count={items.length}
            defaultOpen={status !== "Archived"}
          >
            <AnimatePresence initial={false}>
              {items.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  grid={grid}
                  actions={actions}
                />
              ))}
            </AnimatePresence>
          </ListGroup>
        )
      })}
    </GroupedList>
  )
}

function ProjectRow({
  project,
  grid,
  actions,
}: {
  project: ProjectListRow
  grid: string
  actions?: ProjectActions
}) {
  const t = useT("projects")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const team = (project.project_assignments ?? []).map((a) => ({
    id: a.id,
    name: a.profiles?.full_name || t("unknownMember"),
    image: a.profiles?.avatar_url || undefined,
  }))
  const meta = [project.client_name, project.quarter_id].filter(Boolean)

  return (
    <ListRow className={cn(grid, "min-h-14")}>
      <div className="flex min-w-0 items-center gap-3">
        <ProjectAvatar
          id={project.id}
          name={project.name}
          className="size-7 rounded-md text-[11px]"
        />
        <div className="flex min-w-0 flex-col">
          {/* The link covers the whole row; actions sit above it. */}
          <Link
            href={`/projects/${project.id}`}
            prefetch={false}
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
        <div className="hidden justify-end md:flex">
          <ListRowActions className="relative z-10">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => actions.onEdit(project)}
            >
              {t("actionEdit")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => actions.onToggleArchive(project)}
            >
              {project.status === "Archived"
                ? t("actionActivate")
                : t("actionArchive")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => actions.onDelete(project)}
            >
              {tc("delete")}
            </Button>
          </ListRowActions>
        </div>
      )}
    </ListRow>
  )
}

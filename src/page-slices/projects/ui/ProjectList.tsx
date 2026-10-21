"use client"

import { AvatarGroup, AvatarOverflow } from "@/components/avatar-group"
import { EmptyState } from "@/components/empty-state"
import {
  GroupedList,
  ListChip,
  ListGroup,
  ListRow,
  ListRowActions,
} from "@/components/grouped-list"
import { ProjectAvatar } from "@/components/project-avatar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  RiArrowRightSLine,
  RiCalendarLine,
  RiFolderLine,
} from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { CircleCheck, CircleDot, Archive } from "lucide-react"
import Link from "next/link"

export type ProjectListRow = {
  id: string
  name: string
  status: "Active" | "Completed" | "Archived"
  start_date: string
  end_date: string
  quarter_id: string | null
  project_assignments:
    | {
        id: string
        profiles: { full_name: string | null; avatar_url: string | null } | null
      }[]
    | null
}

const GROUPS = [
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
] as const

function range(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const sameYear = s.getFullYear() === e.getFullYear()
  return `${format(s, sameYear ? "d MMM" : "d MMM yyyy", { locale: idLocale })} – ${format(e, "d MMM yyyy", { locale: idLocale })}`
}

/** Daftar Project grouped by status; archived starts collapsed. */
export type ProjectActions = {
  onEdit: (project: ProjectListRow) => void
  onToggleArchive: (project: ProjectListRow) => void
  onDelete: (project: ProjectListRow) => void
}

export function ProjectList({
  projects,
  actions,
}: {
  projects: ProjectListRow[]
  /** Stakeholders manage projects from the list. */
  actions?: ProjectActions
}) {
  if (projects.length === 0) {
    return (
      <EmptyState
        title="Belum ada project"
        description="Project yang dibuat akan muncul di sini."
        icon={<RiFolderLine className="size-5" />}
        placement="inner"
      />
    )
  }

  return (
    <GroupedList>
      {GROUPS.map(({ status, label, icon: Icon, tone }) => {
        const items = projects.filter((p) => p.status === status)
        if (items.length === 0) return null
        return (
          <ListGroup
            key={status}
            icon={<Icon aria-hidden className={`size-4 ${tone}`} />}
            label={label}
            count={items.length}
            defaultOpen={status !== "Archived"}
          >
            {items.map((project) => {
              const team = (project.project_assignments ?? []).map((a) => ({
                id: a.id,
                name: a.profiles?.full_name || "Unknown",
                image: a.profiles?.avatar_url || undefined,
              }))
              return (
                <ListRow key={project.id} className="relative">
                  <ProjectAvatar id={project.id} name={project.name} />
                  <Link
                    href={`/projects/${project.id}`}
                    prefetch={false}
                    className="min-w-0 flex-1 truncate font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                  >
                    {project.name}
                  </Link>
                  {project.quarter_id && (
                    <ListChip>{project.quarter_id}</ListChip>
                  )}
                  <ListChip>
                    <RiCalendarLine className="size-3.5" />
                    {range(project.start_date, project.end_date)}
                  </ListChip>
                  {actions && (
                    <ListRowActions className="relative z-10">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => actions.onEdit(project)}
                      >
                        Ubah
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => actions.onToggleArchive(project)}
                      >
                        {project.status === "Archived"
                          ? "Aktifkan"
                          : "Arsipkan"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => actions.onDelete(project)}
                      >
                        Hapus
                      </Button>
                    </ListRowActions>
                  )}
                  <div className="flex w-24 shrink-0 justify-end">
                    {team.length > 0 ? (
                      <AvatarGroup>
                        {team.slice(0, 3).map((m) => (
                          <Avatar key={m.id} className="size-6">
                            <AvatarImage src={m.image} alt={m.name} />
                            <AvatarFallback className="text-[10px]">
                              {m.name
                                .split(" ")
                                .map((part) => part[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {team.length > 3 && (
                          <AvatarOverflow count={team.length - 3} size="xs" />
                        )}
                      </AvatarGroup>
                    ) : (
                      <span className="text-muted-foreground/60 text-xs">
                        Belum ada tim
                      </span>
                    )}
                  </div>
                  <RiArrowRightSLine className="text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover/row:opacity-100" />
                </ListRow>
              )
            })}
          </ListGroup>
        )
      })}
    </GroupedList>
  )
}

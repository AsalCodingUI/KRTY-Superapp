"use client"

import { STATUS_LABEL_KEYS } from "@/page-slices/projects/lib/status"
import { EmptyValue } from "@/components/empty-value"
import { PageHeader } from "@/components/page-header"
import {
  deleteProject,
  setProjectStatus,
} from "@/app/(main)/projects/actions/project-actions"
import { AvatarGroup, AvatarOverflow } from "@/components/avatar-group"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { ListChip } from "@/components/grouped-list"
import { ProjectStatusIcon } from "./ProjectStatusIcon"
import { ProjectAvatar } from "@/components/project-avatar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useViewMode, ViewToggle } from "@/components/view-toggle"
import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import { RiAddLine, RiSearchLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { format } from "date-fns"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  ProjectList,
  type ProjectActions,
  type ProjectListRow,
} from "./ProjectList"

// Kanban (dnd) and the form dialog load only when used.
const ProjectKanban = dynamic(
  () => import("./ProjectKanban").then((m) => m.ProjectKanban),
  {
    loading: () => (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    ),
  },
)
const ProjectForm = dynamic(
  () => import("./ProjectForm").then((m) => m.ProjectForm),
  { loading: () => null },
)

const QUERY_KEY = ["projects", "list-page"]

/**
 * Daftar Project: list, kanban (drag to change status) or table. Calculator
 * and SLA Generator are hidden here for now; they move elsewhere later.
 */
export function ProjectsListPage() {
  const t = useT("projects")
  const tc = useT("common")
  const supabase = useMemo(() => createClient(), [])
  const queryClient = useQueryClient()
  const { profile } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const [view, setView] = useViewMode("projects", "kanban")
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [formMounted, setFormMounted] = useState(false)
  if (formOpen && !formMounted) setFormMounted(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<ProjectListRow | null>(null)

  const { data: allProjects = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          `id, name, status, start_date, end_date, quarter_id, client_name,
           project_assignments ( id, profiles ( full_name, avatar_url ) )`,
        )
        .order("end_date", { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as ProjectListRow[]
    },
  })

  const needle = query.trim().toLowerCase()
  const projects = useMemo(
    () =>
      needle
        ? allProjects.filter((p) =>
            `${p.name} ${p.client_name ?? ""}`.toLowerCase().includes(needle),
          )
        : allProjects,
    [allProjects, needle],
  )

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["projects"] })

  const changeStatus = async (
    project: ProjectListRow,
    status: ProjectListRow["status"],
  ) => {
    const result = await setProjectStatus(project.id, status)
    if (!result.success) {
      toast.error(result.error)
      return false
    }
    toast.success(`${project.name} → ${t(STATUS_LABEL_KEYS[status])}`)
    refresh()
    return true
  }

  const actions: ProjectActions | undefined = isAdmin
    ? {
        onEdit: (project) => {
          setEditingId(project.id)
          setFormOpen(true)
        },
        onToggleArchive: (project) =>
          void changeStatus(
            project,
            project.status === "Archived" ? "Active" : "Archived",
          ),
        onDelete: setDeleting,
      }
    : undefined

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        title={t("title")}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <RiSearchLine className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                type="search"
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchLabel")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ViewToggle
              value={view}
              onValueChange={setView}
              modes={["kanban", "list", "table"]}
            />
            {isAdmin && (
              <Button
                onClick={() => {
                  setEditingId(null)
                  setFormOpen(true)
                }}
              >
                <RiAddLine data-icon="inline-start" />
                {t("newProject")}
              </Button>
            )}
          </div>
        }
      />

      <div className="pb-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-6" />
          </div>
        ) : needle && projects.length === 0 ? (
          <EmptyState
            title={t("noMatch", { query: query.trim() })}
            description={t("noMatchHint")}
            icon={<RiSearchLine />}
          />
        ) : view === "kanban" ? (
          <ProjectKanban
            projects={projects}
            onMove={isAdmin ? changeStatus : undefined}
          />
        ) : view === "table" ? (
          <ProjectTable projects={projects} />
        ) : (
          <ProjectList projects={projects} actions={actions} />
        )}
      </div>

      {isAdmin && (
        <>
          {formMounted && (
            <ProjectForm
              projectId={editingId}
              open={formOpen}
              onOpenChange={setFormOpen}
              onSaved={refresh}
            />
          )}
          <ConfirmDialog
            open={Boolean(deleting)}
            onOpenChange={(open) => !open && setDeleting(null)}
            title={t("deleteTitle", {
              name: deleting?.name ?? t("projectFallback"),
            })}
            description={t("deleteDescription")}
            confirmText={t("deletePermanently")}
            cancelText={tc("cancel")}
            variant="destructive"
            onConfirm={async () => {
              if (!deleting) return
              const result = await deleteProject(deleting.id)
              if (result.success) {
                toast.success(t("projectDeleted"))
                refresh()
              } else {
                toast.error(result.error)
              }
              setDeleting(null)
            }}
          />
        </>
      )}
    </div>
  )
}

function ProjectTable({ projects }: { projects: ProjectListRow[] }) {
  const t = useT("projects")
  const dateLocale = useDateLocale()
  const columns = useMemo<ColumnDef<ProjectListRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("colProject")} />
        ),
        cell: ({ row }) => (
          <Link
            href={`/projects/${row.original.id}`}
            prefetch={false}
            className="flex items-center gap-2 hover:underline"
          >
            <ProjectAvatar id={row.original.id} name={row.original.name} />
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("colStatus")} />
        ),
        cell: ({ row }) => (
          <span className="flex items-center gap-2">
            <ProjectStatusIcon status={row.original.status} />
            {t(STATUS_LABEL_KEYS[row.original.status])}
          </span>
        ),
      },
      {
        accessorKey: "quarter_id",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("colQuarter")} />
        ),
        cell: ({ row }) =>
          row.original.quarter_id ? (
            <ListChip>{row.original.quarter_id}</ListChip>
          ) : (
            <EmptyValue />
          ),
      },
      {
        accessorKey: "end_date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("colSchedule")} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {format(new Date(row.original.start_date), "d MMM", {
              locale: dateLocale,
            })}{" "}
            –{" "}
            {format(new Date(row.original.end_date), "d MMM yyyy", {
              locale: dateLocale,
            })}
          </span>
        ),
      },
      {
        id: "team",
        header: () => <span>{t("colTeam")}</span>,
        cell: ({ row }) => {
          const team = row.original.project_assignments ?? []
          if (team.length === 0) return <EmptyValue />
          return (
            <AvatarGroup>
              {team.slice(0, 3).map((a) => (
                <Avatar key={a.id} className="size-6">
                  <AvatarImage
                    src={a.profiles?.avatar_url || undefined}
                    alt=""
                  />
                  <AvatarFallback className="text-[10px]">
                    {(a.profiles?.full_name || "U").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {team.length > 3 && (
                <AvatarOverflow count={team.length - 3} size="xs" />
              )}
            </AvatarGroup>
          )
        },
      },
    ],
    [t, dateLocale],
  )
  return (
    <DataTable
      data={projects}
      columns={columns}
      enableSelection={false}
      showExport={false}
      showViewOptions={false}
      showFilterbar={false}
      showTableWrapper={false}
    />
  )
}

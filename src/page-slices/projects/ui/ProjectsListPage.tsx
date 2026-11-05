"use client"

import { useRealtimeRefresh } from "@/shared/hooks/useRealtimeRefresh"
import { BRIEFS_KEY } from "@/page-slices/briefs/model/data"
import { projectHref } from "@/shared/lib/url-params"
import { STATUS_LABEL_KEYS } from "@/page-slices/projects/lib/status"
import { EmptyValue } from "@/components/empty-value"
import { PageHeader } from "@/components/page-header"
import { SegmentedControl } from "@/components/segmented-control"
import {
  deleteProject,
  setProjectStatus,
} from "@/app/(main)/projects/actions/project-actions"
import { AvatarGroup, AvatarOverflow } from "@/components/avatar-group"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { ListChip } from "@/components/grouped-list"
import { ProjectStatusIcon } from "./ProjectStatusIcon"
import { registerProjectStatusUndo } from "./project-undo"
import { ProjectAvatar } from "@/components/project-avatar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { useViewMode, ViewToggle } from "@/components/view-toggle"
import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { accessLevel, canRunProjects } from "@/shared/config/access"
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
import { registerUndo } from "@/shared/undo"
import { useSetProjectStage } from "./ProjectStage"
import { BriefShortcut } from "@/page-slices/briefs/ui/BriefShortcut"
import { BriefsView } from "@/page-slices/briefs/ui/BriefsView"
import { replaceUrl } from "@/shared/lib/url-params"
import { usePathname, useSearchParams } from "next/navigation"
import {
  ProjectList,
  type ProjectActions,
  type ProjectListRow,
} from "./ProjectList"
import { ProjectContextMenu } from "./ProjectMenu"
import {
  ProjectsFilterMenu,
  applyListOptions,
  pruneListOptions,
  useListOptions,
} from "./ProjectsFilterMenu"
import { initials } from "@/shared/lib/initials"

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
 * Daftar Project: list, kanban or table. PMs and stakeholders create
 * projects and move them between statuses (drag, or "Pindahkan ke").
 */
export function ProjectsListPage() {
  const t = useT("projects")
  const tu = useT("undo")
  const tc = useT("common")
  const tb = useT("briefs")
  const supabase = useMemo(() => createClient(), [])
  const queryClient = useQueryClient()
  const { profile } = useUserProfile()
  const isAdmin = canManageByRole(profile?.role)
  const canRun = canRunProjects(accessLevel(profile))
  const [view, setView] = useViewMode("projects", "kanban")
  const [options, setOptions] = useListOptions()
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [formMounted, setFormMounted] = useState(false)
  if (formOpen && !formMounted) setFormMounted(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<ProjectListRow | null>(null)
  // Project | Dokumen (briefs), in the URL (?scope=docs) so a notice can
  // open a brief there.
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const scope = searchParams.get("scope") === "docs" ? "docs" : "projects"
  const setScope = (next: "projects" | "docs") => {
    const params = new URLSearchParams(searchParams.toString())
    if (next === "docs") params.set("scope", "docs")
    else params.delete("scope")
    params.delete("brief")
    replaceUrl(params.size ? `${pathname}?${params}` : pathname)
  }
  const [briefOpen, setBriefOpen] = useState(false)
  const [briefQuery, setBriefQuery] = useState("")
  const setStage = useSetProjectStage()

  // Stakeholders see every project; everyone else the ones they're on
  // (shared/config/access.ts). Pending until the profile is known.
  const { data: allProjects = [], isPending: isLoading } = useQuery({
    queryKey: [...QUERY_KEY, isAdmin ? "all" : profile?.id],
    enabled: Boolean(profile),
    queryFn: async () => {
      // Not a stakeholder: only projects with your assignment, in the same
      // request (an inner-joined `mine`, filtered to you); the team embed
      // stays whole for the avatars.
      const columns = `id, name, status, stage, position, start_date, end_date, quarter_id,
           client_name, updated_at,
           process:processes ( id, name ),
           category:project_categories ( id, name ),
           project_assignments ( id, user_id, profiles ( full_name, avatar_url ) )`
      let request = supabase
        .from("projects")
        .select(
          isAdmin
            ? columns
            : `${columns}, mine:project_assignments!inner ( user_id )`,
        )
        .order("end_date", { ascending: false })
      if (!isAdmin)
        request = request.eq("mine.user_id" as never, profile!.id as never)
      const { data, error } = await request
      if (error) throw error
      return (data ?? []) as unknown as ProjectListRow[]
    },
  })

  const needle = query.trim().toLowerCase()
  // Saved filters that match nothing loaded (a deleted category) don't apply.
  const effective = useMemo(
    () => pruneListOptions(options, allProjects),
    [options, allProjects],
  )
  const projects = useMemo(() => {
    const found = needle
      ? allProjects.filter((p) =>
          `${p.name} ${p.client_name ?? ""} ${p.category?.name ?? ""}`
            .toLowerCase()
            .includes(needle),
        )
      : allProjects
    return applyListOptions(found, effective, profile?.id ?? null)
  }, [allProjects, needle, effective, profile?.id])
  const filtered = projects.length < allProjects.length

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
    registerProjectStatusUndo({
      projectId: project.id,
      label: tu("projectStatus", {
        name: project.name,
        status: t(STATUS_LABEL_KEYS[status]),
      }),
      from: project.status,
      to: status,
      refresh,
    })
    return true
  }

  const listKey = [...QUERY_KEY, isAdmin ? "all" : profile?.id]
  // Live: projects (and teams) others add or change show up here.
  // Just this list (either viewer variant), not every ["projects", …] query.
  useRealtimeRefresh("projects-list", [
    { table: "projects", keys: () => [QUERY_KEY] },
    { table: "project_assignments", keys: () => [QUERY_KEY] },
    { table: "briefs", keys: () => [BRIEFS_KEY] },
  ])
  /** Writes a group's order (positions 1024, 2048…) and shows it at once. */
  const saveOrder = async (ids: string[]) => {
    const positionOf = new Map(ids.map((id, i) => [id, (i + 1) * 1024]))
    queryClient.setQueryData<ProjectListRow[]>(listKey, (rows = []) =>
      rows.map((p) =>
        positionOf.has(p.id) ? { ...p, position: positionOf.get(p.id)! } : p,
      ),
    )
    const { error } = await supabase.rpc("reorder_projects", { p_ids: ids })
    if (error) {
      toast.error(t("reorderFailed"))
      void refresh()
      return false
    }
    void refresh()
    return true
  }
  const reorder = async (ids: string[]) => {
    // The order before the drag, as the list showed it.
    const before = projects.filter((p) => ids.includes(p.id)).map((p) => p.id)
    // A drag means "this order": the list keeps it from now on.
    if (options.sort !== "manual") setOptions({ sort: "manual" })
    if (!(await saveOrder(ids))) return
    registerUndo({
      label: tu("projectOrder"),
      undo: async () => void (await saveOrder(before)),
      redo: async () => void (await saveOrder(ids)),
    })
  }

  // Moving, editing and deleting: PMs (their list is only projects they're
  // on) and stakeholders.
  const onMove = canRun ? changeStatus : undefined
  const actions: Omit<ProjectActions, "onMove"> | undefined = canRun
    ? {
        onStage: (project, stage) => void setStage(project, stage),
        onEdit: (project) => {
          setEditingId(project.id)
          setFormOpen(true)
        },
        onDelete: setDeleting,
      }
    : undefined

  return (
    <div className="flex flex-col">
      <PageHeader
        title={
          <SegmentedControl
            fitContent
            value={scope}
            onChange={setScope}
            items={[
              { value: "projects", label: t("scopeProjects") },
              { value: "docs", label: t("scopeDocs") },
            ]}
          />
        }
        actions={
          scope === "docs" ? (
            <div className="flex items-center gap-2">
              <InputGroup className="w-32 min-w-0 sm:w-64">
                <InputGroupAddon>
                  <RiSearchLine />
                </InputGroupAddon>
                <InputGroupInput
                  type="search"
                  placeholder={tb("searchPlaceholder")}
                  aria-label={tb("searchPlaceholder")}
                  value={briefQuery}
                  onChange={(e) => setBriefQuery(e.target.value)}
                />
              </InputGroup>
              {canRun && (
                <Button
                  aria-label={tb("newBrief")}
                  onClick={() => setBriefOpen(true)}
                >
                  <RiAddLine data-icon="inline-start" />
                  <span className="hidden sm:inline">{tb("newBrief")}</span>
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <InputGroup className="w-32 min-w-0 sm:w-64">
                <InputGroupAddon>
                  <RiSearchLine />
                </InputGroupAddon>
                <InputGroupInput
                  type="search"
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("searchLabel")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </InputGroup>
              <ProjectsFilterMenu
                projects={allProjects}
                options={effective}
                onChange={setOptions}
              />
              <ViewToggle
                value={view}
                onValueChange={setView}
                modes={["kanban", "list", "table"]}
              />
              {canRun && (
                <Button
                  aria-label={t("newProject")}
                  onClick={() => {
                    setEditingId(null)
                    setFormOpen(true)
                  }}
                >
                  <RiAddLine data-icon="inline-start" />
                  {/* Icon only on phones, or the header runs off screen. */}
                  <span className="hidden sm:inline">{t("newProject")}</span>
                </Button>
              )}
            </div>
          )
        }
      />

      <div>
        {scope === "docs" ? (
          <BriefsView
            canManage={canRun}
            createOpen={briefOpen}
            onCreateOpenChange={setBriefOpen}
            query={briefQuery}
          />
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-6" />
          </div>
        ) : (needle || filtered) && projects.length === 0 ? (
          <EmptyState
            title={
              needle
                ? t("noMatch", { query: query.trim() })
                : t("noFilterMatch")
            }
            icon={<RiSearchLine />}
            action={
              filtered
                ? {
                    label: t("filterReset"),
                    onClick: () =>
                      setOptions({
                        statuses: [],
                        clients: [],
                        processes: [],
                        categories: [],
                        mine: false,
                      }),
                  }
                : undefined
            }
          />
        ) : view === "kanban" ? (
          <ProjectKanban
            projects={projects}
            onMove={onMove}
            actions={actions}
          />
        ) : view === "table" ? (
          <ProjectTable
            projects={projects}
            actions={{
              ...actions,
              onMove: onMove
                ? (p, status) => void onMove(p, status)
                : undefined,
            }}
          />
        ) : (
          <ProjectList
            projects={projects}
            actions={actions}
            onMove={onMove}
            onReorder={canRun ? (ids) => void reorder(ids) : undefined}
          />
        )}
      </div>

      {canRun && formMounted && (
        <ProjectForm
          projectId={editingId}
          open={formOpen}
          onOpenChange={setFormOpen}
          onSaved={refresh}
        />
      )}
      {canRun && (
        <>
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

function ProjectTable({
  projects,
  actions,
}: {
  projects: ProjectListRow[]
  /** The rows' right-click menu (same as the list's). */
  actions?: ProjectActions
}) {
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
          <span className="flex items-center gap-2">
            <Link
              href={projectHref(row.original)}
              prefetch={false}
              className="flex min-w-0 items-center gap-2 hover:underline"
            >
              <ProjectAvatar id={row.original.id} name={row.original.name} />
              <span className="truncate">{row.original.name}</span>
            </Link>
            <BriefShortcut projectId={row.original.id} />
          </span>
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
        id: "category",
        accessorFn: (row) => row.category?.name ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("colCategory")} />
        ),
        cell: ({ row }) =>
          row.original.category ? (
            <ListChip>{row.original.category.name}</ListChip>
          ) : (
            <EmptyValue />
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
                    {initials(a.profiles?.full_name, "U")}
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
      wrapRow={(project, row) => (
        <ProjectContextMenu project={project} actions={actions}>
          {row}
        </ProjectContextMenu>
      )}
    />
  )
}

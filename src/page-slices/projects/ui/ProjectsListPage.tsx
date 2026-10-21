"use client"

import { QuarterBadge } from "@/app/(main)/performance/components/admin/QuarterBadge"
import type { TeamMember } from "@/page-slices/calculator/ui/types"
import { createClient } from "@/shared/api/supabase/client"
import { useMountedTabs } from "@/shared/hooks/useMountedTabs"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
import type { Database } from "@/shared/types/database.types"
import { AvatarGroup, AvatarOverflow } from "@/components/avatar-group"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import {
  useViewMode,
  ViewToggle,
  type ViewMode,
} from "@/components/view-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { RiArrowRightLine } from "@/shared/ui/lucide-icons"
import { useQuery } from "@tanstack/react-query"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { ProjectList } from "./ProjectList"

type ProjectStatus = Database["public"]["Enums"]["project_status_enum"]
type TabType = "projects" | "calculator" | "sla"
type SLARow = Database["public"]["Tables"]["slas"]["Row"]
type OperationalCost = Database["public"]["Tables"]["operational_costs"]["Row"]
type ProjectCalculation =
  Database["public"]["Tables"]["project_calculations"]["Row"]

type ProjectAssignment = {
  id: string
  role_in_project: string
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

type ProjectListItem = {
  id: string
  name: string
  status: ProjectStatus
  start_date: string
  end_date: string
  quarter_id: string | null
  project_assignments: ProjectAssignment[] | null
}

type ProjectStats = {
  total: number
  active: number
  archived: number
  calculations: number
  activeSlas: number
}

const projectColumnHelper = createColumnHelper<ProjectListItem>()

const getStatusVariant = (
  status: ProjectStatus,
): "success" | "info" | "secondary" => {
  const variants: Record<ProjectStatus, "success" | "info" | "secondary"> = {
    Active: "success",
    Completed: "info",
    Archived: "secondary",
  }
  return variants[status]
}

const getProjectTeamMembers = (project: ProjectListItem) =>
  project.project_assignments?.map((assignment) => ({
    id: assignment.id,
    name: assignment.profiles?.full_name || "Unknown",
    image: assignment.profiles?.avatar_url || undefined,
  })) || []

function ProjectsStats({ projectStats }: { projectStats: ProjectStats }) {
  const stats = [
    { label: "Total Projects", value: projectStats.total },
    { label: "Active Projects", value: projectStats.active },
    { label: "Archived Projects", value: projectStats.archived },
    { label: "Saved Calculations", value: projectStats.calculations },
    { label: "Active SLAs", value: projectStats.activeSlas },
  ]

  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-4 py-2 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <div key={stat.label} className="flex min-w-0 flex-col gap-1">
          <dt className="text-muted-foreground text-sm">{stat.label}</dt>
          <dd className="text-foreground text-lg font-medium tabular-nums">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function ProjectsTableContent({
  projects,
  view,
}: {
  projects: ProjectListItem[]
  view: ViewMode
}) {
  const router = useRouter()
  const columns = useMemo(
    () =>
      [
        projectColumnHelper.accessor("name", {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Project Name" />
          ),
          cell: ({ row }) => (
            <span className="text-foreground text-sm font-medium">
              {row.getValue("name")}
            </span>
          ),
        }),
        projectColumnHelper.accessor("quarter_id", {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Quarter" />
          ),
          cell: ({ row }) => {
            const quarterId = row.getValue("quarter_id") as string | null
            return quarterId ? (
              <QuarterBadge quarter={quarterId} />
            ) : (
              <span className="text-muted-foreground/50">No quarter</span>
            )
          },
        }),
        projectColumnHelper.accessor("status", {
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
          ),
          cell: ({ row }) => (
            <Badge variant={getStatusVariant(row.getValue("status"))}>
              {row.getValue("status")}
            </Badge>
          ),
        }),
        projectColumnHelper.display({
          id: "timeline",
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Timeline" />
          ),
          cell: ({ row }) => (
            <span className="text-foreground">
              {format(new Date(row.original.start_date), "MMM d, yyyy")} -{" "}
              {format(new Date(row.original.end_date), "MMM d, yyyy")}
            </span>
          ),
        }),
        projectColumnHelper.display({
          id: "team",
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Team" />
          ),
          cell: ({ row }) => {
            const teamMembers = getProjectTeamMembers(row.original)

            return teamMembers.length > 0 ? (
              <AvatarGroup>
                {teamMembers.slice(0, 3).map((member) => (
                  <Avatar key={member.id} className="size-7">
                    <AvatarImage src={member.image} alt={member.name} />
                    <AvatarFallback className="text-[10px]">
                      {member.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {teamMembers.length > 3 && (
                  <AvatarOverflow count={teamMembers.length - 3} size="sm" />
                )}
              </AvatarGroup>
            ) : (
              <span className="text-muted-foreground/50">No assignments</span>
            )
          },
        }),
        projectColumnHelper.display({
          id: "actions",
          header: () => <div className="text-right">Actions</div>,
          cell: ({ row }) => (
            <div className="flex justify-end">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => router.push(`/projects/${row.original.id}`)}
                title="Open Project"
              >
                <RiArrowRightLine className="size-3.5" />
              </Button>
            </div>
          ),
        }),
      ] as ColumnDef<ProjectListItem, unknown>[],
    [router],
  )

  if (view === "list") return <ProjectList projects={projects} />

  return (
    <section>
      <DataTable
        data={projects}
        columns={columns}
        enableSelection={false}
        showExport={false}
        showViewOptions={false}
        showFilterbar={false}
        showTableWrapper={true}
        tableTitle="Project List"
      />
    </section>
  )
}

const ProjectsTab = dynamic(() => Promise.resolve(ProjectsTableContent), {
  loading: () => null,
})

const CalculatorTab = dynamic(
  () => import("@/page-slices/calculator/ui/CalculatorPage"),
  {
    loading: () => null,
  },
)

const SLATab = dynamic(
  () => import("@/app/(main)/sla-generator/components/SLADashboard"),
  {
    loading: () => null,
  },
)

export function ProjectsListPage() {
  const supabase = useMemo(() => createClient(), [])
  const { activeTab, setActiveTab } = useTabRoute<TabType>({
    basePath: "/projects",
    tabs: ["projects", "calculator", "sla"],
    defaultTab: "projects",
    mode: "history",
  })
  const { isMounted } = useMountedTabs(activeTab)
  const [view, setView] = useViewMode("projects")

  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects", "list-page"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
            id,
            name,
            status,
            start_date,
            end_date,
            quarter_id,
            project_assignments (
              id,
              role_in_project,
              profiles (
                id,
                full_name,
                avatar_url
              )
            )
          `,
        )
        .order("created_at", { ascending: false })

      if (error) throw error
      return (data || []) as ProjectListItem[]
    },
  })

  const { data: teamMembersData, isLoading: isTeamMembersLoading } = useQuery({
    queryKey: ["projects", "calculator", "team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, job_title, hourly_rate, monthly_salary")
        .eq("role", "employee")
        .order("full_name", { ascending: true })

      if (error) throw error
      return (data || []) as unknown as TeamMember[]
    },
  })

  const { data: operationalCostsData, isLoading: isOperationalCostsLoading } =
    useQuery({
      queryKey: ["projects", "calculator", "operational-costs"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("operational_costs")
          .select("*")
          .order("item_name", { ascending: true })

        if (error) throw error
        return (data || []) as OperationalCost[]
      },
    })

  const {
    data: calculatorProjectsData,
    isLoading: isCalculatorProjectsLoading,
  } = useQuery({
    queryKey: ["projects", "calculator", "projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .neq("status", "Archived")
        .order("name", { ascending: true })

      if (error) throw error
      return (data || []) as { id: string; name: string }[]
    },
  })

  const { data: slasData, isLoading: isSLAsLoading } = useQuery({
    queryKey: ["projects", "list-page", "slas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slas")
        .select("id,client_name,project_name,created_at,archived_at")
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data || []).map((row: SLARow) => ({
        id: row.id,
        client_name: row.client_name,
        title: row.project_name,
        status: row.archived_at ? "Archived" : "Active",
        created_at: row.created_at,
        archived_at: row.archived_at,
      }))
    },
  })

  const { data: calculationsData, isLoading: isCalculationsLoading } = useQuery(
    {
      queryKey: ["projects", "list-page", "calculations"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("project_calculations")
          .select("id")

        if (error) throw error
        return (data || []) as Pick<ProjectCalculation, "id">[]
      },
    },
  )

  const projectStats = {
    total: projectsData?.length || 0,
    active:
      projectsData?.filter((project) => project.status === "Active").length ||
      0,
    archived:
      projectsData?.filter((project) => project.status === "Archived").length ||
      0,
    calculations: calculationsData?.length || 0,
    activeSlas:
      slasData?.filter(
        (sla: { archived_at: string | null }) => !sla.archived_at,
      ).length || 0,
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <section className="py-2">
          {isProjectsLoading || isSLAsLoading || isCalculationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-8" />
            </div>
          ) : (
            <ProjectsStats projectStats={projectStats} />
          )}
        </section>

        <div className="border-border border-b pt-2">
          <div className="pb-2 xl:hidden">
            <Select
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TabType)}
            >
              <SelectTrigger id="projects-tab-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="projects">Projects</SelectItem>
                <SelectItem value="calculator">Calculator</SelectItem>
                <SelectItem value="sla">SLA Generator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="hidden items-center justify-between gap-4 xl:flex">
            <TabNavigation value={activeTab} className="border-b-0">
              <TabNavigationLink
                active={activeTab === "projects"}
                onClick={() => setActiveTab("projects")}
              >
                Projects
              </TabNavigationLink>
              <TabNavigationLink
                active={activeTab === "calculator"}
                onClick={() => setActiveTab("calculator")}
              >
                Calculator
              </TabNavigationLink>
              <TabNavigationLink
                active={activeTab === "sla"}
                onClick={() => setActiveTab("sla")}
              >
                SLA Generator
              </TabNavigationLink>
            </TabNavigation>
            {activeTab !== "calculator" && (
              <ViewToggle value={view} onValueChange={setView} />
            )}
          </div>
        </div>

        <div className="py-4">
          {isMounted("projects") && (
            <div
              className={
                activeTab === "projects"
                  ? "block space-y-5"
                  : "hidden space-y-5"
              }
            >
              {isProjectsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="size-8" />
                </div>
              ) : (
                <ProjectsTab projects={projectsData || []} view={view} />
              )}
            </div>
          )}
          {isMounted("calculator") && (
            <div
              className={
                activeTab === "calculator"
                  ? "block space-y-5"
                  : "hidden space-y-5"
              }
            >
              {isTeamMembersLoading ||
              isOperationalCostsLoading ||
              isCalculatorProjectsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="size-8" />
                </div>
              ) : (
                <CalculatorTab
                  teamMembers={teamMembersData || []}
                  operationalCosts={operationalCostsData || []}
                  projects={calculatorProjectsData || []}
                  showHeader={false}
                />
              )}
            </div>
          )}
          {isMounted("sla") && (
            <div
              className={
                activeTab === "sla" ? "block space-y-5" : "hidden space-y-5"
              }
            >
              {isSLAsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner className="size-8" />
                </div>
              ) : (
                <div>
                  <SLATab
                    slas={slasData || []}
                    hideTitle
                    embedded
                    view={view}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

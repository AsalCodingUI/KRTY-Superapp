"use client"

import { QuarterBadge } from "@/app/(main)/performance/components/admin/QuarterBadge"
import type { TeamMember } from "@/page-slices/calculator/ui/types"
import { createClient } from "@/shared/api/supabase/client"
import { useMountedTabs } from "@/shared/hooks/useMountedTabs"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
import type { Database } from "@/shared/types/database.types"
import {
  Avatar,
  AvatarGroup,
  AvatarOverflow,
  Badge,
  Button,
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  TabNavigation,
  TabNavigationLink,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSection,
} from "@/shared/ui"
import { RiArrowRightLine, RiFolderLine } from "@/shared/ui/lucide-icons"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useMemo } from "react"

type ProjectStatus = Database["public"]["Enums"]["project_status_enum"]
type TabType = "projects" | "calculator" | "sla"
type SLARow = Database["public"]["Tables"]["slas"]["Row"]
type OperationalCost = Database["public"]["Tables"]["operational_costs"]["Row"]
type ProjectCalculation = Database["public"]["Tables"]["project_calculations"]["Row"]

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

const getStatusVariant = (
  status: ProjectStatus,
): "success" | "info" | "zinc" => {
  const variants: Record<ProjectStatus, "success" | "info" | "zinc"> = {
    Active: "success",
    Completed: "info",
    Archived: "zinc",
  }
  return variants[status]
}

function ProjectsTableContent({ projects }: { projects: ProjectListItem[] }) {
  const router = useRouter()

  return (
    <TableSection title="Project List">
      {projects.length === 0 ? (
        <div className="text-body-sm text-foreground-secondary rounded-lg border border-dashed p-6 text-center">
          No projects found.
        </div>
      ) : (
        <Table>
          <TableHead>
            <TableRow className="h-[40px] hover:bg-transparent">
              <TableHeaderCell>Project Name</TableHeaderCell>
              <TableHeaderCell>Quarter</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Timeline</TableHeaderCell>
              <TableHeaderCell>Team</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.map((project) => {
              const teamMembers =
                project.project_assignments?.map((assignment) => ({
                  id: assignment.id,
                  name: assignment.profiles?.full_name || "Unknown",
                  image: assignment.profiles?.avatar_url || undefined,
                })) || []

              return (
                <TableRow key={project.id}>
                  <TableCell>
                    <span className="text-label-md text-foreground-primary">
                      {project.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    {project.quarter_id ? (
                      <QuarterBadge quarter={project.quarter_id} />
                    ) : (
                      <span className="text-foreground-disable">No quarter</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(project.status)}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground-primary">
                      {format(new Date(project.start_date), "MMM d, yyyy")} -{" "}
                      {format(new Date(project.end_date), "MMM d, yyyy")}
                    </span>
                  </TableCell>
                  <TableCell>
                    {teamMembers.length > 0 ? (
                      <AvatarGroup>
                        {teamMembers.slice(0, 3).map((member) => (
                          <Avatar
                            key={member.id}
                            src={member.image}
                            alt={member.name}
                            size="sm"
                            initials={member.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)}
                          />
                        ))}
                        {teamMembers.length > 3 && (
                          <AvatarOverflow count={teamMembers.length - 3} size="sm" />
                        )}
                      </AvatarGroup>
                    ) : (
                      <span className="text-foreground-disable">No assignments</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon-sm"
                      variant="tertiary"
                      onClick={() => router.push(`/projects/${project.id}`)}
                      title="Open Project"
                    >
                      <RiArrowRightLine className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </TableSection>
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

  const { data: calculatorProjectsData, isLoading: isCalculatorProjectsLoading } =
    useQuery({
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

  const { data: calculationsData, isLoading: isCalculationsLoading } = useQuery({
    queryKey: ["projects", "list-page", "calculations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_calculations")
        .select("id")

      if (error) throw error
      return (data || []) as Pick<ProjectCalculation, "id">[]
    },
  })

  const projectStats = {
    total: projectsData?.length || 0,
    active:
      projectsData?.filter((project) => project.status === "Active").length || 0,
    archived:
      projectsData?.filter((project) => project.status === "Archived").length || 0,
    calculations: calculationsData?.length || 0,
    activeSlas:
      slasData?.filter((sla: { archived_at: string | null }) => !sla.archived_at)
        .length || 0,
  }

  return (
    <div className="flex flex-col">
      <div className="rounded-xxl flex items-center gap-2 px-5 pt-4 pb-3">
        <RiFolderLine className="text-foreground-secondary size-4" />
        <p className="text-label-md text-foreground-primary">Projects</p>
      </div>

      <div className="bg-surface-neutral-primary flex flex-col rounded-xxl">
        <div className="px-5 py-2 ">
          {isProjectsLoading || isSLAsLoading || isCalculationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : (
            <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-5">
              <Card className="px-4 py-3">
                <dt className="text-label-sm text-foreground-secondary">
                  Total Projects
                </dt>
                <dd className="text-heading-md text-foreground-primary mt-2">
                  {projectStats.total}
                </dd>
              </Card>
              <Card className="px-4 py-3">
                <dt className="text-label-sm text-foreground-secondary">
                  Active Projects
                </dt>
                <dd className="text-heading-md text-foreground-primary mt-2">
                  {projectStats.active}
                </dd>
              </Card>
              <Card className="px-4 py-3">
                <dt className="text-label-sm text-foreground-secondary">
                  Archived Projects
                </dt>
                <dd className="text-heading-md text-foreground-primary mt-2">
                  {projectStats.archived}
                </dd>
              </Card>
              <Card className="px-4 py-3">
                <dt className="text-label-sm text-foreground-secondary">
                  Saved Calculations
                </dt>
                <dd className="text-heading-md text-foreground-primary mt-2">
                  {projectStats.calculations}
                </dd>
              </Card>
              <Card className="px-4 py-3">
                <dt className="text-label-sm text-foreground-secondary">
                  Active SLAs
                </dt>
                <dd className="text-heading-md text-foreground-primary mt-2">
                  {projectStats.activeSlas}
                </dd>
              </Card>
            </div>
          )}
        </div>

        <div className="px-5 pt-2 border-b border-neutral-primary">
          <div className="xl:hidden pb-2">
            <Select
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TabType)}
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="projects">Projects</SelectItem>
                <SelectItem value="calculator">Calculator</SelectItem>
                <SelectItem value="sla">SLA Generator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="hidden xl:block">
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
          </div>
        </div>

        <div className="p-5">
          {isMounted("projects") && (
            <div
              className={activeTab === "projects" ? "block space-y-5" : "hidden space-y-5"}
            >
              {isProjectsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="md" />
                </div>
              ) : (
                <ProjectsTab projects={projectsData || []} />
              )}
            </div>
          )}
          {isMounted("calculator") && (
            <div
              className={activeTab === "calculator" ? "block space-y-5" : "hidden space-y-5"}
            >
              {isTeamMembersLoading ||
                isOperationalCostsLoading ||
                isCalculatorProjectsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="md" />
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
            <div className={activeTab === "sla" ? "block space-y-5" : "hidden space-y-5"}>
              {isSLAsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="md" />
                </div>
              ) : (
                <div>
                  <SLATab slas={slasData || []} hideTitle embedded />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { createClient } from "@/shared/api/supabase/server"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"
import { getEmployeeDetail } from "../../../../actions/employee-kpi-actions"
import { EmployeeProjectView } from "./EmployeeProjectView"
import { ProjectScoringClient } from "./ProjectScoringClient"

interface ProjectDetailPageProps {
  params: Promise<{
    id: string
    projectId: string
  }>
  searchParams: Promise<{
    back?: string
  }>
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  const { id: employeeId, projectId } = await params
  const { back } = await searchParams

  const result = await getEmployeeDetail(employeeId)

  if (!result.success || !result.data) {
    notFound()
  }

  // Find the specific assignment for this project
  // Note: The action returns projects as an array but we expect it joined
  // Using type coercion since the action's return type is complex
  type AssignmentItem = (typeof result.data.assignments)[number]
  const assignment = result.data.assignments.find((a: AssignmentItem) => {
    // Handle both array and object return types from Supabase
    const projects = a.projects
    if (Array.isArray(projects)) {
      return projects.some((p) => p.id === projectId)
    }
    return (projects as { id: string }).id === projectId
  })

  if (!assignment) {
    notFound()
  }

  // Determine which component to render based on user role
  // Employees view their own projects with EmployeeProjectView (read-only)
  // Admins/stakeholders use ProjectScoringClient (edit mode)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isEmployee = user?.id === employeeId
  const requestedBack =
    typeof back === "string" && back.startsWith("/performance") ? back : null
  const backHref =
    requestedBack ??
    (isEmployee ? "/performance" : `/performance/employee/${employeeId}`)

  // Route to appropriate component
  if (isEmployee) {
    return (
      <EmployeeProjectView
        backHref={backHref}
        assignment={
          assignment as unknown as Parameters<
            typeof EmployeeProjectView
          >[0]["assignment"]
        }
      />
    )
  } else {
    return (
      <ProjectScoringClient
        employee={result.data.employee}
        backHref={backHref}
        assignment={
          assignment as unknown as Parameters<
            typeof ProjectScoringClient
          >[0]["assignment"]
        }
      />
    )
  }
}

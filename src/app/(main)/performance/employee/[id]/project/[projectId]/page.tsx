import { createClient } from "@/shared/api/supabase/server"
import { notFound } from "next/navigation"
import { getEmployeeDetail } from "../../../../actions/employee-kpi-actions"
import { EmployeeProjectView } from "./EmployeeProjectView"
import { ProjectScoringClient } from "./ProjectScoringClient"

interface ProjectDetailPageProps {
  params: Promise<{
    id: string
    projectId: string
  }>
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id: employeeId, projectId } = await params

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

  // Route to appropriate component
  if (isEmployee) {
    return (
      <EmployeeProjectView
        employee={result.data.employee}
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
        assignment={
          assignment as unknown as Parameters<
            typeof ProjectScoringClient
          >[0]["assignment"]
        }
      />
    )
  }
}

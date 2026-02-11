"use server"

import { createClient } from "@/shared/api/supabase/server"
import { canManageByRole } from "@/shared/lib/roles"

type Employee = {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  job_title: string | null
  role: string | null
}

type EmployeeWithProjects = Employee & {
  project_count: number
  active_projects: number
}

// Type for project assignment with nested project status
type ProjectAssignmentWithStatus = {
  id: string
  projects: { id: string; status: string } | null
}

// Type for project assignment with SLA scores
type ProjectAssignmentWithScores = {
  id: string
  role_in_project: string
  weight_in_quarter: number | null
  projects: { id: string; name: string; quarter_id: string; status: string }
  project_sla_scores: Array<{
    score_achieved: number
    weight_percentage: number
  }>
}

// Type for project assignment with work quality scores
type ProjectAssignmentWithQuality = {
  id: string
  project_work_quality_scores: Array<{ is_achieved: boolean }>
}

// Type for overview row
type OverviewRow = {
  objective: string
  keyResult: string
  weighted: number
  target: number
  result: number | null
  projectId: string | null
  assignmentId: string | null
}

export async function getAllEmployees(searchQuery?: string) {
  const supabase = await createClient()

  // Validate caller is admin/stakeholder before returning employee list
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Unauthorized", data: [] }
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!canManageByRole(callerProfile?.role)) {
    return {
      success: false,
      error: "Access denied: Stakeholder role required",
      data: [],
    }
  }

  let query = supabase
    .from("profiles")
    .select(
      `
            id,
            full_name,
            email,
            avatar_url,
            job_title,
            role
        `,
    )
    .eq("role", "employee")
    .order("full_name", { ascending: true })

  // Apply search filter if provided
  if (searchQuery) {
    query = query.or(
      `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`,
    )
  }

  const { data: employees, error } = await query

  if (error) {
    console.error("Error fetching employees:", error)
    return { success: false, error: error.message, data: [] }
  }

  // Get project counts for each employee
  const employeesWithCounts = await Promise.all(
    (employees || []).map(async (employee: Employee) => {
      const { data: assignments } = await supabase
        .from("project_assignments")
        .select(
          `
                    id,
                    projects!inner (
                        id,
                        status
                    )
                `,
        )
        .eq("user_id", employee.id)

      const totalProjects = assignments?.length || 0
      const activeProjects =
        (assignments as ProjectAssignmentWithStatus[] | null)?.filter(
          (a) => a.projects?.status === "Active",
        ).length || 0

      return {
        ...employee,
        project_count: totalProjects,
        active_projects: activeProjects,
      } as EmployeeWithProjects
    }),
  )

  return { success: true, data: employeesWithCounts }
}

export async function getEmployeeDetail(userId: string, quarter?: string) {
  const supabase = await createClient()

  // Get employee info
  const { data: employee, error: employeeError } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, job_title, role")
    .eq("id", userId)
    .single()

  if (employeeError) {
    console.error("Error fetching employee:", employeeError)
    return { success: false, error: employeeError.message }
  }

  // Get employee's project assignments with scores
  let assignmentsQuery = supabase
    .from("project_assignments")
    .select(
      `
            id,
            role_in_project,
            weight_in_quarter,
            projects!inner (
                id,
                name,
                description,
                start_date,
                end_date,
                quarter_id,
                status
            ),
            project_sla_scores (
                score_achieved,
                weight_percentage
            ),
            project_work_quality_scores (
                is_achieved
            )
        `,
    )
    .eq("user_id", userId)

  // Filter by quarter if provided
  if (quarter && quarter !== "All") {
    assignmentsQuery = assignmentsQuery.eq("projects.quarter_id", quarter)
  }

  const { data: assignments, error: assignmentsError } = await assignmentsQuery

  if (assignmentsError) {
    console.error("Error fetching assignments:", assignmentsError)
    return { success: false, error: assignmentsError.message }
  }

  return {
    success: true,
    data: {
      employee,
      assignments: assignments || [],
    },
  }
}

export async function getEmployeeOverview(userId: string, quarter?: string) {
  const supabase = await createClient()

  // Define KPI config types
  type KpiWeights = {
    sla_project: number
    review_360: number
    work_quality: number
  }

  type KpiTargets = {
    sla_project: number
    review_360: number
    work_quality: number
  }

  // Fetch KPI configuration from database
  const { data: configs } = await supabase
    .from("kpi_configs")
    .select("config_key, config_value")
    .in("config_key", ["kpi_weights", "kpi_targets"])

  // Parse config or use fallback defaults
  const weightsConfig = configs?.find((c: { config_key: string; config_value: unknown }) => c.config_key === "kpi_weights")
    ?.config_value as KpiWeights | undefined
  const targetsConfig = configs?.find((c: { config_key: string; config_value: unknown }) => c.config_key === "kpi_targets")
    ?.config_value as KpiTargets | undefined

  const weights = weightsConfig || {
    sla_project: 40,
    review_360: 15,
    work_quality: 45,
  }
  const targets = targetsConfig || {
    sla_project: 90,
    review_360: 85,
    work_quality: 90,
  }

  // Initialize overview rows - ALWAYS return 3 rows
  const overview: OverviewRow[] = []

  // 1. Get SLA Score from projects
  let slaResult: number | null = null
  let projectQuery = supabase
    .from("project_assignments")
    .select(
      `
            id,
            role_in_project,
            weight_in_quarter,
            projects!inner (
                id,
                name,
                quarter_id,
                status
            ),
            project_sla_scores (
                score_achieved,
                weight_percentage
            )
        `,
    )
    .eq("user_id", userId)

  if (quarter && quarter !== "All") {
    projectQuery = projectQuery.eq("projects.quarter_id", quarter)
  }

  const { data: projectAssignments } = await projectQuery

  // Calculate weighted SLA percentage
  if (projectAssignments && projectAssignments.length > 0) {
    const typedAssignments =
      projectAssignments as unknown as ProjectAssignmentWithScores[]
    const slaScores = typedAssignments.flatMap(
      (a) => a.project_sla_scores || [],
    )
    if (slaScores.length > 0) {
      const realAchieve = slaScores.reduce(
        (sum, s) => sum + (s.score_achieved || 0),
        0,
      )
      const bestAchieve = slaScores.reduce(
        (sum, s) => sum + (s.weight_percentage || 0) * 120,
        0,
      )
      slaResult = bestAchieve > 0 ? (realAchieve / bestAchieve) * 100 : null
    }
  }

  // Always push SLA row with dynamic config
  overview.push({
    objective: "On Time SLA Project",
    keyResult: "On time SLA Project to stakeholder",
    weighted: weights.sla_project,
    target: targets.sla_project,
    result: slaResult !== null ? Math.round(slaResult) : null,
    projectId: null,
    assignmentId: null,
  })

  // 2. Get 360 Review Score
  let reviewResult: number | null = null
  let cycleId: string | null = null

  if (quarter && quarter !== "All") {
    const { data: cycles } = await supabase
      .from("review_cycles")
      .select("id")
      .eq("name", quarter)
      .limit(1)

    if (cycles && cycles.length > 0) {
      cycleId = cycles[0].id
    }
  }

  // Query performance summary if we have a valid cycle
  if (cycleId) {
    const { data: performanceSummary } = await supabase
      .from("performance_summaries")
      .select("overall_percentage")
      .eq("reviewee_id", userId)
      .eq("cycle_id", cycleId)
      .limit(1)

    if (performanceSummary && performanceSummary.length > 0) {
      reviewResult = performanceSummary[0].overall_percentage || null
    }
  }

  // Always push 360 Review row with dynamic config
  overview.push({
    objective: "360 Review",
    keyResult: "Relationship with stakeholders",
    weighted: weights.review_360,
    target: targets.review_360,
    result: reviewResult !== null ? Math.round(reviewResult) : null,
    projectId: null,
    assignmentId: null,
  })

  // 3. Get Work Quality Score from projects
  let qualityResult: number | null = null
  let qualityQuery = supabase
    .from("project_assignments")
    .select(
      `
            id,
            projects!inner (
                id,
                quarter_id
            ),
            project_work_quality_scores (
                is_achieved
            )
        `,
    )
    .eq("user_id", userId)

  if (quarter && quarter !== "All") {
    qualityQuery = qualityQuery.eq("projects.quarter_id", quarter)
  }

  const { data: qualityAssignments } = await qualityQuery

  // Calculate Work Quality percentage
  if (qualityAssignments && qualityAssignments.length > 0) {
    const typedQualityAssignments =
      qualityAssignments as unknown as ProjectAssignmentWithQuality[]
    const allQualityScores = typedQualityAssignments.flatMap(
      (a) => a.project_work_quality_scores || [],
    )
    if (allQualityScores.length > 0) {
      const achieved = allQualityScores.filter((q) => q.is_achieved).length
      const total = allQualityScores.length
      qualityResult = (achieved / total) * 100
    }
  }

  // Always push Work Quality row with dynamic config
  overview.push({
    objective: "Work Quality Competency",
    keyResult: "Quality Of Work",
    weighted: weights.work_quality,
    target: targets.work_quality,
    result: qualityResult !== null ? Math.round(qualityResult) : null,
    projectId: null,
    assignmentId: null,
  })

  return { success: true, data: overview }
}

// Type for overview stats (stakeholder view)
type OverviewStats = {
  totalEmployees: number
  avgPerformance: number
  pendingReviews: number
  activeProjects: number
  distribution: {
    outstanding: number
    aboveExpectation: number
    meetsExpectation: number
    belowExpectation: number
    needsImprovement: number
  }
}

export async function getOverviewStats(quarter?: string): Promise<{
  success: boolean
  data?: OverviewStats
  error?: string
}> {
  const supabase = await createClient()

  try {
    // Get total employees
    const { count: totalEmployees } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "employee")

    // Get active projects
    const { count: activeProjectsCount } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("status", "Active")

    // Get pending reviews for the quarter
    let pendingReviewsCount = 0
    if (quarter && quarter !== "All") {
      const { data: cycles } = await supabase
        .from("review_cycles")
        .select("id")
        .eq("name", quarter)
        .limit(1)

      if (cycles && cycles.length > 0) {
        const cycleId = cycles[0].id
        // Count employees without a complete review summary
        const { data: allEmployees } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "employee")

        const { data: summaries } = await supabase
          .from("performance_summaries")
          .select("reviewee_id")
          .eq("cycle_id", cycleId)

        const reviewedIds = new Set(summaries?.map((s: { reviewee_id: string }) => s.reviewee_id) || [])
        pendingReviewsCount = (allEmployees?.length || 0) - reviewedIds.size
      }
    }

    // Get performance distribution from summaries
    const distribution = {
      outstanding: 0,
      aboveExpectation: 0,
      meetsExpectation: 0,
      belowExpectation: 0,
      needsImprovement: 0,
    }

    let avgPerformance = 0
    let totalScores = 0
    let scoreSum = 0

    if (quarter && quarter !== "All") {
      const { data: cycles } = await supabase
        .from("review_cycles")
        .select("id")
        .eq("name", quarter)
        .limit(1)

      if (cycles && cycles.length > 0) {
        const cycleId = cycles[0].id
        const { data: summaries } = await supabase
          .from("performance_summaries")
          .select("overall_percentage")
          .eq("cycle_id", cycleId)

        if (summaries) {
          for (const summary of summaries) {
            const score = summary.overall_percentage || 0
            scoreSum += score
            totalScores++

            if (score >= 95) distribution.outstanding++
            else if (score >= 85) distribution.aboveExpectation++
            else if (score >= 75) distribution.meetsExpectation++
            else if (score >= 60) distribution.belowExpectation++
            else distribution.needsImprovement++
          }

          if (totalScores > 0) {
            avgPerformance = Math.round(scoreSum / totalScores)
          }
        }
      }
    }

    return {
      success: true,
      data: {
        totalEmployees: totalEmployees || 0,
        avgPerformance,
        pendingReviews: Math.max(0, pendingReviewsCount),
        activeProjects: activeProjectsCount || 0,
        distribution,
      },
    }
  } catch (error) {
    console.error("Error fetching overview stats:", error)
    return { success: false, error: "Failed to fetch overview stats" }
  }
}

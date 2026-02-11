"use client"

import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import { Avatar, Badge, Button, Card, EmptyState, Skeleton, Spinner, TextInput } from "@/shared/ui"
import { RiUserLine } from "@/shared/ui/lucide-icons"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useState } from "react"
import useSWR from "swr"
import {
  getAllEmployees,
  getEmployeeDetail,
} from "../../actions/employee-kpi-actions"

// Dynamic import for heavy component
const EmployeeDetailClient = dynamic(
  () =>
    import("../../employee/[id]/EmployeeDetailClient").then(
      (mod) => mod.EmployeeDetailClient,
    ),
  {
    loading: () => null,
  },
)

type Employee = {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  job_title: string | null
  role: string | null
}

type Assignment = {
  id: string
  role_in_project: string
  weight_in_quarter: number | null
  projects: {
    id: string
    name: string
    description: string | null
    start_date: string
    end_date: string
    quarter_id: string
    status: string
  }
  project_sla_scores: Array<{
    score_achieved: number
    weight_percentage: number
  }>
  project_work_quality_scores: Array<{
    is_achieved: boolean
  }>
}

export function KPITab({
  selectedQuarter,
}: {
  selectedQuarter?: string
}) {
  const { profile, loading: profileLoading } = useUserProfile()
  const [searchQuery, setSearchQuery] = useState("")
  const canManage = canManageByRole(profile?.role)

  // For employee view
  const {
    data: employeesResult,
    isLoading: employeesLoading,
  } = useSWR(
    canManage && profile ? ["employees", searchQuery] : null,
    () => getAllEmployees(searchQuery),
    { revalidateOnFocus: false },
  )

  const {
    data: employeeDetailResult,
    isLoading: employeeLoading,
  } = useSWR(
    !canManage && profile?.id
      ? ["employee-detail", profile.id, selectedQuarter]
      : null,
    () => getEmployeeDetail(profile!.id, selectedQuarter),
    { revalidateOnFocus: false },
  )

  const employees = employeesResult?.success
    ? employeesResult.data
    : []
  const employeeData: Employee | null =
    employeeDetailResult?.success && employeeDetailResult.data
      ? employeeDetailResult.data.employee
      : null
  const assignments: Assignment[] =
    employeeDetailResult?.success && employeeDetailResult.data
      ? (employeeDetailResult.data.assignments as unknown as Assignment[])
      : []
  const loading = canManage ? employeesLoading : employeeLoading

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  // Show loading state while checking user profile
  if (profileLoading || !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    )
  }

  // Employee view - show their own detail
  if (!canManage) {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner size="md" />
        </div>
      )
    }

    if (!employeeData) {
      return (
        <EmptyState
          icon={<RiUserLine />}
          title="No data available"
          description="Unable to load your performance data"
        />
      )
    }

    return (
      <EmployeeDetailClient
        employee={employeeData}
        initialAssignments={assignments}
        selectedQuarter={selectedQuarter}
      />
    )
  }

  // Admin/Stakeholder view - show employee list (original behavior)
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-foreground-primary text-heading-md">
          Employee KPI Management
        </h2>
        <p className="text-foreground-secondary text-body-sm mt-1">
          View and manage employee KPI scores across all projects
        </p>
      </div>

      {/* SEARCH */}
      <div>
        <TextInput
          type="search"
          placeholder="Search employees by name or email..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* EMPLOYEE LIST */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card
              key={i}
              className="border-neutral-primary bg-surface-neutral-primary space-y-3"
            >
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={<RiUserLine />}
          title={searchQuery ? "No employees found" : "No employees yet"}
          description={
            searchQuery
              ? "Try adjusting your search query"
              : "Employees will appear here once they are added to the system"
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => (
            <Link
              key={employee.id}
              href={`/performance/employee/${employee.id}`}
              className="group"
            >
              <Card>
                <div className="flex items-start gap-4">
                  <Avatar
                    src={employee.avatar_url || undefined}
                    alt={employee.full_name || "Employee"}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-foreground-primary group-hover:text-foreground-brand-primary truncate font-semibold">
                      {employee.full_name || "Unknown"}
                    </h3>
                    <p className="text-foreground-secondary text-body-sm truncate">
                      {employee.job_title || "No job title"}
                    </p>
                    <p className="text-foreground-tertiary text-body-xs truncate">
                      {employee.email}
                    </p>
                  </div>
                </div>

                <div className="text-body-sm mt-4 flex items-center gap-4">
                  <div>
                    <span className="text-foreground-secondary">
                      Projects:
                    </span>
                    <span className="text-foreground-primary ml-1 font-medium">
                      {employee.project_count}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground-secondary">
                      Active:
                    </span>
                    <Badge variant="success" className="ml-1">
                      {employee.active_projects}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4">
                  <Button variant="secondary" size="sm" className="w-full">
                    View KPI Details
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

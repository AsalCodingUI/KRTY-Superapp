"use client"

import { useUserProfile } from "@/shared/hooks/useUserProfile"
import {
  getAllEmployees,
  getEmployeeDetail,
} from "@/entities/performance/api/client"
import { canManageByRole } from "@/shared/lib/roles"
import { EmptyState } from "@/components/empty-state"
import { TableSection } from "@/components/table-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RiSearchLine, RiUserLine } from "@/shared/ui/lucide-icons"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useEffect, useState, type ChangeEvent } from "react"
import { useQuery } from "@tanstack/react-query"

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

type EmployeeWithProjects = Employee & {
  project_count: number
  active_projects: number
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
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = 25
  const canManage = canManageByRole(profile?.role)

  // For employee view
  const {
    data: employeesResult,
    isLoading: employeesLoading,
  } = useQuery({
    queryKey: ["employees", searchQuery, pageIndex, pageSize],
    queryFn: () => getAllEmployees(searchQuery, pageIndex, pageSize),
    enabled: !!(canManage && profile),
  })

  const {
    data: employeeDetailResult,
    isLoading: employeeLoading,
  } = useQuery({
    queryKey: ["employee-detail", profile?.id, selectedQuarter],
    queryFn: () => getEmployeeDetail(profile!.id, selectedQuarter),
    enabled: !!(!canManage && profile?.id),
  })

  const employees: EmployeeWithProjects[] = employeesResult?.success
    ? employeesResult.data
    : []
  const totalEmployees =
    employeesResult?.success && typeof employeesResult.total === "number"
      ? employeesResult.total
      : employees.length
  const totalPages = Math.max(1, Math.ceil(totalEmployees / pageSize))
  const employeeData: Employee | null =
    employeeDetailResult?.success && employeeDetailResult.data
      ? employeeDetailResult.data.employee
      : null
  const assignments: Assignment[] =
    employeeDetailResult?.success && employeeDetailResult.data
      ? (employeeDetailResult.data.assignments as unknown as Assignment[])
      : []
  const loading = canManage ? employeesLoading : employeeLoading

  useEffect(() => {
    setPageIndex(0)
  }, [searchQuery])

  // Show loading state while checking user profile
  if (profileLoading || !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-8" />
      </div>
    )
  }

  // Employee view - show their own detail
  if (!canManage) {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-8" />
        </div>
      )
    }

    if (!employeeData) {
      return (
        <EmptyState
          icon={<RiUserLine />}
          title="No data available"
          description="Could not load performance data."
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
    <div className="space-y-4">
      <div>
        <InputGroup className="h-7">
          <InputGroupAddon>
            <RiSearchLine aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Search employees by name or email..."
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
          />
        </InputGroup>
      </div>

      <TableSection
        title="Employee KPI Management"
      >
        <Table>
          <TableHeader>
            <TableRow className="h-[40px] hover:bg-transparent">
              <TableHead>Employee</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex items-center justify-center py-8">
                    <Spinner className="size-8" />
                  </div>
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={<RiUserLine className="size-5" />}
                    title={searchQuery ? "No employees found" : "No employees yet"}
                    description={
                      searchQuery
                        ? "Try a different keyword."
                        : "Employees will appear after they are added."
                    }
                    subtitle={searchQuery ? "No matching results." : "No employee data yet."}
                    placement="inner"
                  />
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <span className="font-medium text-foreground">
                      {employee.full_name || "Unknown"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{employee.email}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {employee.job_title || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground">{employee.project_count}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">{employee.active_projects}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/performance/employee/${employee.id}`}>
                      <Button variant="outline" size="sm">
                        View KPI Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3">
            <span className="text-body-sm text-muted-foreground">
              Page {pageIndex + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
                disabled={pageIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPageIndex((prev) =>
                    Math.min(totalPages - 1, prev + 1),
                  )
                }
                disabled={pageIndex >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </TableSection>
    </div>
  )
}

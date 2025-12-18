"use client"

import { Avatar } from "@/components/Avatar"
import { Badge } from "@/components/Badge"
import { Button } from "@/components/Button"
import { Card } from "@/components/Card"
import { EmptyState } from "@/components/EmptyState"
import { Input } from "@/components/Input"
import { Spinner } from "@/components/Spinner"
import { useUserProfile } from "@/hooks/useUserProfile"
import { RiSearchLine, RiUserLine } from "@remixicon/react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getAllEmployees, getEmployeeDetail } from "../../actions/employee-kpi-actions"

// Dynamic import for heavy component
const EmployeeDetailClient = dynamic(
    () => import("../../employee/[id]/EmployeeDetailClient").then((mod) => mod.EmployeeDetailClient),
    {
        loading: () => (
            <div className="flex items-center justify-center py-12">
                <Spinner size="md" />
            </div>
        ),
    }
)

type EmployeeWithProjects = {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
    job_title: string | null
    role: string | null
    project_count: number
    active_projects: number
}

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

export function KPITab() {
    const { profile, loading: profileLoading } = useUserProfile()
    const [employees, setEmployees] = useState<EmployeeWithProjects[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // For employee view
    const [employeeData, setEmployeeData] = useState<Employee | null>(null)
    const [assignments, setAssignments] = useState<Assignment[]>([])


    const loadEmployees = async (search?: string) => {
        setLoading(true)
        try {
            const result = await getAllEmployees(search)
            if (result.success) {
                setEmployees(result.data)
            } else {
                console.error("Error loading employees:", result.error)
            }
        } catch (error) {
            console.error("Error loading employees:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const loadOwnData = async () => {
            if (!profile?.id) return

            setLoading(true)
            try {
                const result = await getEmployeeDetail(profile.id)
                if (result.success && result.data) {
                    setEmployeeData(result.data.employee)
                    setAssignments(result.data.assignments as unknown as Assignment[])
                }
            } catch (error) {
                console.error("Error loading own data:", error)
            } finally {
                setLoading(false)
            }
        }

        if (!profile) return

        const userRole = (profile as any).role

        if (userRole === 'stakeholder') {
            loadEmployees()
        } else if (profile.id) {
            loadOwnData()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.id, (profile as any)?.role])

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        loadEmployees(query)
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
    if ((profile as any).role === 'employee') {
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

        return <EmployeeDetailClient employee={employeeData} initialAssignments={assignments} />
    }

    // Admin/Stakeholder view - show employee list (original behavior)
    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div>
                <h2 className="text-lg font-semibold text-content dark:text-content">
                    Employee KPI Management
                </h2>
                <p className="mt-1 text-sm text-content-subtle dark:text-content-placeholder">
                    View and manage employee KPI scores across all projects
                </p>
            </div>

            {/* SEARCH */}
            <div className="relative">
                <RiSearchLine className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-content-placeholder" />
                <Input
                    type="text"
                    placeholder="Search employees by name or email..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* EMPLOYEE LIST */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <div className="h-24 bg-border dark:bg-hover rounded" />
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
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-content dark:text-content truncate group-hover:text-primary dark:group-hover:text-primary">
                                            {employee.full_name || "Unknown"}
                                        </h3>
                                        <p className="text-sm text-content-subtle dark:text-content-placeholder truncate">
                                            {employee.job_title || "No job title"}
                                        </p>
                                        <p className="text-xs text-content-placeholder dark:text-content-subtle truncate">
                                            {employee.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-4 text-sm">
                                    <div>
                                        <span className="text-content-subtle dark:text-content-placeholder">Projects:</span>
                                        <span className="ml-1 font-medium text-content dark:text-content">
                                            {employee.project_count}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-content-subtle dark:text-content-placeholder">Active:</span>
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

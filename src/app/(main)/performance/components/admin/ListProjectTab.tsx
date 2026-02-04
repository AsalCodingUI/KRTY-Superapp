"use client"

import { Avatar, AvatarGroup, Badge } from "@/shared/ui"
import { Button } from "@/shared/ui"
import { EmptyState, QuarterFilter, QuarterFilterValue } from "@/shared/ui"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui"
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/shared/ui"
import { TableSection } from "@/shared/ui"
import type { Database } from '@/shared/types/database.types'
import { RiDeleteBin6Line, RiEdit2Line, RiFolderLine, RiTeamLine } from "@remixicon/react"
import { format } from "date-fns"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { deleteProject, getProjects, permanentDeleteProject } from "../../actions/project-actions"
import { ProjectAssignmentDialog } from "./ProjectAssignmentDialog"
import { ProjectForm } from "./ProjectForm"
import { QuarterBadge } from "./QuarterBadge"

type Project = Database["public"]["Tables"]["projects"]["Row"]
type ProjectStatus = Database["public"]["Enums"]["project_status_enum"]

interface ExtendedProject extends Project {
    project_assignments?: Array<{
        id: string
        role_in_project: string
        profiles: {
            id: string
            full_name: string | null
            avatar_url: string | null
        }
    }>
}

const getStatusColor = (status: ProjectStatus): string => {
    const colors: Record<ProjectStatus, string> = {
        Active: "bg-success/15 text-success",
        Completed: "bg-primary/15 text-primary",
        Archived: "bg-muted text-content-subtle",
    }
    return colors[status]
}

export function ListProjectTab() {
    const [selectedQuarter, setSelectedQuarter] = useState<QuarterFilterValue>("2025-All")
    const [selectedStatus, setSelectedStatus] = useState<string>("All")
    const [projects, setProjects] = useState<ExtendedProject[]>([])
    const [loading, setLoading] = useState(true)
    const [formOpen, setFormOpen] = useState(false)
    const [assignmentOpen, setAssignmentOpen] = useState(false)
    const [selectedProject, setSelectedProject] = useState<ExtendedProject | null>(null)

    useEffect(() => {
        const loadProjects = async () => {
            setLoading(true)
            try {
                const result = await getProjects(
                    selectedQuarter,
                    selectedStatus === "All" ? undefined : selectedStatus
                )
                if (result.success) {
                    setProjects(result.data as ExtendedProject[])
                }
            } catch (error) {
                console.error("Error loading projects:", error)
            } finally {
                setLoading(false)
            }
        }
        loadProjects()
    }, [selectedQuarter, selectedStatus])

    const loadProjects = async () => {
        setLoading(true)
        try {
            const result = await getProjects(
                selectedQuarter,
                selectedStatus === "All" ? undefined : selectedStatus
            )
            if (result.success) {
                setProjects(result.data as ExtendedProject[])
            }
        } catch (error) {
            console.error("Error loading projects:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (project: ExtendedProject) => {
        setSelectedProject(project)
        setFormOpen(true)
    }

    const handleAssign = (project: ExtendedProject) => {
        setSelectedProject(project)
        setAssignmentOpen(true)
    }

    const handleDelete = async (project: ExtendedProject) => {
        if (!confirm(`Are you sure you want to archive the project "${project.name}"?`)) return

        const result = await deleteProject(project.id)
        if (result.success) {
            loadProjects()
        } else {
            toast.error(`Error: ${result.error}`)
        }
    }

    const handlePermanentDelete = async (project: ExtendedProject) => {
        if (!confirm(`⚠️ PERMANENTLY DELETE "${project.name}"? This action cannot be undone!`)) return

        const result = await permanentDeleteProject(project.id)
        if (result.success) {
            toast.success("Project permanently deleted")
            loadProjects()
        } else {
            toast.error(`Error: ${result.error}`)
        }
    }

    const handleFormClose = () => {
        setFormOpen(false)
        setSelectedProject(null)
    }

    const handleAssignmentClose = () => {
        setAssignmentOpen(false)
        setSelectedProject(null)
    }

    const handleFormSuccess = () => {
        loadProjects()
    }

    return (
        <div className="space-y-6">
            {/* FILTERS */}
            <div className="flex items-center gap-3">
                <QuarterFilter value={selectedQuarter} onChange={setSelectedQuarter} />

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* PROJECT LIST */}
            <TableSection
                title="Project Configuration"
                description="Configure projects for KPI assessment. Projects assigned here will automatically appear in employee KPI dashboards."
                actions={
                    <Button onClick={() => setFormOpen(true)}>
                        <RiFolderLine className="mr-2 size-4" />
                        New Project
                    </Button>
                }
            >
                {loading ? (
                    <div className="p-8 text-center text-sm text-content-subtle">Loading projects...</div>
                ) : projects.length === 0 ? (
                    <EmptyState
                        icon={<RiFolderLine />}
                        title={
                            !selectedQuarter.includes("All") || selectedStatus !== "All"
                                ? `No projects found for ${!selectedQuarter.includes("All") ? selectedQuarter : ""} ${selectedStatus !== "All" ? selectedStatus : ""}`
                                : "No projects configured"
                        }
                        description={
                            !selectedQuarter.includes("All") || selectedStatus !== "All"
                                ? "Try adjusting your filters to see more projects."
                                : "Create your first project to start tracking employee KPIs based on real project deliveries."
                        }
                        action={{
                            label: "Create Project",
                            onClick: () => setFormOpen(true),
                        }}
                    />
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
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
                                const teamMembers = project.project_assignments?.map((a) => ({
                                    name: a.profiles.full_name || "Unknown",
                                    image: a.profiles.avatar_url || undefined,
                                })) || []

                                return (
                                    <TableRow key={project.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-content dark:text-content">
                                                    {project.name}
                                                </p>
                                                {project.description && (
                                                    <p className="mt-0.5 text-sm text-content-subtle line-clamp-1">
                                                        {project.description}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {project.quarter_id ? (
                                                <QuarterBadge quarter={project.quarter_id} />
                                            ) : (
                                                <span className="text-sm text-content-placeholder">No quarter</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge size="md" className={getStatusColor(project.status)}>
                                                {project.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <p className="text-content dark:text-content">
                                                    {format(new Date(project.start_date), "MMM d, yyyy")}
                                                </p>
                                                <p className="text-content-subtle">
                                                    to {format(new Date(project.end_date), "MMM d, yyyy")}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {teamMembers.length > 0 ? (
                                                <AvatarGroup>
                                                    {teamMembers.slice(0, 3).map((member, idx) => (
                                                        <Avatar
                                                            key={idx}
                                                            src={member.image || undefined}
                                                            alt={member.name}
                                                            size="sm"
                                                        />
                                                    ))}
                                                </AvatarGroup>
                                            ) : (
                                                <span className="text-sm text-content-placeholder">No assignments</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleAssign(project)}
                                                    title="Manage Team"
                                                >
                                                    <RiTeamLine className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(project)}
                                                    title="Edit Project"
                                                >
                                                    <RiEdit2Line className="size-4" />
                                                </Button>
                                                {/* Conditional delete button based on status */}
                                                {project.status === "Archived" ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handlePermanentDelete(project)}
                                                        title="Permanently Delete (Cannot be undone)"
                                                        className="text-danger hover:bg-danger/10"
                                                    >
                                                        <RiDeleteBin6Line className="size-4" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(project)}
                                                        title="Archive Project"
                                                        className="text-danger hover:bg-danger/10"
                                                    >
                                                        <RiDeleteBin6Line className="size-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                )}
            </TableSection>

            {/* Project Form Dialog */}
            <ProjectForm
                open={formOpen}
                onClose={handleFormClose}
                onSuccess={handleFormSuccess}
                project={selectedProject}
            />

            {/* Project Assignment Dialog */}
            <ProjectAssignmentDialog
                open={assignmentOpen}
                onClose={handleAssignmentClose}
                project={selectedProject}
                onSuccess={handleFormSuccess}
            />
        </div >
    )
}

"use client"

import type { Database } from "@/shared/types/database.types"
import {
  Avatar, AvatarGroup, AvatarOverflow, Badge, Button, EmptyState, QuarterFilterValue, Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow, TableSection
} from "@/shared/ui"
import {
  RiDeleteBin6Line,
  RiEdit2Line,
  RiFolderLine,
} from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { useState } from "react"
import { toast } from "sonner"
import useSWR from "swr"
import {
  deleteProject,
  getProjects,
  permanentDeleteProject,
} from "../../actions/project-actions"
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

export function ListProjectTab({
  selectedQuarter,
}: {
  selectedQuarter: QuarterFilterValue
}) {
  const [selectedStatus, setSelectedStatus] = useState<string>("All")
  const [formOpen, setFormOpen] = useState(false)
  const [selectedProject, setSelectedProject] =
    useState<ExtendedProject | null>(null)

  const { data: projectsResult, isLoading, mutate } = useSWR(
    ["projects", selectedQuarter, selectedStatus],
    () =>
      getProjects(
        selectedQuarter,
        selectedStatus === "All" ? undefined : selectedStatus,
      ),
    { revalidateOnFocus: false },
  )

  const projects: ExtendedProject[] = projectsResult?.success
    ? (projectsResult.data as ExtendedProject[])
    : []

  const handleEdit = (project: ExtendedProject) => {
    setSelectedProject(project)
    setFormOpen(true)
  }

  const handleDelete = async (project: ExtendedProject) => {
    if (
      !confirm(
        `Are you sure you want to archive the project "${project.name}"?`,
      )
    )
      return

    const result = await deleteProject(project.id)
    if (result.success) {
      mutate()
    } else {
      toast.error("Gagal arsip")
    }
  }

  const handlePermanentDelete = async (project: ExtendedProject) => {
    if (
      !confirm(
        `⚠️ PERMANENTLY DELETE "${project.name}"? This action cannot be undone!`,
      )
    )
      return

    const result = await permanentDeleteProject(project.id)
    if (result.success) {
      toast.success("Project dihapus")
      mutate()
    } else {
      toast.error("Gagal hapus")
    }
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedProject(null)
  }

  const handleFormSuccess = () => {
    mutate()
  }

  return (
    <div className="space-y-4">
      {/* FILTERS */}
      <div className="flex items-center gap-3">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]" size="sm">
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
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <RiFolderLine className="mr-2 size-4" />
            New Project
          </Button>
        }
      >
        {isLoading ? (
          <div className="text-body-sm text-foreground-secondary p-8 text-center">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<RiFolderLine className="size-5" />}
            title={
              !selectedQuarter.includes("All") || selectedStatus !== "All"
                ? `No projects found for ${!selectedQuarter.includes("All") ? selectedQuarter : ""} ${selectedStatus !== "All" ? selectedStatus : ""}`
                : "No projects configured"
            }
            description={
              !selectedQuarter.includes("All") || selectedStatus !== "All"
                ? "Try different filters."
                : "Create your first project to begin KPI tracking."
            }
            subtitle="Project data will appear here."
            placement="inner"
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
                <TableHeaderCell className="text-right">
                  Actions
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => {
                const teamMembers =
                  project.project_assignments?.map((a) => ({
                    name: a.profiles.full_name || "Unknown",
                    image: a.profiles.avatar_url || undefined,
                  })) || []

                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <span
                        className="text-foreground-primary font-medium"
                        title={
                          project.description
                            ? `${project.name} — ${project.description}`
                            : project.name
                        }
                      >
                        {project.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {project.quarter_id ? (
                        <QuarterBadge quarter={project.quarter_id} />
                      ) : (
                        <span className="text-foreground-disable">
                          No quarter
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const status = (project.status ??
                          "Active") as ProjectStatus
                        return (
                          <Badge variant={getStatusVariant(status)}>
                            {status}
                          </Badge>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground-primary">
                        {format(new Date(project.start_date), "MMM d, yyyy")} –{" "}
                        {format(new Date(project.end_date), "MMM d, yyyy")}
                      </span>
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
                              initials={member.name
                                .split(" ")
                                .map((segment) => segment[0])
                                .join("")
                                .slice(0, 2)}
                            />
                          ))}
                          {teamMembers.length > 3 && (
                            <AvatarOverflow count={teamMembers.length - 3} size="sm" />
                          )}
                        </AvatarGroup>
                      ) : (
                        <span className="text-foreground-disable">
                          No assignments
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="tertiary"
                          size="icon-sm"
                          onClick={() => handleEdit(project)}
                          title="Edit Project"
                        >
                          <RiEdit2Line className="size-3.5" />
                        </Button>
                        {/* Conditional delete button based on status */}
                        {project.status === "Archived" ? (
                          <Button
                            variant="tertiary"
                            size="icon-sm"
                            onClick={() => handlePermanentDelete(project)}
                            title="Permanently Delete (Cannot be undone)"
                            className="text-foreground-danger-dark hover:bg-surface-danger-light"
                          >
                            <RiDeleteBin6Line className="size-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="tertiary"
                            size="icon-sm"
                            onClick={() => handleDelete(project)}
                            title="Archive Project"
                            className="text-foreground-danger-dark hover:bg-surface-danger-light"
                          >
                            <RiDeleteBin6Line className="size-3.5" />
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

    </div>
  )
}

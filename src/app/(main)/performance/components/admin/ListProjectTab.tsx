"use client"

import type { Database } from "@/shared/types/database.types"
import { AvatarGroup, AvatarOverflow } from "@/components/avatar-group"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import type { QuarterFilterValue } from "@/components/quarter-filter"
import { TableSection } from "@/components/table-section"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  RiDeleteBin6Line,
  RiEdit2Line,
  RiFolderLine,
} from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { useState } from "react"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"
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
): "success" | "info" | "secondary" => {
  const variants: Record<ProjectStatus, "success" | "info" | "secondary"> = {
    Active: "success",
    Completed: "info",
    Archived: "secondary",
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
  const [confirmAction, setConfirmAction] = useState<{
    project: ExtendedProject
    type: "archive" | "delete"
  } | null>(null)

  const queryClient = useQueryClient()

  const { data: projectsResult, isLoading } = useQuery({
    queryKey: ["projects", selectedQuarter, selectedStatus],
    queryFn: () =>
      getProjects(
        selectedQuarter,
        selectedStatus === "All" ? undefined : selectedStatus,
      ),
  })

  const projects: ExtendedProject[] = projectsResult?.success
    ? (projectsResult.data as ExtendedProject[])
    : []

  const handleEdit = (project: ExtendedProject) => {
    setSelectedProject(project)
    setFormOpen(true)
  }

  const handleDelete = (project: ExtendedProject) => {
    setConfirmAction({ project, type: "archive" })
  }

  const handlePermanentDelete = (project: ExtendedProject) => {
    setConfirmAction({ project, type: "delete" })
  }

  const executeConfirmAction = async () => {
    if (!confirmAction) return

    if (confirmAction.type === "archive") {
      const result = await deleteProject(confirmAction.project.id)
      if (result.success) {
        toast.success("Project archived")
        queryClient.invalidateQueries({ queryKey: ["projects", selectedQuarter, selectedStatus] })
      } else {
        toast.error("Gagal arsip")
      }
    } else {
      const result = await permanentDeleteProject(confirmAction.project.id)
      if (result.success) {
        toast.success("Project dihapus")
        queryClient.invalidateQueries({ queryKey: ["projects", selectedQuarter, selectedStatus] })
      } else {
        toast.error("Gagal hapus")
      }
    }
    setConfirmAction(null)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedProject(null)
  }

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["projects", selectedQuarter, selectedStatus] })
  }

  return (
    <div className="space-y-4">
      {/* FILTERS */}
      <div className="flex items-center gap-3">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[180px]" size="sm">
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
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <RiFolderLine data-icon="inline-start" />
            New Project
          </Button>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="size-8" />
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
            <TableHeader>
              <TableRow className="h-[40px] hover:bg-transparent">
                <TableHead>Project Name</TableHead>
                <TableHead>Quarter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
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
                        className="text-foreground font-medium"
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
                        <span className="text-muted-foreground/50">
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
                      <span className="text-foreground">
                        {format(new Date(project.start_date), "MMM d, yyyy")} –{" "}
                        {format(new Date(project.end_date), "MMM d, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {teamMembers.length > 0 ? (
                        <AvatarGroup>
                          {teamMembers.slice(0, 3).map((member, idx) => (
                            <Avatar key={idx} className="size-7">
                              <AvatarImage
                                src={member.image || undefined}
                                alt={member.name}
                              />
                              <AvatarFallback className="text-xs">
                                {member.name
                                  .split(" ")
                                  .map((segment) => segment[0])
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
                        <span className="text-muted-foreground/50">
                          No assignments
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(project)}
                          title="Edit Project"
                        >
                          <RiEdit2Line className="size-3.5" />
                        </Button>
                        {/* Conditional delete button based on status */}
                        {project.status === "Archived" ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handlePermanentDelete(project)}
                            title="Permanently Delete (Cannot be undone)"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <RiDeleteBin6Line className="size-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(project)}
                            title="Archive Project"
                            className="text-destructive hover:bg-destructive/10"
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

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        onConfirm={executeConfirmAction}
        title={
          confirmAction?.type === "delete"
            ? `Permanently Delete "${confirmAction.project.name}"?`
            : `Archive "${confirmAction?.project.name}"?`
        }
        description={
          confirmAction?.type === "delete"
            ? "This project will be permanently deleted. This action cannot be undone."
            : "This project will be archived. You can restore it later."
        }
        confirmText={confirmAction?.type === "delete" ? "Delete" : "Archive"}
        variant="destructive"
      />
    </div>
  )
}

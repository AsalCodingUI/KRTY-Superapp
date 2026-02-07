"use client"

import { Avatar, Button } from "@/shared/ui"
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui"
import { Label } from "@/shared/ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui"
import { type Database } from "@/shared/types/database.types"
import { RiDeleteBin6Line, RiUserAddLine } from "@/shared/ui/lucide-icons"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  assignUserToProject,
  getAllUsers,
  getProjectAssignments,
  removeUserFromProject,
} from "../../actions/project-actions"

type ProjectRole = Database["public"]["Enums"]["project_role_enum"]
type User = {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  job_title: string | null
}

type Assignment = {
  id: string
  role_in_project: string
  weight_in_quarter: number | null
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
    job_title: string | null
  }
}

type Project = Database["public"]["Tables"]["projects"]["Row"]

interface ProjectAssignmentDialogProps {
  open: boolean
  onClose: () => void
  project: Project | null
  onSuccess: () => void
}

type ProjectRoleExtended = ProjectRole | "Webflow Developer" // Extended to support Webflow Developer

export function ProjectAssignmentDialog({
  open,
  onClose,
  project,
  onSuccess,
}: ProjectAssignmentDialogProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (!project) return

      setLoading(true)
      try {
        const [assignmentsResult, usersResult] = await Promise.all([
          getProjectAssignments(project.id),
          getAllUsers(),
        ])

        if (assignmentsResult.success) {
          setAssignments(assignmentsResult.data as Assignment[])
        }

        if (usersResult.success) {
          setUsers(usersResult.data as User[])
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (open && project) {
      loadData()
    }
  }, [open, project])

  const loadData = async () => {
    if (!project) return

    setLoading(true)
    try {
      const [assignmentsResult, usersResult] = await Promise.all([
        getProjectAssignments(project.id),
        getAllUsers(),
      ])

      if (assignmentsResult.success) {
        setAssignments(assignmentsResult.data as Assignment[])
      }

      if (usersResult.success) {
        setUsers(usersResult.data as User[])
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAssignment = async () => {
    if (!selectedUserId || !project) return

    // Get selected user to auto-assign role
    const selectedUser = users.find((u) => u.id === selectedUserId)
    if (!selectedUser) return

    // Auto-map role based on user job_title (same logic as ProjectForm)
    const roleMapping: Record<string, ProjectRoleExtended> = {
      "UIX Designer": "UIX Designer",
      "Brand Designer": "Brand Designer",
      "Web Developer": "Webflow Developer",
      "Webflow Developer": "Webflow Developer",
      "Project Manager": "Project Manager",
      Admin: "Admin",
    }

    const autoRole = roleMapping[selectedUser.job_title || ""] || "UIX Designer"

    setLoading(true)
    try {
      const result = await assignUserToProject(
        project.id,
        selectedUserId,
        autoRole as ProjectRole, // Cast to ProjectRole for API compatibility
      )

      if (result.success) {
        loadData()
        setSelectedUserId("")
        onSuccess()
      } else {
        toast.error("Gagal menambah")
      }
    } catch (error) {
      console.error("Error adding assignment:", error)
      toast.error("Gagal menambah")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return

    setLoading(true)
    try {
      const result = await removeUserFromProject(assignmentId)

      if (result.success) {
        loadData()
        onSuccess()
      } else {
        toast.error("Gagal menghapus")
      }
    } catch (error) {
      console.error("Error removing assignment:", error)
      toast.error("Gagal menghapus")
    } finally {
      setLoading(false)
    }
  }

  // Filter out already assigned users
  const assignedUserIds = new Set(assignments.map((a) => a.profiles.id))
  const availableUsers = users.filter((u) => !assignedUserIds.has(u.id))

  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>Manage Team - {project.name}</DialogTitle>
          <DialogCloseButton />
        </DialogHeader>

        <DialogBody className="flex-1 space-y-6 overflow-y-auto">
          {/* Add New Assignment Section */}
          <div className="border-border bg-muted dark:bg-surface/50 space-y-4 rounded-lg border p-4">
            <h4 className="text-label-md text-content dark:text-content">
              Add New Assignment
            </h4>

            <div className="grid grid-cols-[1fr,auto] items-end gap-3">
              <div className="space-y-2">
                <Label htmlFor="user">Select User</Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={availableUsers.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        availableUsers.length === 0
                          ? "All users assigned"
                          : "Choose a team member"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}{" "}
                        {user.job_title ? `(${user.job_title})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddAssignment}
                disabled={!selectedUserId || loading}
                variant="secondary"
              >
                <RiUserAddLine className="mr-2 size-4" />
                Add to Team
              </Button>
            </div>
          </div>

          {/* Current Assignments */}
          <div className="space-y-3">
            <h4 className="text-label-md text-content dark:text-content">
              Current Team ({assignments.length})
            </h4>

            {assignments.length === 0 ? (
              <div className="border-input dark:border-border-subtle rounded-lg border border-dashed p-8 text-center">
                <p className="text-body-sm text-content-subtle dark:text-content-placeholder">
                  No team members assigned yet. Add your first team member
                  above.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="border-border bg-surface flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={assignment.profiles.avatar_url || undefined}
                        alt={assignment.profiles.full_name || "User"}
                      />
                      <div>
                        <p className="text-content dark:text-content font-medium">
                          {assignment.profiles.full_name || "Unknown User"}
                        </p>
                        <p className="text-body-sm text-content-subtle dark:text-content-placeholder">
                          {assignment.profiles.job_title || "No job title"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-label-md text-content dark:text-content">
                          {assignment.role_in_project}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        disabled={loading}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <RiDeleteBin6Line className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

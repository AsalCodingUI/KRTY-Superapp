"use client"

import { getQuarterFromDate } from "@/entities/performance/lib/kpiUtils"
import { type Database } from "@/shared/types/database.types"
import {
  Avatar, Button, Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label, Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, Textarea, TextInput
} from "@/shared/ui"
import { RiDeleteBin6Line, RiUserAddLine } from "@/shared/ui/lucide-icons"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  assignUserToProject,
  createProject,
  getAllUsers,
  updateProject,
} from "../../actions/project-actions"
import { QuarterBadge } from "./QuarterBadge"

type Project = Database["public"]["Tables"]["projects"]["Row"]
type ProjectRole = Database["public"]["Enums"]["project_role_enum"]

type User = {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  job_title: string | null
  role: string | null
}

type TeamMember = {
  userId: string
  role: ProjectRole
  userName: string
  userEmail: string
  userAvatar: string | null
  userJobTitle: string | null
}

interface ProjectFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  project?: Project | null
}

export function ProjectForm({
  open,
  onClose,
  onSuccess,
  project,
}: ProjectFormProps) {
  const [loading, setLoading] = useState(false)
  const [endDate, setEndDate] = useState(project?.end_date || "")
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")

  const isEdit = !!project
  const previewQuarter = endDate ? getQuarterFromDate(endDate) : null

  // Load users for assignment
  useEffect(() => {
    if (open && !isEdit) {
      loadUsers()
    }
  }, [open, isEdit])

  const loadUsers = async () => {
    try {
      const result = await getAllUsers()
      if (result.success) {
        setUsers(result.data as User[])
      }
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  const handleAddTeamMember = () => {
    if (!selectedUserId) return

    const user = users.find((u) => u.id === selectedUserId)
    if (!user) return

    // Check if user already added
    if (teamMembers.some((tm) => tm.userId === selectedUserId)) {
      toast.error("Member sudah ada")
      return
    }

    // Map user profile role to project role
    const roleMapping: Record<string, ProjectRole> = {
      stakeholder: "Project Manager",
      employee: user.job_title?.includes("Designer")
        ? "UIX Designer"
        : "Webflow Developer",
    }

    const projectRole = roleMapping[user.role || "employee"] || "UIX Designer"

    setTeamMembers([
      ...teamMembers,
      {
        userId: user.id,
        role: projectRole,
        userName: user.full_name || "Unknown",
        userEmail: user.email,
        userAvatar: user.avatar_url,
        userJobTitle: user.job_title,
      },
    ])
    setSelectedUserId("")
  }

  const handleRemoveTeamMember = (userId: string) => {
    setTeamMembers(teamMembers.filter((tm) => tm.userId !== userId))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = isEdit
        ? await updateProject(project.id, formData)
        : await createProject(formData)

      if (result.success) {
        // If creating new project and has team members, assign them
        if (!isEdit && teamMembers.length > 0 && result.data) {
          await Promise.all(
            teamMembers.map((member) =>
              assignUserToProject(result.data.id, member.userId, member.role),
            ),
          )
        }

        onSuccess()
        onClose()
        // Reset form
        setTeamMembers([])
        setEndDate("")
      } else {
        toast.error("Gagal simpan")
      }
    } catch (error) {
      console.error("Error submitting project:", error)
      toast.error("Gagal simpan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Project" : "Create New Project"}
            </DialogTitle>
            <DialogCloseButton />
          </DialogHeader>

          <DialogBody className="space-y-4">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <TextInput
                id="name"
                name="name"
                placeholder="e.g., Website Redesign Q1"
                defaultValue={project?.name || ""}
                required
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <TextInput
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={project?.start_date || ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date *</Label>
                <TextInput
                  id="end_date"
                  name="end_date"
                  type="date"
                  defaultValue={project?.end_date || ""}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Auto Quarter Preview */}
            {previewQuarter && (
              <div className="bg-primary/10 dark:bg-primary/10 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-label-md text-primary dark:text-primary">
                    Auto Quarter Assignment:
                  </span>
                  <QuarterBadge quarter={previewQuarter} />
                </div>
                <p className="text-body-xs text-primary/80 dark:text-primary/80 mt-1">
                  This project will be assigned to {previewQuarter} based on the
                  end date.
                </p>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Project goals, deliverables, etc..."
                rows={3}
                defaultValue={project?.description || ""}
              />
            </div>

            {/* Status (Edit Only) */}
            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  name="status"
                  defaultValue={(project.status ?? "Active") as string}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Team Assignment (Create Only) */}
            {!isEdit && (
              <div className="space-y-4">
                {/* Section Header */}
                <div className="border-border border-t pt-4">
                  <h4 className="text-label-md text-content dark:text-content">
                    Assign Team Members (Optional)
                  </h4>
                  <p className="text-body-sm text-content-subtle dark:text-content-placeholder mt-1">
                    Add team members who will work on this project
                  </p>
                </div>

                <div className="grid grid-cols-[1fr,auto] items-end gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="assign-user">Select User</Label>
                    <Select
                      value={selectedUserId}
                      onValueChange={setSelectedUserId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter(
                            (u) =>
                              !teamMembers.some((tm) => tm.userId === u.id),
                          )
                          .map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name || user.email}{" "}
                              {user.job_title ? `(${user.job_title})` : ""}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddTeamMember}
                    disabled={!selectedUserId}
                    variant="secondary"
                  >
                    <RiUserAddLine className="mr-2 size-4" />
                    Add to Team
                  </Button>
                </div>

                {/* Team Members List */}
                {teamMembers.length > 0 && (
                  <div className="space-y-2">
                    <Label>Team Members ({teamMembers.length})</Label>
                    {teamMembers.map((member) => (
                      <div
                        key={member.userId}
                        className="border-border bg-surface flex items-center justify-between rounded-lg border p-2"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={member.userAvatar || undefined}
                            alt={member.userName}
                            size="sm"
                          />
                          <div>
                            <p className="text-label-md text-content dark:text-content">
                              {member.userName}
                            </p>
                            <p className="text-body-xs text-content-subtle dark:text-content-placeholder">
                              {member.role}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTeamMember(member.userId)}
                          className="text-foreground-danger hover:bg-surface-danger-light"
                        >
                          <RiDeleteBin6Line className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : isEdit
                  ? "Update Project"
                  : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

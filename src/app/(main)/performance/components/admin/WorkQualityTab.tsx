"use client"

import { Constants, type Database } from "@/shared/types/database.types"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { TableSection } from "@/components/table-section"
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
import { RiDeleteBin6Line, RiEdit2Line, RiStarLine } from "@/shared/ui/lucide-icons"
import { useState } from "react"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  deleteCompetency,
  getCompetencies,
} from "../../actions/competency-actions"
import { CompetencyForm } from "./CompetencyForm"

type Competency = Database["public"]["Tables"]["competency_library"]["Row"]

const availableRoles = Constants.public.Enums.project_role_enum.filter(
  (role) => role !== "Admin",
)

const getRoleBadgeVariant = (
  role: string,
): "info" | "success" | "warning" | "secondary" => {
  const variants: Record<string, "info" | "success" | "warning" | "secondary"> = {
    "UIX Designer": "info",
    "Brand Designer": "warning",
    "Webflow Developer": "success",
    "Web Developer": "success",
    "Project Manager": "secondary",
  }
  return variants[role] || "secondary"
}

export function WorkQualityTab() {
  const [selectedRole, setSelectedRole] = useState<string>("All")
  const [formOpen, setFormOpen] = useState(false)
  const [selectedCompetency, setSelectedCompetency] =
    useState<Competency | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string
    name: string
  } | null>(null)

  const queryClient = useQueryClient()

  const { data: competencyResult, isLoading } = useQuery({
    queryKey: ["competencies", selectedRole],
    queryFn: () =>
      getCompetencies(selectedRole === "All" ? undefined : selectedRole),
  })

  const competencies: Competency[] = competencyResult?.success
    ? competencyResult.data
    : []

  const handleDelete = (id: string, name: string) => {
    setConfirmDelete({ id, name })
  }

  const executeDelete = async () => {
    if (!confirmDelete) return

    const result = await deleteCompetency(confirmDelete.id)
    if (result.success) {
      toast.success("Competency deleted")
      queryClient.invalidateQueries({ queryKey: ["competencies", selectedRole] })
    } else {
      toast.error("Gagal hapus")
    }
    setConfirmDelete(null)
  }

  const handleEdit = (competency: Competency) => {
    setSelectedCompetency(competency)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setSelectedCompetency(null)
  }

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["competencies", selectedRole] })
  }

  return (
    <div className="space-y-4">
      {/* FILTER */}
      <div className="flex items-center gap-3">
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-full sm:w-[220px]" size="sm">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Roles</SelectItem>
            {availableRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* COMPETENCY LIBRARY TABLE */}
      <TableSection
        title="Work Quality Competency Library"
        actions={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <RiStarLine data-icon="inline-start" />
            Add Competency
          </Button>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="size-8" />
          </div>
        ) : competencies.length === 0 ? (
          <EmptyState
            icon={<RiStarLine className="size-5" />}
            title={
              selectedRole !== "All"
                ? `No competencies for ${selectedRole}`
                : "No competencies defined"
            }
            description={
              selectedRole !== "All"
                ? "Try another role or add competencies."
                : "Add competencies to start quality scoring."
            }
            subtitle="Competency data will appear here."
            placement="inner"
            action={{
              label: "Add First Competency",
              onClick: () => setFormOpen(true),
            }}
          />
        ) : (
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="h-[40px] hover:bg-transparent">
                <TableHead className="w-[180px]">Role</TableHead>
                <TableHead className="w-[260px]">Competency Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[120px] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competencies.map((competency) => (
                <TableRow key={competency.id}>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(competency.role)}>
                      {competency.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-foreground block font-medium whitespace-normal break-words line-clamp-2"
                      title={competency.name}
                    >
                      {competency.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-muted-foreground block whitespace-normal break-words"
                      title={competency.description || "-"}
                    >
                      {competency.description || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(competency)}
                        title="Edit Competency"
                      >
                        <RiEdit2Line className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          handleDelete(competency.id, competency.name)
                        }
                        title="Delete Competency"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <RiDeleteBin6Line className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableSection>

      {/* INFO BOX */}
      <div className="bg-primary/10 rounded-lg p-4">
        <h4 className="text-label-md text-primary">
          How Work Quality Assessment Works
        </h4>
        <p className="text-label-md text-primary/80 mt-2">
          Competencies defined here will automatically appear as checklists when
          admins grade employee projects. The competencies shown are filtered by
          the employee&apos;s role in the project.
        </p>
        <p className="text-body-sm text-primary/80 mt-2">
          <strong>Example:</strong> If an employee is assigned as &quot;UIX
          Designer&quot; on a project, only competencies for &quot;UIX
          Designer&quot; role will appear in their Work Quality checklist.
        </p>
      </div>

      {/* Competency Form Dialog */}
      <CompetencyForm
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        competency={selectedCompetency}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        onConfirm={executeDelete}
        title={`Delete "${confirmDelete?.name}"?`}
        description="This competency will be permanently deleted. This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  )
}

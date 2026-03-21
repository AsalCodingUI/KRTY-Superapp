"use client"

import { Constants, type Database } from "@/shared/types/database.types"
import {
  Badge, Button, EmptyState, Spinner,
  Select,
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
): "info" | "success" | "warning" | "zinc" => {
  const variants: Record<string, "info" | "success" | "warning" | "zinc"> = {
    "UIX Designer": "info",
    "Brand Designer": "warning",
    "Webflow Developer": "success",
    "Web Developer": "success",
    "Project Manager": "zinc",
  }
  return variants[role] || "zinc"
}

export function WorkQualityTab() {
  const [selectedRole, setSelectedRole] = useState<string>("All")
  const [formOpen, setFormOpen] = useState(false)
  const [selectedCompetency, setSelectedCompetency] =
    useState<Competency | null>(null)

  const queryClient = useQueryClient()

  const { data: competencyResult, isLoading } = useQuery({
    queryKey: ["competencies", selectedRole],
    queryFn: () =>
      getCompetencies(selectedRole === "All" ? undefined : selectedRole),
  })

  const competencies: Competency[] = competencyResult?.success
    ? competencyResult.data
    : []

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the competency "${name}"?`))
      return

    const result = await deleteCompetency(id)
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["competencies", selectedRole] })
    } else {
      toast.error("Gagal hapus")
    }
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
          <Button size="sm" onClick={() => setFormOpen(true)} leadingIcon={<RiStarLine />}>
            Add Competency
          </Button>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="md" />
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
            <TableHead>
              <TableRow className="h-[40px] hover:bg-transparent">
                <TableHeaderCell className="w-[180px]">Role</TableHeaderCell>
                <TableHeaderCell className="w-[260px]">Competency Name</TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell className="w-[120px] text-right">
                  Actions
                </TableHeaderCell>
              </TableRow>
            </TableHead>
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
                      className="text-foreground-primary block font-medium whitespace-normal break-words line-clamp-2"
                      title={competency.name}
                    >
                      {competency.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-foreground-secondary block whitespace-normal break-words"
                      title={competency.description || "-"}
                    >
                      {competency.description || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="tertiary"
                        size="icon-sm"
                        onClick={() => handleEdit(competency)}
                        title="Edit Competency"
                      >
                        <RiEdit2Line className="size-3.5" />
                      </Button>
                      <Button
                        variant="tertiary"
                        size="icon-sm"
                        onClick={() =>
                          handleDelete(competency.id, competency.name)
                        }
                        title="Delete Competency"
                        className="text-foreground-danger-dark hover:bg-surface-danger-light"
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
        <h4 className="text-label-md text-foreground-brand-primary">
          How Work Quality Assessment Works
        </h4>
        <p className="text-label-md text-foreground-brand-primary/80 mt-2">
          Competencies defined here will automatically appear as checklists when
          admins grade employee projects. The competencies shown are filtered by
          the employee&apos;s role in the project.
        </p>
        <p className="text-body-sm text-foreground-brand-primary/80 mt-2">
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
    </div>
  )
}

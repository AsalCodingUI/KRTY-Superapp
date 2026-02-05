"use client"

import { Badge } from "@/shared/ui"
import { Button } from "@/shared/ui"
import {
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/shared/ui"
import { TableSection } from "@/shared/ui"
import { Constants, type Database } from "@/shared/types/database.types"
import { RiDeleteBin6Line, RiEdit2Line, RiStarLine } from "@/shared/ui/lucide-icons"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  deleteCompetency,
  getCompetencies,
} from "../../actions/competency-actions"
import { CompetencyForm } from "./CompetencyForm"

type Competency = Database["public"]["Tables"]["competency_library"]["Row"]

const availableRoles = Constants.public.Enums.project_role_enum.filter(
  (role) => role !== "Admin",
)

const getRoleBadgeColor = (role: string): string => {
  // Using chart tokens for visual consistency
  const colors: Record<string, string> = {
    "UIX Designer": "bg-chart-1/15 text-chart-1",
    "Brand Designer": "bg-chart-4/15 text-chart-4",
    "Webflow Developer": "bg-chart-2/15 text-chart-2",
    "Web Developer": "bg-chart-2/15 text-chart-2",
    "Project Manager": "bg-chart-5/15 text-chart-5",
  }
  return colors[role] || "bg-muted text-content-subtle"
}

export function WorkQualityTab() {
  const [selectedRole, setSelectedRole] = useState<string>("All")
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedCompetency, setSelectedCompetency] =
    useState<Competency | null>(null)

  useEffect(() => {
    const loadCompetencies = async () => {
      setLoading(true)
      try {
        const result = await getCompetencies(
          selectedRole === "All" ? undefined : selectedRole,
        )
        if (result.success) {
          setCompetencies(result.data)
        }
      } catch (error) {
        console.error("Error loading competencies:", error)
      } finally {
        setLoading(false)
      }
    }
    loadCompetencies()
  }, [selectedRole])

  const loadCompetencies = async () => {
    setLoading(true)
    try {
      const result = await getCompetencies(
        selectedRole === "All" ? undefined : selectedRole,
      )
      if (result.success) {
        setCompetencies(result.data)
      }
    } catch (error) {
      console.error("Error loading competencies:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the competency "${name}"?`))
      return

    const result = await deleteCompetency(id)
    if (result.success) {
      loadCompetencies()
    } else {
      toast.error(`Error: ${result.error}`)
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
    loadCompetencies()
  }

  return (
    <div className="space-y-6">
      {/* FILTER */}
      <div className="flex items-center gap-3">
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[220px]">
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
        description="Master data for competencies used in KPI Work Quality assessment. Assign competencies to specific roles."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <RiStarLine className="mr-2 size-4" />
            Add Competency
          </Button>
        }
      >
        {loading ? (
          <div className="text-body-sm text-content-subtle p-8 text-center">
            Loading competencies...
          </div>
        ) : competencies.length === 0 ? (
          <EmptyState
            icon={<RiStarLine />}
            title={
              selectedRole !== "All"
                ? `No competencies for ${selectedRole}`
                : "No competencies defined"
            }
            description={
              selectedRole !== "All"
                ? "Try selecting a different role or add competencies for this role."
                : "Add competencies for different roles to enable Work Quality assessment in KPI grading."
            }
            action={{
              label: "Add First Competency",
              onClick: () => setFormOpen(true),
            }}
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Competency Name</TableHeaderCell>
                <TableHeaderCell>Description</TableHeaderCell>
                <TableHeaderCell className="text-right">
                  Actions
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {competencies.map((competency) => (
                <TableRow key={competency.id}>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(competency.role)}>
                      {competency.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-foreground-primary font-medium"
                      title={competency.name}
                    >
                      {competency.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-foreground-secondary block truncate"
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
    </div>
  )
}

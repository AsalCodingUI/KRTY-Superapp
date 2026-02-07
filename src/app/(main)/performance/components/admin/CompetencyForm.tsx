"use client"

import { Constants, Database } from "@/shared/types/database.types"
import {
  Button, Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle, Label, Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, Textarea
} from "@/shared/ui"
import { useState } from "react"
import { toast } from "sonner"
import {
  createCompetency,
  updateCompetency,
} from "../../actions/competency-actions"

const availableRoles = Constants.public.Enums.project_role_enum.filter(
  (role) => role !== "Admin",
)

type Competency = Database["public"]["Tables"]["competency_library"]["Row"]

interface CompetencyFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  competency?: Competency | null
}

export function CompetencyForm({
  open,
  onClose,
  onSuccess,
  competency,
}: CompetencyFormProps) {
  const [loading, setLoading] = useState(false)
  const isEdit = !!competency

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const result = isEdit
        ? await updateCompetency(competency.id, formData)
        : await createCompetency(formData)

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        toast.error("Gagal simpan")
      }
    } catch (error) {
      console.error("Error submitting competency:", error)
      toast.error("Gagal simpan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Edit Competency" : "Add New Competency"}
            </DialogTitle>
            <DialogCloseButton />
          </DialogHeader>

          <DialogBody className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                name="role"
                defaultValue={competency?.role || availableRoles[0]}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Competency Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Competency Name *</Label>
              <TextInput
                id="name"
                name="name"
                placeholder="e.g., Consistency, Clean Code, Design Quality"
                defaultValue={competency?.name || ""}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe what this competency measures..."
                rows={3}
                defaultValue={competency?.description || ""}
              />
            </div>
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
              {loading ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { Button, Label, TextInput } from "@/shared/ui"
import { RiAddLine, RiDeleteBinLine } from "@/shared/ui/lucide-icons"
import { FreelanceMember } from "../types"
import { formatNumber } from "../utils"

interface FreelanceSectionProps {
  freelanceSquad: FreelanceMember[]
  onAddFreelanceMember: () => void
  onRemoveFreelanceMember: (id: string) => void
  onUpdateFreelanceMember: (
    id: string,
    field: keyof FreelanceMember,
    value: string | number,
  ) => void
}

export function FreelanceSection({
  freelanceSquad,
  onAddFreelanceMember,
  onRemoveFreelanceMember,
  onUpdateFreelanceMember,
}: FreelanceSectionProps) {
  return (
    <div>
      <h3 className="text-label-md text-foreground-primary mb-4">
        Freelance / COGS (Optional)
      </h3>

      <div className="mb-4">
        <Button
          variant="secondary"
          className="w-full"
          onClick={onAddFreelanceMember}
        >
          <RiAddLine className="mr-2 size-4" /> Add Freelance
        </Button>
      </div>

      <div className="space-y-4">
        {freelanceSquad.map((member) => (
          <div
            key={member.id}
            className="border-neutral-primary bg-surface rounded-lg border p-4"
          >
            <div className="mb-1 flex items-start justify-between gap-4">
              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor={`freelance-name-${member.id}`}>
                    Full Name
                  </Label>
                  <TextInput
                    id={`freelance-name-${member.id}`}
                    value={member.name}
                    onChange={(e) =>
                      onUpdateFreelanceMember(member.id, "name", e.target.value)
                    }
                    placeholder="e.g. Jane Doe"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`freelance-role-${member.id}`}>Role</Label>
                  <TextInput
                    id={`freelance-role-${member.id}`}
                    value={member.role}
                    onChange={(e) =>
                      onUpdateFreelanceMember(member.id, "role", e.target.value)
                    }
                    placeholder="e.g. UI Designer"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`freelance-fee-${member.id}`}>
                    Total Fee (IDR)
                  </Label>
                  <TextInput
                    id={`freelance-fee-${member.id}`}
                    type="text"
                    value={member.totalFee}
                    onChange={(e) =>
                      onUpdateFreelanceMember(
                        member.id,
                        "totalFee",
                        formatNumber(e.target.value),
                      )
                    }
                    placeholder="e.g. 15,000,000"
                    className="mt-1"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Label htmlFor={`freelance-notes-${member.id}`}>
                    Notes (optional)
                  </Label>
                  <TextInput
                    id={`freelance-notes-${member.id}`}
                    value={member.notes}
                    onChange={(e) =>
                      onUpdateFreelanceMember(
                        member.id,
                        "notes",
                        e.target.value,
                      )
                    }
                    placeholder="e.g. scoped for illustration"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="xs"
                className="text-foreground-tertiary size-6 p-0"
                onClick={() => onRemoveFreelanceMember(member.id)}
              >
                <RiDeleteBinLine className="size-4" />
              </Button>
            </div>
          </div>
        ))}

        {freelanceSquad.length === 0 && (
          <div className="rounded-md border border-dashed p-6 text-center">
            <p className="text-body-sm text-foreground-secondary">
              No freelance costs added.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

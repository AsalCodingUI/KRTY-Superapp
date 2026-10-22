import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
      <h3 className="text-foreground mb-4 text-sm font-medium">
        Freelance / COGS (Optional)
      </h3>

      <div className="mb-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={onAddFreelanceMember}
        >
          <RiAddLine className="mr-2 size-4" /> Add Freelance
        </Button>
      </div>

      <div className="space-y-4">
        {freelanceSquad.map((member) => (
          <div key={member.id} className="bg-foreground/[0.03] rounded-lg p-4">
            <div className="mb-1 flex items-start justify-between gap-4">
              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor={`freelance-name-${member.id}`}>
                    Full Name
                  </Label>
                  <Input
                    id={`freelance-name-${member.id}`}
                    value={member.name}
                    onChange={(e) =>
                      onUpdateFreelanceMember(member.id, "name", e.target.value)
                    }
                    placeholder="e.g. Jane Doe"
                    className="mt-1 h-7"
                  />
                </div>
                <div>
                  <Label htmlFor={`freelance-role-${member.id}`}>Role</Label>
                  <Input
                    id={`freelance-role-${member.id}`}
                    value={member.role}
                    onChange={(e) =>
                      onUpdateFreelanceMember(member.id, "role", e.target.value)
                    }
                    placeholder="e.g. UI Designer"
                    className="mt-1 h-7"
                  />
                </div>
                <div>
                  <Label htmlFor={`freelance-fee-${member.id}`}>
                    Total Fee (IDR)
                  </Label>
                  <Input
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
                    className="mt-1 h-7"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Label htmlFor={`freelance-notes-${member.id}`}>
                    Notes (optional)
                  </Label>
                  <Input
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
                    className="mt-1 h-7"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-tertiary-foreground size-6 p-0"
                onClick={() => onRemoveFreelanceMember(member.id)}
              >
                <RiDeleteBinLine className="size-4" />
              </Button>
            </div>
          </div>
        ))}

        {freelanceSquad.length === 0 && (
          <div className="rounded-md border border-dashed p-6 text-center">
            <p className="text-muted-foreground text-sm">
              No freelance costs added.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

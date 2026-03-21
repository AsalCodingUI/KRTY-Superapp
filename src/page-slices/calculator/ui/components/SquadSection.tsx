import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
} from "@/shared/ui"
import { RiAddLine, RiDeleteBinLine } from "@/shared/ui/lucide-icons"
import { SquadMember, TeamMember } from "../types"

interface SquadSectionProps {
  teamMembers: TeamMember[]
  squad: SquadMember[]
  selectedMemberToAdd: string
  onSelectedMemberChange: (val: string) => void
  onAddSquadMember: (profileId: string) => void
  onRemoveSquadMember: (id: string) => void
  onUpdateAllocation: (id: string, value: number[]) => void
}

export function SquadSection({
  teamMembers,
  squad,
  selectedMemberToAdd,
  onSelectedMemberChange,
  onAddSquadMember,
  onRemoveSquadMember,
  onUpdateAllocation,
}: SquadSectionProps) {
  return (
    <div>
      <h3 className="text-label-md text-foreground-primary mb-4">
        Squad Allocation
      </h3>

      <div className="block">
        <div className="mb-4 flex gap-3">
          <Select
            onValueChange={onSelectedMemberChange}
            value={selectedMemberToAdd}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Team Member..." />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              onAddSquadMember(selectedMemberToAdd)
              onSelectedMemberChange("")
            }}
          >
            <RiAddLine className="mr-2 size-4" /> Add
          </Button>
        </div>

        <div className="space-y-4">
          {squad.map((member) => {
            const profile = teamMembers.find((p) => p.id === member.profileId)
            return (
              <div
                key={member.id}
                className="border-neutral-primary bg-surface rounded-lg border p-4"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-label-md text-foreground-primary">
                      {profile?.full_name}
                    </p>
                    <p className="text-label-xs text-foreground-secondary">
                      {profile?.job_title}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-foreground-tertiary size-6 p-0"
                    onClick={() => onRemoveSquadMember(member.id)}
                  >
                    <RiDeleteBinLine className="size-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-label-xs text-foreground-secondary w-16">
                    Allocation
                  </span>
                  <Slider
                    value={[member.allocation]}
                    max={100}
                    step={5}
                    onValueChange={(val) => onUpdateAllocation(member.id, val)}
                    className="flex-1"
                  />
                  <span className="text-label-sm text-foreground-primary w-10 text-right">
                    {member.allocation}%
                  </span>
                </div>
              </div>
            )
          })}

          {squad.length === 0 && (
            <div className="rounded-md border border-dashed p-6 text-center">
              <p className="text-body-sm text-foreground-secondary">
                No team members allocated yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

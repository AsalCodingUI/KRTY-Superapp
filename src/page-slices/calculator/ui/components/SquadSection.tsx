import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useT } from "@/shared/i18n/client"
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
  const t = useT("calculator")
  const tc = useT("common")
  return (
    <div>
      <h3 className="text-foreground mb-4 text-sm font-medium">
        {t("squadAllocation")}
      </h3>

      <div className="block">
        <div className="mb-4 flex gap-3">
          <Select
            onValueChange={(v) => v !== null && onSelectedMemberChange(v)}
            value={selectedMemberToAdd}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("selectTeamMember")} />
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
            <RiAddLine className="mr-2 size-4" /> {tc("add")}
          </Button>
        </div>

        <div className="space-y-4">
          {squad.map((member) => {
            const profile = teamMembers.find((p) => p.id === member.profileId)
            return (
              <div
                key={member.id}
                className="bg-foreground/[0.03] rounded-lg p-4"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-foreground text-sm font-medium">
                      {profile?.full_name}
                    </p>
                    <p className="text-muted-foreground text-xs font-medium">
                      {profile?.job_title}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-tertiary-foreground size-6 p-0"
                    onClick={() => onRemoveSquadMember(member.id)}
                  >
                    <RiDeleteBinLine className="size-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground w-16 text-xs font-medium">
                    {t("allocation")}
                  </span>
                  <Slider
                    value={[member.allocation]}
                    max={100}
                    step={5}
                    onValueChange={(val) =>
                      onUpdateAllocation(
                        member.id,
                        Array.isArray(val) ? [...val] : [val as number],
                      )
                    }
                    className="flex-1"
                  />
                  <span className="text-foreground w-10 text-right text-sm font-medium">
                    {member.allocation}%
                  </span>
                </div>
              </div>
            )
          })}

          {squad.length === 0 && (
            <div className="rounded-md border border-dashed p-6 text-center">
              <p className="text-muted-foreground text-sm">
                {t("noTeamMembersAllocated")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

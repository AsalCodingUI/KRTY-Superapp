"use client"

import { EmptyValue } from "@/components/empty-value"
import { UserRoundX } from "@/components/icons"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useT } from "@/shared/i18n/client"
import { assigneesOf, cleanAssigneeIds } from "./assignees"
import { AssigneeStack } from "./AssigneeStack"
import type { TeamMember } from "./data"

const NONE = "__none__"

/**
 * A task's assignees as a ghost property field: the shared Select in
 * `multiple` mode (stays open, each pick toggles a person). "Unassigned"
 * is checked when nobody is, and picking it clears the list. Every change
 * calls `onChange` with the new ids (written as `assignee_ids`).
 */
export function AssigneeSelect({
  team,
  value,
  onChange,
  name = "first",
  className,
  align = "start",
}: {
  team: TeamMember[]
  value: string[]
  onChange: (ids: string[]) => void
  name?: "full" | "first"
  className?: string
  align?: "start" | "end"
}) {
  const t = useT("projects")
  const people = assigneesOf({ assignee_ids: value }, team)
  return (
    <Select<string, true>
      multiple
      value={value.length ? value : [NONE]}
      onValueChange={(next) => {
        const picked = next ?? []
        // "Unassigned" just picked: clear. Otherwise it drops out.
        const ids =
          picked.includes(NONE) && value.length
            ? []
            : cleanAssigneeIds(picked.filter((v) => v !== NONE))
        if (ids.join() !== value.join()) onChange(ids)
      }}
    >
      <SelectTrigger
        size="sm"
        variant="ghost"
        className={className}
        aria-label={t("colAssignees")}
      >
        <SelectValue>
          {() =>
            people.length ? (
              <AssigneeStack people={people} name={name} />
            ) : (
              <EmptyValue />
            )
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent align={align}>
        <SelectItem value={NONE}>
          {/* An avatar-sized slot, so the label lines up with the names. */}
          <span className="grid size-5 shrink-0 place-items-center">
            <UserRoundX className="text-muted-foreground size-4" />
          </span>
          {t("noAssignee")}
        </SelectItem>
        {team.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            <AssigneeStack people={[m]} name="full" />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

"use client"

import { EmptyState } from "@/components/empty-state"
import {
  GroupedList,
  ListChip,
  ListGroup,
  ListRow,
} from "@/components/grouped-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { canManageByRole } from "@/shared/lib/roles"
import type { Database } from "@/shared/types/database.types"
import { RiGroupLine } from "@/shared/ui/lucide-icons"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

/** Job titles in the order the studio thinks about them. */
const TITLE_ORDER = ["Project Manager", "Designer", "Web Developer", "Admin"]

function initials(name: string | null) {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

/** Team directory as a list grouped by job title. */
export function TeamList({ members }: { members: Profile[] }) {
  if (members.length === 0) {
    return (
      <EmptyState
        title="Tidak ada anggota"
        description="Coba kata kunci lain."
        icon={<RiGroupLine className="size-5" />}
        placement="inner"
      />
    )
  }

  const groups = new Map<string, Profile[]>()
  for (const m of members) {
    const key = m.job_title || "Lainnya"
    groups.set(key, [...(groups.get(key) ?? []), m])
  }
  const rank = (title: string) => {
    const i = TITLE_ORDER.indexOf(title)
    return i === -1 ? TITLE_ORDER.length : i
  }

  return (
    <GroupedList>
      {[...groups.entries()]
        .sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]))
        .map(([title, people]) => (
          <ListGroup key={title} label={title} count={people.length}>
            {people.map((p) => (
              <ListRow key={p.id}>
                <Avatar className="size-5">
                  <AvatarImage
                    src={p.avatar_url || undefined}
                    alt={p.full_name ?? ""}
                  />
                  <AvatarFallback className="text-[10px]">
                    {initials(p.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate font-medium">
                    {p.full_name || "Unknown"}
                  </span>
                  {p.email && (
                    <a
                      href={`mailto:${p.email}`}
                      className="text-muted-foreground hover:text-foreground truncate"
                    >
                      {p.email}
                    </a>
                  )}
                </div>
                {canManageByRole(p.role) && <ListChip>Stakeholder</ListChip>}
              </ListRow>
            ))}
          </ListGroup>
        ))}
    </GroupedList>
  )
}

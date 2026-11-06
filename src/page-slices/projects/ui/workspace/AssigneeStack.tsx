"use client"

import { AvatarGroup } from "@/components/avatar-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { initials } from "./task-utils"

type Person = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

/** Avatars shown before the rest go into "+N". */
const MAX_AVATARS = 3

/**
 * A task's assignees: one shows avatar + name; several show an
 * overlapping stack (AvatarGroup) + the first one's first name + "+N".
 * Nothing when there's nobody (callers show their own empty state).
 * Avatars are 20px (`xs`) beside 12–13px text.
 */
export function AssigneeStack({
  people,
  name = "first",
  className,
  textClassName,
}: {
  people: readonly Person[]
  /** One person's label: full or first name (several: always the first
   *  name, then "+N"); "none" shows the avatars only. */
  name?: "full" | "first" | "none"
  className?: string
  textClassName?: string
}) {
  if (!people.length) return null
  const [first, ...rest] = people
  // Several people: always the first one's first name, so "+N" fits.
  const shownName =
    name === "none"
      ? null
      : name === "full" && !rest.length
        ? first.full_name
        : (first.full_name?.trim().split(/\s+/)[0] ?? null)
  // Avatars only: "+N" for those past the stack; else everyone after the first.
  const more =
    name === "none" ? Math.max(0, people.length - MAX_AVATARS) : rest.length
  const title = people
    .map((p) => p.full_name)
    .filter(Boolean)
    .join(", ")

  return (
    <span
      className={cn("flex min-w-0 items-center gap-1.5", className)}
      title={title || undefined}
    >
      {people.length === 1 ? (
        <PersonAvatar person={first} />
      ) : (
        <AvatarGroup className="shrink-0">
          {people.slice(0, MAX_AVATARS).map((p) => (
            <PersonAvatar key={p.id} person={p} />
          ))}
        </AvatarGroup>
      )}
      {(shownName || more > 0) && (
        <span className={cn("flex min-w-0 gap-1", textClassName)}>
          {shownName && <span className="truncate">{shownName}</span>}
          {more > 0 && <span className="shrink-0 tabular-nums">+{more}</span>}
        </span>
      )}
    </span>
  )
}

function PersonAvatar({ person }: { person: Person }) {
  return (
    <Avatar size="xs">
      <AvatarImage src={person.avatar_url || undefined} alt="" />
      <AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-medium">
        {initials(person.full_name, "U")}
      </AvatarFallback>
    </Avatar>
  )
}

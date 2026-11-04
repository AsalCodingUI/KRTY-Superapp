"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { SantuyPerson } from "../data"

export function PersonAvatar({
  person,
  className,
  fallbackClassName,
}: {
  person?: SantuyPerson | null
  className?: string
  fallbackClassName?: string
}) {
  const name = person?.full_name || "?"
  return (
    <Avatar className={cn("size-7", className)}>
      <AvatarImage src={person?.avatar_url || undefined} alt="" />
      <AvatarFallback className={cn("text-micro", fallbackClassName)}>
        {name.slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

/** "Rizki Fadhilah Muhammad Habibi" stays whole; lists truncate it. */
export const personName = (person?: SantuyPerson | null) =>
  person?.full_name || "—"

/** Short zone label for the time ("WIB"). */
export function zoneLabel(timezone: string) {
  if (timezone === "Asia/Makassar") return "WITA"
  if (timezone === "Asia/Jayapura") return "WIT"
  if (timezone === "Asia/Jakarta" || timezone === "Asia/Pontianak") return "WIB"
  return timezone
}

/** "16:00" + 60 → "17:00". */
export function endTime(start: string, durationMin: number) {
  const [h, m] = start.split(":").map(Number)
  const total = (h * 60 + m + durationMin) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

/** A "yyyy-MM-dd" day as a local Date (for date-fns formatting only). */
export const dayDate = (date: string) => new Date(`${date}T00:00:00`)

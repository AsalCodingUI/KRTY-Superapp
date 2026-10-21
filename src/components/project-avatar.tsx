import { cn } from "@/lib/utils"

/** Solid project tiles, picked from the id so a project keeps its colour. */
const PROJECT_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-amber-500",
  "bg-sky-500",
]

export function projectColor(id: string) {
  // FNV-1a: UUIDs differ mostly at the end, which a *31 hash barely spreads.
  let hash = 2166136261
  for (const ch of id) {
    hash ^= ch.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return PROJECT_COLORS[(hash >>> 0) % PROJECT_COLORS.length]
}

export function ProjectAvatar({
  id,
  name,
  className,
}: {
  id: string
  name: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-[5px] text-[10px] font-semibold text-white",
        projectColor(id),
        className,
      )}
    >
      {name.trim().charAt(0).toUpperCase() || "P"}
    </span>
  )
}

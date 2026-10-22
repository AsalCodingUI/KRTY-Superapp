import { cn } from "@/lib/utils"

/**
 * Solid project tiles (step 9 of each oklch.fyi scale), picked from the id so
 * a project keeps its colour. Bright hues carry dark text to stay legible.
 */
const PROJECT_COLORS = [
  "bg-blue-9 text-white",
  "bg-green-9 text-white",
  "bg-purple-9 text-white",
  "bg-orange-9 text-white",
  "bg-pink-9 text-white",
  "bg-teal-9 text-white",
  "bg-amber-9 text-black/80",
  "bg-cyan-9 text-white",
  "bg-indigo-9 text-white",
  "bg-tomato-9 text-white",
  "bg-mint-9 text-white",
  "bg-lime-9 text-black/80",
  "bg-red-9 text-white",
  "bg-yellow-9 text-black/80",
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
        "flex size-5 shrink-0 items-center justify-center rounded-[5px] text-[10px] font-semibold",
        projectColor(id),
        className,
      )}
    >
      {name.trim().charAt(0).toUpperCase() || "P"}
    </span>
  )
}

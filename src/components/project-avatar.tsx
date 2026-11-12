import { cn } from "@/lib/utils"

/**
 * Solid project tiles (step 9 of each oklch.fyi scale), picked from the id so
 * a project keeps its colour. Letters are always white.
 */
const PROJECT_COLORS = [
  "bg-blue-9 text-white",
  "bg-green-9 text-white",
  "bg-purple-9 text-white",
  "bg-orange-9 text-white",
  "bg-pink-9 text-white",
  "bg-teal-9 text-white",
  "bg-amber-9 text-white",
  "bg-cyan-9 text-white",
  "bg-indigo-9 text-white",
  "bg-tomato-9 text-white",
  "bg-mint-9 text-white",
  "bg-lime-9 text-white",
  "bg-red-9 text-white",
  "bg-yellow-9 text-white",
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

/** The project's colour as a CSS variable (e.g. "var(--blue-9)"), for tints
 *  that should match its avatar, like a timeline bar. */
export function projectColorVar(id: string) {
  const bg = projectColor(id).split(" ")[0] // "bg-blue-9"
  return `var(--${bg.slice(3)})`
}

/** First letter or digit, so "[QA] Milxa" shows "Q". Not a \p{L} regex:
 *  the server build matched "[" with it (hydration mismatch). */
function initial(name: string) {
  for (const ch of name) {
    if (/[0-9]/.test(ch) || ch.toLowerCase() !== ch.toUpperCase()) {
      return ch.toUpperCase()
    }
  }
  return "P"
}

/** A touch brighter and more saturated than the scale's step 9, so the
 *  tiles pop a little. Inline, so it wins over the class; a browser without
 *  relative colours drops it and keeps step 9. */
const vivid = (color: string) =>
  `oklch(from ${color} calc(l + 0.03) min(calc(c * 1.18), 0.32) h)`

/** The initial follows the tile's size class (size-5 → 9px, size-6 →
 *  10px, size-7/8 → 11px, size-9/10 → 12px, bigger → 14px), so call sites
 *  only pass a size, never a text size. */
const INITIAL_SIZE =
  "text-[9px] [&.size-6]:text-[10px] [&.size-7]:text-micro [&.size-8]:text-micro [&.size-9]:text-xs [&.size-10]:text-xs [&.size-11]:text-sm [&.size-12]:text-sm [&.size-14]:text-base [&.size-16]:text-base"

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
      style={{ backgroundColor: vivid(projectColorVar(id)) }}
      className={cn(
        "rounded-tile flex size-5 shrink-0 items-center justify-center font-medium",
        INITIAL_SIZE,
        projectColor(id),
        className,
      )}
    >
      {initial(name)}
    </span>
  )
}

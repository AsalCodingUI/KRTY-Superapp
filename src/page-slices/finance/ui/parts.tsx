"use client"

import { cn } from "@/lib/utils"
import { Cell, Pie, PieChart } from "recharts"

/** A ring with a value in the middle (category split, share collected). */
export { StatTiles } from "@/components/stat-tiles"

export function Donut({
  data,
  label,
  sublabel,
  size = 160,
}: {
  data: { key: string; value: number; color: string }[]
  label: React.ReactNode
  sublabel?: React.ReactNode
  size?: number
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const slices =
    total > 0
      ? data.filter((d) => d.value > 0)
      : [{ key: "empty", value: 1, color: "var(--muted)" }]
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={slices}
          dataKey="value"
          nameKey="key"
          innerRadius={size / 2 - 16}
          outerRadius={size / 2}
          paddingAngle={slices.length > 1 ? 2 : 0}
          cornerRadius={3}
          stroke="none"
          isAnimationActive={false}
        >
          {slices.map((d) => (
            <Cell key={d.key} fill={d.color} />
          ))}
        </Pie>
      </PieChart>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-heading text-base font-medium tabular-nums">
          {label}
        </span>
        {sublabel && (
          <span className="text-muted-foreground text-xs">{sublabel}</span>
        )}
      </div>
    </div>
  )
}

/** Small letter tile coloured from the name (logo stand-in). */
export function NameTile({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  let hash = 2166136261
  for (const ch of name) {
    hash ^= ch.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  const colors = [
    "bg-blue-9 text-white",
    "bg-teal-9 text-white",
    "bg-purple-9 text-white",
    "bg-orange-9 text-white",
    "bg-pink-9 text-white",
    "bg-green-9 text-white",
    "bg-indigo-9 text-white",
    "bg-tomato-9 text-white",
    "bg-cyan-9 text-white",
    "bg-amber-9 text-white",
  ]
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold",
        colors[(hash >>> 0) % colors.length],
        className,
      )}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  )
}

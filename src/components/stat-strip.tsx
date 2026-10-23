import { RollingValue } from "@/components/rolling-value"
import { cn } from "@/lib/utils"

/**
 * Full-bleed band of headline numbers under a page's title or tabs (Tim,
 * Cuti & Kehadiran): label over value, no cards, a hairline below.
 */
export function StatStrip({
  items,
  className,
}: {
  items: { key: string; label: React.ReactNode; value: React.ReactNode }[]
  className?: string
}) {
  return (
    <div
      className={cn(
        "stat-strip bleed gutter-x border-border border-b py-4",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.key} className="stat-tile">
          <p className="text-muted-foreground text-sm">{item.label}</p>
          <p className="text-foreground text-xl font-normal tracking-tight tabular-nums">
            {typeof item.value === "string" ||
            typeof item.value === "number" ? (
              <RollingValue>{item.value}</RollingValue>
            ) : (
              item.value
            )}
          </p>
        </div>
      ))}
    </div>
  )
}

import { orEmpty as emptyMark } from "@/components/empty-value"
import { RollingValue } from "@/components/rolling-value"
import { cn } from "@/lib/utils"

export type StatStripItem = {
  /** Defaults to the item's index. */
  key?: string
  label: React.ReactNode
  value: React.ReactNode
}

/**
 * Full-bleed band of headline numbers under a page's title or tabs (Tim,
 * Cuti & Kehadiran): label over value, no cards, a hairline below.
 */
export function StatStrip({
  items,
  aside,
  orEmpty = false,
  className,
}: {
  items: StatStripItem[]
  /** Right-aligned controls, e.g. locking the period or the main action. */
  aside?: React.ReactNode
  /** A missing value (null, "", a dash) shows the dashed empty mark. */
  orEmpty?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "stat-strip bleed gutter-x border-border border-b py-4",
        className,
      )}
    >
      {items.map((item, i) => (
        <div key={item.key ?? i} className="stat-tile">
          <p className="text-muted-foreground text-sm">{item.label}</p>
          {/* A div, so a Skeleton can stand in for the value. */}
          <div className="text-heading text-stat font-normal tabular-nums">
            {orEmpty ? (
              <RollingValue
                value={
                  typeof item.value === "number" ||
                  typeof item.value === "string"
                    ? item.value
                    : null
                }
              >
                {emptyMark(item.value)}
              </RollingValue>
            ) : typeof item.value === "string" ||
              typeof item.value === "number" ? (
              <RollingValue>{item.value}</RollingValue>
            ) : (
              item.value
            )}
          </div>
        </div>
      ))}
      {aside && (
        <div className="ml-auto flex items-center gap-2 self-center">
          {aside}
        </div>
      )}
    </div>
  )
}

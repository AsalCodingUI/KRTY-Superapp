import { surfaceClassName } from "@/components/panel"
import { cn } from "@/lib/utils"

/**
 * Headline numbers in the 360-review strip style (label over a large value),
 * each on the same card surface as HomeCard.
 */
export function StatTiles({
  items,
  variant = "tiles",
}: {
  /** "strip": one card split into cells (DesignerHQ), instead of one each. */
  variant?: "tiles" | "strip"
  items: {
    key: string
    label: React.ReactNode
    value: React.ReactNode
    hint?: React.ReactNode
  }[]
}) {
  if (variant === "strip")
    return (
      <dl
        className={cn(
          surfaceClassName,
          "grid divide-y overflow-hidden sm:divide-x sm:divide-y-0",
          items.length === 2 && "sm:grid-cols-2",
          items.length === 3 && "sm:grid-cols-3",
          items.length >= 4 && "sm:grid-cols-2 lg:grid-cols-4",
        )}
      >
        {items.map((item) => (
          <div
            key={item.key}
            className="flex min-w-0 flex-col gap-1.5 px-5 py-4"
          >
            <dt className="text-muted-foreground truncate text-sm">
              {item.label}
            </dt>
            <dd className="flex min-w-0 items-baseline gap-2">
              <span className="text-heading truncate text-xl font-normal tracking-tight tabular-nums">
                {item.value}
              </span>
              {item.hint && (
                <span className="text-muted-foreground truncate text-[13px]">
                  {item.hint}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    )

  return (
    <dl
      className={cn(
        "grid gap-3 sm:grid-cols-2",
        items.length === 3 && "lg:grid-cols-3",
        items.length >= 4 && "lg:grid-cols-4",
      )}
    >
      {items.map((item) => (
        <div
          key={item.key}
          className={cn(
            surfaceClassName,
            "flex min-w-0 flex-col gap-1.5 px-5 py-4",
          )}
        >
          <dt className="text-muted-foreground truncate text-sm">
            {item.label}
          </dt>
          <dd className="text-heading truncate text-xl font-normal tracking-tight tabular-nums">
            {item.value}
          </dd>
          {item.hint && (
            <dd className="text-muted-foreground truncate text-[13px]">
              {item.hint}
            </dd>
          )}
        </div>
      ))}
    </dl>
  )
}

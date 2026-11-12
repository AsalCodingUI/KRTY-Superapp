import { cn } from "@/lib/utils"

/**
 * A quiet heading with an optional count.
 * - `section` (default): a section inside a page.
 * - `group`: a group heading inside a list (smaller, muted, tight).
 */
export function SectionTitle({
  children,
  extra,
  actions,
  variant = "section",
  className,
}: {
  children: React.ReactNode
  extra?: React.ReactNode
  actions?: React.ReactNode
  variant?: "section" | "group"
  className?: string
}) {
  const group = variant === "group"
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        group ? "pt-3 pb-1" : "pt-6 pb-3",
        className,
      )}
    >
      <div className="flex items-baseline gap-2">
        <h2
          className={
            group ? "text-muted-foreground text-meta" : "text-foreground text-sm"
          }
        >
          {children}
        </h2>
        {extra != null && (
          <span className="text-tertiary-foreground text-meta tabular-nums">
            {extra}
          </span>
        )}
      </div>
      {actions}
    </div>
  )
}

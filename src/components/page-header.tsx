import { cn } from "@/lib/utils"
import * as React from "react"

/** Page title block: the one large heading a page has, plus its actions. */
export function PageHeader({
  title,
  actions,
  className,
}: {
  title: React.ReactNode
  /** @deprecated titles stand alone now (Mercury style); ignored. */
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-x-4 gap-y-3",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col">
        <h1 className="text-heading text-2xl font-normal tracking-tight">
          {title}
        </h1>
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  )
}

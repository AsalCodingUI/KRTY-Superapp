import * as React from "react"
import { Inbox } from "@/components/icons"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: string
  description?: string
  subtitle?: string
  /** Custom icon. Pass `null` to hide the icon entirely. */
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  /**
   * outer: dashed outline (standalone empty state)
   * inner: no outline (inside a list, panel or dialog)
   */
  placement?: "outer" | "inner"
  className?: string
}

/**
 * Calm empty state: a small stacked tile with the icon, a clear title, one
 * line of help, and an optional next step.
 */
export function EmptyState({
  title,
  description,
  subtitle,
  icon,
  action,
  placement = "outer",
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "enter-rise flex w-full min-w-0 flex-col items-center justify-center px-6 py-14 text-center",
        placement === "outer" &&
          "border-border rounded-xl border border-dashed",
        className,
      )}
    >
      {icon !== null && (
        <div aria-hidden className="relative mb-5 size-12">
          <div className="bg-background shadow-control absolute inset-0 translate-x-1.5 -translate-y-1 rotate-6 rounded-xl dark:bg-[color-mix(in_oklab,#fff_8%,var(--background))]" />
          <div className="bg-background text-muted-foreground shadow-raised relative flex size-12 items-center justify-center rounded-xl dark:bg-[color-mix(in_oklab,#fff_14%,var(--background))] [&_svg]:size-5">
            {icon ?? <Inbox />}
          </div>
        </div>
      )}
      <p className="text-foreground text-sm font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-xs text-sm leading-relaxed text-balance">
          {description}
        </p>
      )}
      {subtitle && (
        <p className="text-muted-foreground mt-1 max-w-xs text-xs text-balance">
          {subtitle}
        </p>
      )}
      {action && (
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

export type { EmptyStateProps }

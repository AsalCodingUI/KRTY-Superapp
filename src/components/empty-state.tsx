import * as React from "react"
import { Hammer as HammerIcon } from "@/components/icons"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: string
  description: string
  subtitle?: string
  /** Custom icon. Pass `null` to hide the icon entirely. */
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  /**
   * outer: use rounded + border (standalone empty state)
   * inner: no rounded + no border (inside card/table/modal)
   */
  placement?: "outer" | "inner"
  className?: string
}

export function EmptyState({
  title,
  description,
  subtitle,
  icon,
  action,
  placement = "outer",
  className,
}: EmptyStateProps) {
  const isInner = placement === "inner"

  return (
    <Empty
      className={cn(
        "min-h-[220px] gap-0 p-3",
        isInner
          ? "rounded-none border-0 bg-transparent"
          : "border-border rounded-lg border border-solid",
        className,
      )}
    >
      <EmptyHeader className="gap-0">
        {icon !== null && (
          <EmptyMedia
            variant="icon"
            className="bg-muted text-muted-foreground mb-0 size-10 rounded-lg"
          >
            {icon || <HammerIcon className="size-5" />}
          </EmptyMedia>
        )}
        <EmptyTitle
          className={cn(
            "text-muted-foreground font-sans text-sm font-medium tracking-normal",
            icon !== null && "mt-4",
          )}
        >
          {title}
        </EmptyTitle>
        <EmptyDescription className="text-muted-foreground mt-1 text-sm font-medium">
          {description}
        </EmptyDescription>
        {subtitle && (
          <EmptyDescription className="text-muted-foreground mt-1 text-sm font-medium">
            {subtitle}
          </EmptyDescription>
        )}
      </EmptyHeader>
      {action && (
        <EmptyContent className="mt-6">
          <Button variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}

export type { EmptyStateProps }

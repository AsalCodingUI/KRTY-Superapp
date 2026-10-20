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
          : "rounded-lg border border-solid border-border bg-card",
        className,
      )}
    >
      <EmptyHeader className="gap-0">
        {icon !== null && (
          <EmptyMedia
            variant="icon"
            className="mb-0 size-12 rounded-full bg-muted text-muted-foreground"
          >
            {icon || <HammerIcon className="size-5" />}
          </EmptyMedia>
        )}
        <EmptyTitle
          className={cn(
            "font-sans text-label-md tracking-normal text-muted-foreground",
            icon !== null && "mt-4",
          )}
        >
          {title}
        </EmptyTitle>
        <EmptyDescription className="mt-1 text-label-sm text-muted-foreground">
          {description}
        </EmptyDescription>
        {subtitle && (
          <EmptyDescription className="mt-1 text-label-sm text-muted-foreground">
            {subtitle}
          </EmptyDescription>
        )}
      </EmptyHeader>
      {action && (
        <EmptyContent className="mt-6">
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}

export type { EmptyStateProps }

import { Button } from "@/shared/ui"
import { cx } from "@/shared/lib/utils"
import { RiHammerLine } from "@/shared/ui/lucide-icons"
import React from "react"

interface EmptyStateProps {
  title: string
  description: string
  subtitle?: string
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
    <div
      className={cx(
        "flex min-h-[220px] w-full flex-col items-center justify-center px-xl py-xl text-center",
        isInner
          ? "bg-transparent"
          : "rounded-lg border border-neutral-primary bg-surface-neutral-primary",
        className,
      )}
    >
      {icon !== null && (
        <div className="flex size-12 items-center justify-center rounded-full bg-surface-neutral-secondary text-foreground-secondary">
          {icon || <RiHammerLine className="size-5" />}
        </div>
      )}

      <h3
        className={cx(
          icon !== null ? "mt-4" : "",
          "text-label-md text-foreground-secondary",
        )}
      >
        {title}
      </h3>

      <p className="mt-1 max-w-sm text-label-sm text-foreground-secondary">
        {description}
      </p>

      {subtitle && (
        <p className="mt-1 max-w-sm text-label-sm text-foreground-secondary">
          {subtitle}
        </p>
      )}

      {action && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-6"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

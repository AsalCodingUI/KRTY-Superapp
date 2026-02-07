import { Button } from "@/shared/ui"
import { cx } from "@/shared/lib/utils"
import { RiHammerLine } from "@/shared/ui/lucide-icons"
import React from "react"

/**
 * EmptyState component for placeholder states.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="No projects found"
 *   description="Get started by creating a new project."
 *   action={{ label: "Create Project", onClick: () => {} }}
 * />
 * ```
 */
interface EmptyStateProps {
  title: string
  description: string
  subtitle?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  variant?: "default" | "compact"
  className?: string
}

export function EmptyState({
  title,
  description,
  subtitle,
  icon,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const isCompact = variant === "compact"

  return (
    <div
      className={cx(
        "flex w-full flex-col items-center justify-center rounded-lg border border-neutral-primary bg-surface-neutral-primary text-center",
        isCompact ? "px-xl py-lg" : "min-h-[240px] px-2xl py-2xl",
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
          isCompact ? "text-heading-sm" : "text-heading-md",
          "text-foreground-primary",
        )}
      >
        {title}
      </h3>
      <p
        className={cx(
          "mt-2 max-w-sm text-foreground-secondary",
          isCompact ? "text-body-sm" : "text-label-md",
        )}
      >
        {description}
      </p>
      {subtitle && (
        <p className="text-body-xs mt-1 max-w-sm text-foreground-tertiary">
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

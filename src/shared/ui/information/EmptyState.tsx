import { Button } from "@/shared/ui"
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
}

export function EmptyState({
  title,
  description,
  subtitle,
  icon,
  action,
  variant = "default",
}: EmptyStateProps) {
  const isCompact = variant === "compact"

  return (
    <div
      className={`flex w-full flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center dark:border ${isCompact ? "h-auto py-8" : "h-[400px]"}`}
    >
      {icon !== null && (
        <div className="flex items-center justify-center">
          {icon || (
            <RiHammerLine className="text-content dark:text-content size-6" />
          )}
        </div>
      )}
      <h3
        className={`${icon !== null ? "mt-4" : ""} text-heading-md text-content dark:text-content`}
      >
        {title}
      </h3>
      <p className="text-label-md text-content-subtle dark:text-content-placeholder mt-2 max-w-sm">
        {description}
      </p>
      {subtitle && (
        <p className="text-body-xs text-content-placeholder dark:text-content-subtle mt-1 max-w-sm opacity-70">
          {subtitle}
        </p>
      )}
      {action && (
        <Button variant="secondary" className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

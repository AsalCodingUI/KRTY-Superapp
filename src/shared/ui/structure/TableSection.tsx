import { cx } from "@/shared/lib/utils"
import React from "react"

interface TableSectionProps {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
}

/**
 * TableSection - Consistent wrapper for all tables
 *
 * Provides standardized outer border, header, and layout for tables.
 * Based on Attendance History design pattern.
 *
 * @example
 * <TableSection title="Team Members" description="Manage your team">
 *   <Table>...</Table>
 * </TableSection>
 */
export function TableSection({
  title,
  description,
  actions,
  children,
  className,
  headerClassName,
  contentClassName,
}: TableSectionProps) {
  const hasHeader = Boolean(title || description || actions)

  return (
    <div
      className={cx(
        "rounded-lg border border-neutral-primary bg-surface-neutral-primary overflow-hidden",
        className,
      )}
    >
      {hasHeader && (
        <div
          className={cx(
            "flex items-center justify-between gap-4 px-xl py-lg",
            headerClassName,
          )}
        >
          {title && (
            <div className="min-w-0">
              <h3 className="text-label-md text-foreground-primary">{title}</h3>
              {description && (
                <p className="text-body-sm text-foreground-tertiary mt-1">
                  {description}
                </p>
              )}
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {/* Content area - no extra padding, let children control their layout */}
      {contentClassName ? (
        <div className={contentClassName}>{children}</div>
      ) : (
        children
      )}
    </div>
  )
}

export type { TableSectionProps }
